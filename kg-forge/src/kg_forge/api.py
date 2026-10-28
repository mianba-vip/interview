"""FastAPI 入口：interview 后端（DurableJobWorker）↔ 锻造图 的全部通道。

三条端点，一条安全线：
- POST /runs            触发锻造（异步开跑，立即 202）
- GET  /runs/{id}       查询状态：running / awaiting_review（含提案载荷）/ 终态
- POST /runs/{id}/finalize  审核结论恢复图（approved / rejected）

安全：X-Forge-Secret 必须匹配；BYOK 只经 KeyRing 驻内存，绝不进 checkpoint。
"""

from __future__ import annotations

import asyncio
import logging
from contextlib import asynccontextmanager
from pathlib import Path

from fastapi import FastAPI, Header, HTTPException
from fastapi.responses import HTMLResponse, RedirectResponse
from langgraph.checkpoint.base import BaseCheckpointSaver
from langgraph.types import Command

from .config import settings
from .graph import build_graph
from .llm import key_ring
from .schema import FINAL_STATUSES, ForgeRequest, FinalizeRequest, dedup_proposals

log = logging.getLogger(__name__)

GRAPH = None  # 编译好的图（含 checkpointer），在 lifespan 里初始化

# asyncio.create_task 只被事件loop弱引用：不持强引用，跑几分钟的锻造任务可能被
# GC 中途回收（Python 官方文档明确要求保存返回的 Task）。
_BACKGROUND_TASKS: set = set()
# 本进程正在跑的 thread：防同进程重复触发（DurableJob 重试 / 双击触发）。
_ACTIVE_THREADS: set = set()
# run_id -> 真正跑图的 asyncio.Task,供取消锻造时精准掐断(止损 LLM 调用)
_RUN_TASKS: dict = {}


@asynccontextmanager
async def lifespan(app: FastAPI):
    """AsyncPostgresSaver 持有异步连接，必须在 async with 生命周期内使用；
    setup() 是协程（自建 ckpt_* 表，幂等），随服务启动执行一次。

    FORGE_CHECKPOINT=memory：开发测试模式（免 Postgres），checkpoint 只驻
    进程内存——重启即失、无断点续跑，API 契约不变。生产不要用。
    """
    global GRAPH
    if settings.forge_checkpoint == "memory":
        from langgraph.checkpoint.memory import InMemorySaver

        log.warning("FORGE_CHECKPOINT=memory：开发模式，checkpoint 不落库，重启即失")
        GRAPH = build_graph(InMemorySaver())
        yield
        return
    from langgraph.checkpoint.postgres.aio import AsyncPostgresSaver

    async with AsyncPostgresSaver.from_conn_string(settings.forge_db_url) as saver:
        await saver.setup()
        GRAPH = build_graph(saver)
        yield


def _config(run_id: str) -> dict:
    return {"configurable": {"thread_id": run_id}}


def _require_secret(x_forge_secret: str | None) -> None:
    if not x_forge_secret or x_forge_secret != settings.forge_secret:
        raise HTTPException(status_code=401, detail="invalid forge secret")


def _has_interrupt(snapshot) -> bool:
    """interrupt 挂起检测。兼容 langgraph 新旧两版 StateSnapshot.tasks 类型:
    旧版 dict[str, PregelTask],新版 tuple[PregelTask, ...]。"""
    tasks = snapshot.tasks or ()
    items = tasks.values() if isinstance(tasks, dict) else tasks
    return any(bool(getattr(t, "interrupts", None)) for t in items)


app = FastAPI(title="kg-forge", lifespan=lifespan)


@app.get("/healthz")
async def healthz() -> dict:
    return {"ok": True}


# ------------------------------------------------------------------ 测试台

_PLAYGROUND_HTML = Path(__file__).with_name("playground.html")


@app.get("/", include_in_schema=False)
async def index() -> RedirectResponse:
    return RedirectResponse("/playground")


@app.get("/playground", include_in_schema=False)
async def playground() -> HTMLResponse:
    """开发测试台：单文件静态页，由本服务同源提供（免 CORS）。

    页面本身不含任何数据，所有 /runs 查询仍需 X-Forge-Secret——与 API
    安全模型一致；仅用于本地/内网评估锻造质量，compose 不对公网发布。
    """
    return HTMLResponse(_PLAYGROUND_HTML.read_text(encoding="utf-8"))


@app.post("/runs", status_code=202)
async def start_run(req: ForgeRequest, x_forge_secret: str | None = Header(default=None)) -> dict:
    _require_secret(x_forge_secret)

    # 幂等护栏（防 DurableJob 重试/重复触发造成重复锻造重复扣费）：
    # ① 本进程正在跑 → 跳过；② 待人工审核或已终态 → 跳过；
    # ③ 停在 planning/forging 且本进程无任务（sidecar 中途崩溃重启后的陈旧
    #    checkpoint）→ 允许重跑，批内重复由去重纯函数兜底。
    if req.run_id in _ACTIVE_THREADS:
        return {"run_id": req.run_id, "accepted": True, "already": "running"}
    existing = await GRAPH.aget_state(_config(req.run_id))
    if existing.values:
        prior = existing.values.get("status", "")
        if prior == "awaiting_review" or prior in FINAL_STATUSES:
            log.info("重复触发 run_id=%s，已有状态 %s —— 幂等跳过", req.run_id, prior)
            return {"run_id": req.run_id, "accepted": True, "already": prior}
        log.info("陈旧 checkpoint 重跑 run_id=%s，此前状态 %s", req.run_id, prior)

    key_ring.put(req.run_id, req.llm.model_dump() if req.llm else None)
    _ACTIVE_THREADS.add(req.run_id)

    import asyncio

    task = asyncio.create_task(_run(req))
    _BACKGROUND_TASKS.add(task)
    _RUN_TASKS[req.run_id] = task
    task.add_done_callback(lambda t: (_BACKGROUND_TASKS.discard(t), _RUN_TASKS.pop(req.run_id, None)))
    return {"run_id": req.run_id, "accepted": True}


