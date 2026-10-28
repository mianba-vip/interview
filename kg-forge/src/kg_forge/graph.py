"""锻造图本体。

    START → plan ──Send 播种──► forge_topic(每主题并行) ──► assemble ──interrupt──► END
                (批内自带 ≤2 轮修复循环)                    (全局去重+报告+人工审核挂起)

严格逻辑的边界：
- 每个节点的循环都有硬上限（plan 修复 ≤2 轮、critique 单轮裁决），不存在无界循环；
- interrupt 挂起时节点重入是幂等的（去重/报告为纯函数，见 schema.dedup_proposals）；
- 图不写任何业务库——提案只留在 checkpoint；批准后的落库由 interview 后端完成。
"""

from __future__ import annotations

import logging
import math

try:  # langgraph >= 0.2.6x
    from langgraph.types import Command, Send, interrupt
except ImportError:  # 兼容旧布局
    from langgraph.constants import Send  # type: ignore
    from langgraph.types import Command, interrupt  # type: ignore

from langgraph.checkpoint.base import BaseCheckpointSaver
from langgraph.graph import END, START, StateGraph
from pydantic import BaseModel

from . import prompts
from .llm import Llm, key_ring
from .schema import (
    ConceptProposal,
    CritiqueBatch,
    DraftBatch,
    ForgeState,
    TopicPlan,
    dedup_proposals,
)

log = logging.getLogger(__name__)

_MAX_PLAN_ROUNDS = 2
_MIN_TOPICS, _MAX_TOPICS = 2, 6


def _llm_for(state: ForgeState) -> Llm:
    return key_ring.get(state["req"]["run_id"])


def plan_node(state: ForgeState) -> dict:
    """方向 → 主题拆解（带 ≤2 轮自检修复：主题数、预算可行性）。"""
    req = state["req"]
    llm = _llm_for(state)
    user = prompts.PLAN_USER_TMPL.format(
        topic=req["topic"], goal=req.get("goal") or "（未说明）", layer_budget=req.get("layer_budget", 50)
    )
    last_error: str | None = None
    for round_no in range(1, _MAX_PLAN_ROUNDS + 1):
        try:
            batch = llm.complete_json(prompts.PLAN_SYSTEM, user + (f"\n\n上一轮问题：{last_error}" if last_error else ""),
                                      _PlanBatch)
            topics = batch.topics
            if not (_MIN_TOPICS <= len(topics) <= _MAX_TOPICS):
                last_error = f"主题数必须为 {_MIN_TOPICS}-{_MAX_TOPICS} 个，当前 {len(topics)}"
                continue
            # 预算可行性：每个主题至少值得 3 个概念
            if len(topics) * 3 > int(req.get("layer_budget", 50)) * 2:
                last_error = "主题数相对预算过多（每主题至少 3 个概念）"
                continue
            return {"topics": [t.model_dump() for t in topics], "status": "forging"}
        except Exception as e:  # noqa: BLE001
            last_error = str(e)
            log.warning("plan 第 %s 轮失败：%s", round_no, e)
    raise RuntimeError(f"规划失败：{last_error}")


class _PlanBatch(BaseModel):
    topics: list[TopicPlan]


def _fan_out_topics(state: ForgeState) -> list[Send]:
    """plan → 每个主题一条并行支线（Send 播种 branch 上下文，主题数随 req 带给支线分摊预算）。
    注意:状态键叫 topics 而非 plan——新版 langgraph 禁止节点名与状态键重名。"""
    req = {**state["req"], "_topic_count": len(state["topics"])}
    return [Send("forge_topic", {"req": req, "branch": topic_item}) for topic_item in state["topics"]]


def forge_topic_node(state: ForgeState) -> dict:
    """单主题支线：起草 → 审核 → 应用裁决。每主题恰好两次 LLM 调用，无循环。"""
    req, branch = state["req"], state["branch"]
    llm = _llm_for(state)
    per_topic = max(3, math.ceil(int(req.get("layer_budget", 50)) / max(1, int(req.get("_topic_count", 6)))))
    existing = "、".join(req.get("existing_names", [])[:80]) or "（无）"

    draft = llm.complete_json(
        prompts.DRAFT_SYSTEM.format(existing=existing, per_topic=per_topic),
        prompts.DRAFT_USER_TMPL.format(
            topic_intent=req["topic"], topic=branch["topic"],
            note=branch.get("note") or "核心考察", per_topic=per_topic, existing=existing,
        ),
        DraftBatch,
    )
    # topic 归一为主题计划名，防模型自造主题
    for c in draft.concepts:
        c.topic = branch["topic"]

    critique = llm.complete_json(
        prompts.CRITIQUE_SYSTEM,
        prompts.CRITIQUE_USER_TMPL.format(
            topic=branch["topic"], existing=existing,
            proposals=_render_proposals(draft.concepts),
        ),
        CritiqueBatch,
    )

    kept: list[ConceptProposal] = []
    by_index = {i: c for i, c in enumerate(draft.concepts)}
    for item in critique.items:
        c = by_index.get(item.index)
        if c is None:
            continue
        if item.action == "keep":
            kept.append(c)
        elif item.action == "fix" and item.fixed_name:
            kept.append(
                c.model_copy(update={
                    "name": item.fixed_name.strip() or c.name,
                    "description": (item.fixed_description or c.description).strip(),
                })
            )
        # drop：直接不保留
    log.info("主题 %s：%s 起草 → %s 保留", branch["topic"], len(draft.concepts), len(kept))
    return {"proposals": [c.model_dump() for c in kept]}


def _render_proposals(concepts: list[ConceptProposal]) -> str:
    return "\n".join(
        f'{i}. [{c.layer}] {c.name} —— {c.description}'
        for i, c in enumerate(concepts)
    )


def assemble_node(state: ForgeState) -> dict:
    """全局去重 + 覆盖报告 + 人工审核挂起（interrupt）。

    interrupt 恢复时本节点会整体重入：去重与报告是纯函数，重算无害；
    决策值由 resume 注入。批准后的写库在 Java 侧，本节点只记录结论。
    """
    kept, report = dedup_proposals(list(state.get("proposals", [])), state["req"].get("existing_names", []))
    decision = interrupt({
        "message": "知识图谱提案已就绪，等待人工审核",
        "concepts": kept,
        "report": report.model_dump(),
    })
    status = decision.get("decision") if isinstance(decision, dict) else "rejected"
    return {"status": status if status in ("approved", "rejected", "cancelled") else "rejected",
            "coverage": report.model_dump()}


def build_graph(checkpointer: BaseCheckpointSaver):
    g = StateGraph(ForgeState)
    g.add_node("plan", plan_node)
    g.add_node("forge_topic", forge_topic_node)
    g.add_node("assemble", assemble_node)
    g.add_edge(START, "plan")
    g.add_conditional_edges("plan", _fan_out_topics, ["forge_topic"])
    g.add_edge("forge_topic", "assemble")
    g.add_edge("assemble", END)
    return g.compile(checkpointer=checkpointer)
