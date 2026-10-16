"""FastAPI 入口：interview 后端（DurableJobWorker）↔ 锻造图 的全部通道。

三条端点，一条安全线：
- POST /runs            触发锻造（异步开跑，立即 202）
- GET  /runs/{id}       查询状态：running / awaiting_review（含提案载荷）/ 终态
- POST /runs/{id}/finalize  审核结论恢复图（approved / rejected）

安全：X-Forge-Secret 必须匹配；BYOK 只经 KeyRing 驻内存，绝不进 checkpoint。
"""

from __future__ import annotations

import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI, Header, HTTPException
from langgraph.checkpoint.base import BaseCheckpointSaver
from langgraph.types import Command

from .config import settings
from .graph import build_graph
from .llm import key_ring
from .schema import FINAL_STATUSES, ForgeRequest, FinalizeRequest, dedup_proposals

log = logging.getLogger(__name__)

GRAPH = None  # 编译好的图（含 checkpointer），在 lifespan 里初始化


@asynccontextmanager
async def lifespan(app: FastAPI):
    """AsyncPostgresSaver 持有异步连接，必须在 async with 生命周期内使用；
    setup() 是协程（自建 ckpt_* 表，幂等），随服务启动执行一次。"""
    global GRAPH
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


app = FastAPI(title="kg-forge", lifespan=lifespan)


@app.get("/healthz")
async def healthz() -> dict:
    return {"ok": True}


@app.post("/runs", status_code=202)
async def start_run(req: ForgeRequest, x_forge_secret: str | None = Header(default=None)) -> dict:
    _require_secret(x_forge_secret)
    key_ring.put(req.run_id, req.llm.model_dump() if req.llm else None)

    import asyncio

    asyncio.create_task(_run(req))
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
        key_ring.pop(req.run_id)  # key 只在跑图期间驻内存


@app.get("/runs/{run_id}")
async def get_run(run_id: str, x_forge_secret: str | None = Header(default=None)) -> dict:
    _require_secret(x_forge_secret)
    snapshot = await GRAPH.aget_state(_config(run_id))
    values = snapshot.values if snapshot.values else {}
    status = values.get("status")

    if status in FINAL_STATUSES:
        return {"status": status, "error": values.get("error"), "coverage": values.get("coverage")}

    # interrupt 挂起：assemble 待重入 → 审核页载荷从已合并提案现算（与节点内同一纯函数）
    if status in ("forging",) and snapshot.next:
        interrupted = any(
            getattr(t, "interrupts", None) for t in (snapshot.tasks or {}).values()
        )
        if interrupted:
            kept, report = dedup_proposals(
                list(values.get("proposals", [])), values.get("req", {}).get("existing_names", [])
            )
            return {
                "status": "awaiting_review",
                "concepts": kept,
                "report": report.model_dump(),
            }
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
