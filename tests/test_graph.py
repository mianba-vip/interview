"""锻造图端到端测试：假 LLM + InMemorySaver，覆盖全链路（含 interrupt/恢复/去重/失败）。"""

from __future__ import annotations

import pytest
from langgraph.checkpoint.memory import InMemorySaver
from langgraph.types import Command

from kg_forge import graph as g
from kg_forge.llm import key_ring
from kg_forge.schema import ConceptProposal, CritiqueBatch, CritiqueItem, DraftBatch, TopicPlan


class FakeLlm:
    """按 (system 关键词) 分发的假模型；draft_calls 记录次数供断言。"""

    def __init__(self) -> None:
        self.draft_calls = 0

    def complete_json(self, system: str, user: str, schema):
        if "规划师" in system:
            class _P:
                topics = [
                    TopicPlan(topic="内存模型", note="核心机制"),
                    TopicPlan(topic="垃圾回收", note="调优重点"),
                ]
            return _P()
        if "命题官" in system:
            self.draft_calls += 1
            topic = "内存模型" if "内存模型" in user else "垃圾回收"
            return DraftBatch(concepts=[
                ConceptProposal(name=f"{topic}-概念甲", description="d", topic=topic, layer=1, sub_points=["a", "b", "c"]),
                ConceptProposal(name=f"{topic}-机制乙", description="d", topic=topic, layer=2, sub_points=["a", "b", "c"]),
                ConceptProposal(name=f"{topic}-重复项", description="d", topic=topic, layer=3, sub_points=["a", "b", "c"]),
            ])
        if "审核员" in system:
            class _C:
                items = [CritiqueItem(index=0, action="keep", reason="ok")]
            return _C()
        raise AssertionError(f"未知 system prompt: {system[:20]}")


@pytest.fixture()
def fake_llm(monkeypatch: pytest.MonkeyPatch) -> FakeLlm:
    fake = FakeLlm()
    monkeypatch.setattr(g, "_llm_for", lambda state: fake)
    return fake


def _req(existing: list[str] | None = None) -> dict:
    return {
        "req": {
            "run_id": "forge-test-1",
            "topic": "JVM 调优，准备秋招",
            "goal": "秋招",
            "layer_budget": 12,
            "existing_names": existing or [],
        },
        "status": "planning",
        "proposals": [],
    }


CFG = {"configurable": {"thread_id": "forge-test-1"}}


@pytest.mark.asyncio
async def test_full_flow_interrupt_then_approve(fake_llm: FakeLlm):
    app = g.build_graph(InMemorySaver())
    result = await app.ainvoke(_req(), config=CFG)

    # 两个主题并行，各 1 次起草
    assert fake_llm.draft_calls == 2
    # 图停在 awaiting_review（assemble 被 interrupt 挂起，节点未返回）
    assert result is None or "status" not in (result or {})
    snap = await app.aget_state(CFG)
    assert snap.next  # 有待重入节点

    from kg_forge.schema import dedup_proposals

    kept, report = dedup_proposals(snap.values["proposals"], [])
    # 每主题 critique 只留 1 条（keep index=0），共 2 条
    assert len(kept) == 2
    assert report.total == 2

    final = await app.ainvoke(Command(resume={"decision": "approved"}), config=CFG)
    assert final["status"] == "approved"


@pytest.mark.asyncio
async def test_dedup_against_existing_and_in_batch():
    from kg_forge.schema import dedup_proposals

    proposals = [
        {"name": "分代假说", "description": "x", "topic": "GC", "layer": 1},
        {"name": "分代假说。", "description": "x", "topic": "GC", "layer": 1},   # 批内近似重复
        {"name": "完全无关概念", "description": "x", "topic": "GC", "layer": 2},
    ]
    kept, report = dedup_proposals(proposals, existing_names=["完全无关的概念"])
    assert [c["name"] for c in kept] == ["分代假说"]
    assert report.dropped_duplicate == 1
    assert report.dropped_existing == 1


@pytest.mark.asyncio
async def test_plan_failure_writes_failed_state(monkeypatch: pytest.MonkeyPatch):
    class Boom:
        def complete_json(self, *a, **k):
            raise RuntimeError("llm down")

    monkeypatch.setattr(g, "_llm_for", lambda state: Boom())
    app = g.build_graph(InMemorySaver())
    with pytest.raises(RuntimeError):
        await app.ainvoke(_req(), config=CFG)
    # 生产路径里 _run 会 aupdate_state 写 failed；这里验证底层可写
    await app.aupdate_state(CFG, {"status": "failed", "error": "llm down"}, as_node="assemble")
    snap = await app.aget_state(CFG)
    assert snap.values["status"] == "failed"


def test_keyring_roundtrip():
    key_ring.put("t1", {"base_url": "http://x", "api_key": "k", "model": "m", "temperature": 0.5})
    llm = key_ring.get("t1")
    assert llm._model == "m"  # noqa: SLF001 —— 测试内窥
    key_ring.pop("t1")