async def _run(req: ForgeRequest) -> None:
    """后台执行整张图。任何异常都写进图状态（aupdate_state），前端能看到失败原因。"""
    state_in: dict = {
        "req": req.model_dump(exclude={"llm"}),
        "status": "planning",
        "proposals": [],
    }
    try:
        await GRAPH.ainvoke(state_in, config=_config(req.run_id))
    except asyncio.CancelledError:
        # 用户取消:写 rejected 终态(与拒绝同语义,Java/前端无需新增枚举),再放行取消
        log.info("锻造被用户取消 run_id=%s", req.run_id)
        try:
            await GRAPH.aupdate_state(
                _config(req.run_id),
                {"status": "rejected", "error": None},
                as_node="assemble",
            )
        except Exception:  # noqa: BLE001
            log.exception("写入取消状态失败 run_id=%s", req.run_id)
        raise
    except Exception as e:  # noqa: BLE001
        log.exception("锻造失败 run_id=%s", req.run_id)
        try:
            await GRAPH.aupdate_state(
                _config(req.run_id),
                {"status": "failed", "error": str(e)},
                as_node="assemble",  # 终结在合法节点上，避免悬空的 next
            )
        except Exception:  # noqa: BLE001
            log.exception("写入失败状态也失败了 run_id=%s", req.run_id)
    finally:
        _ACTIVE_THREADS.discard(req.run_id)
        key_ring.pop(req.run_id)  # key 只在跑图期间驻内存


@app.get("/runs/{run_id}")
async def get_run(run_id: str, x_forge_secret: str | None = Header(default=None)) -> dict:
    _require_secret(x_forge_secret)
    snapshot = await GRAPH.aget_state(_config(run_id))
    values = snapshot.values if snapshot.values else {}
    status = values.get("status")

    # 查无此 thread(values 空):最常见原因是「dispatch 窗口期」——Java 侧刚建
    # kg_forge_run 行,前端立刻轮询,而 DurableJobWorker 要几秒后才 POST /runs
    # 过来。此时必须报 running 让前端继续等,绝不能报失败(会把行状态误写成
    # FAILED)。memory 开发模式下重启后的陈旧 run 也会走到这里表现为永远
    # forging——那是可接受的代价,生产(PG)模式 checkpoint 落库无此问题。
    if not values:
        return {"status": "running"}

    if status in FINAL_STATUSES:
        return {"status": status, "error": values.get("error"), "coverage": values.get("coverage")}

    # interrupt 挂起：assemble 待重入 → 审核页载荷从已合并提案现算（与节点内同一纯函数）
    if snapshot.next:
        if _has_interrupt(snapshot):
            kept, report = dedup_proposals(
                list(values.get("proposals", [])), values.get("req", {}).get("existing_names", [])
            )
            return {
                "status": "awaiting_review",
                "concepts": kept,
                "report": report.model_dump(),
            }
        # 有待跑节点但本进程没有对应任务 = sidecar 中途崩溃/重启遗留的陈旧 thread：
        # 如实报中断，别让前端永远转圈（重新发起一次锻造即可恢复）
        if run_id not in _ACTIVE_THREADS:
            return {"status": "failed", "error": "锻造因服务重启中断，请重新发起"}
    return {"status": status or "running"}


@app.post("/runs/{run_id}/finalize")
async def finalize(
    run_id: str, req: FinalizeRequest, x_forge_secret: str | None = Header(default=None)
) -> dict:
    _require_secret(x_forge_secret)
    snapshot = await GRAPH.aget_state(_config(run_id))
    if not snapshot.values:
        raise HTTPException(status_code=404, detail="run not found")
    if snapshot.values.get("status") in FINAL_STATUSES:
        return {"status": snapshot.values["status"], "already_final": True}
    if not snapshot.next:
        raise HTTPException(status_code=409, detail="run is not awaiting review")

    result = await GRAPH.ainvoke(Command(resume=req.model_dump()), config=_config(run_id))
    return {"status": result.get("status")}

@app.post("/runs/{run_id}/cancel")
async def cancel_run(run_id: str, x_forge_secret: str | None = Header(default=None)) -> dict:
    """取消正在锻造的 run:掐断后台任务(止损 LLM 调用),状态写 rejected。

    幂等:不在跑(未派发/已结束/未知)时返回 cancelled=False,不报错——
    Java 侧在 PENDING/RUNNING 阶段调用本端点,与派发窗口天然兼容。
    待审核(AWAITING_REVIEW)的取消走 finalize(rejected),不走这里。
    """
    _require_secret(x_forge_secret)
    task = _RUN_TASKS.get(run_id)
    if task is not None and not task.done():
        task.cancel()
        log.info("已请求取消 run_id=%s", run_id)
        return {"ok": True, "cancelled": True}
    return {"ok": True, "cancelled": False}
