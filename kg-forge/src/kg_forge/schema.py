"""图状态与提案的数据契约（与 interview 后端 / mianba-web 的字段一一对应）。

层级语义严格对齐 interview 的 Concept：layer 1→5 由浅入深
（概念 → 机制 → 实现 → 权衡 → 故障）。Agent 只产出提案，
落库前的硬校验与去重全部在 Java 侧完成。
"""

from __future__ import annotations

import operator
import re
from typing import Annotated, Literal, TypedDict

from pydantic import BaseModel, Field


class TopicPlan(BaseModel):
    """plan 节点产出：把方向意图拆成若干 topic（知识矩阵的「行」）。"""

    topic: str = Field(description="主题名，如「垃圾回收」，2-12 字")
    note: str | None = Field(default=None, description="该主题的考察侧重一句话")


class ConceptProposal(BaseModel):
    """单条概念提案（对应 interview 的 concept 表一行 + lesson_outline）。"""

    name: str = Field(description="知识点名称，如「分代假说」")
    description: str = Field(description="一句话描述这个知识点是什么、考什么")
    topic: str = Field(description="所属主题（来自计划）")
    layer: int = Field(ge=1, le=5, description="层级 1概念/2机制/3实现/4权衡/5故障")
    sub_points: list[str] = Field(default_factory=list, description="先教后考的子知识点清单 3-8 条")
    source: str = "model"  # 提案来源：model（本次不接语料/网络检索，预留扩展位）


class DraftBatch(BaseModel):
    """draft 节点产出：单个 topic 的一批概念提案。"""

    concepts: list[ConceptProposal]


class CritiqueItem(BaseModel):
    """critique 节点产出：对某条提案的裁决。"""

    index: int = Field(description="对应 concepts 数组下标")
    action: Literal["keep", "fix", "drop"]
    reason: str
    fixed_name: str | None = None
    fixed_description: str | None = None


class CritiqueBatch(BaseModel):
    items: list[CritiqueItem]


class LlmConfig(BaseModel):
    """BYOK：由后端随任务传入，只存在于进程内存（KeyRing），绝不进 checkpoint。"""

    base_url: str
    api_key: str
    model: str
    temperature: float = 0.7


class ForgeRequest(BaseModel):
    """POST /runs 请求体（由 interview 后端的 DurableJobWorker 发起）。"""

    run_id: str                       # = LangGraph thread_id，= Java 侧 kg_forge_run.thread_id
    topic: str                        # 学习方向意图，如「JVM 调优，准备秋招」
    goal: str | None = None
    layer_budget: int = 50            # 概念总数预算（审核页的阅读负担上限）
    existing_names: list[str] = Field(default_factory=list)  # 已有概念名（Java 侧快照，用于去重）
    llm: LlmConfig | None = None      # 用户 BYOK；不传则用服务端兜底配置


class FinalizeRequest(BaseModel):
    """POST /runs/{id}/finalize：审核结论（批准/拒绝）恢复被 interrupt 挂起的图。"""

    decision: Literal["approved", "rejected"]
    note: str | None = None


class CoverageReport(BaseModel):
    """汇聚报告：审核页顶部的覆盖度摘要。"""

    topic_layer: dict[str, dict[str, int]] = Field(default_factory=dict)  # {topic: {"1": n, ...}}
    total: int = 0
    dropped_duplicate: int = 0
    dropped_existing: int = 0


class ForgeState(TypedDict, total=False):
    """图状态。proposals 用 operator.add 归并——并行分支（Send）各自追加。"""

    req: dict                          # ForgeRequest 除 llm 外的字段（key 绝不入状态）
    topics: list[dict]                 # TopicPlan.model_dump 列表（键不叫 plan：langgraph 禁止与节点名重名）
    branch: dict                       # Send 播种的当前支线上下文（topic 计划项）
    proposals: Annotated[list[dict], operator.add]
    status: str                        # planning/forging/awaiting_review/approved/rejected/failed
    error: str | None
    coverage: dict | None


FINAL_STATUSES = {"approved", "rejected", "failed"}


# 与 interview 的 NgramSimilarityGuard 同语义：字符级 trigram Jaccard。
# 2026-10-21 修订两处盲区：
#   ① 比较前先做标点/空白归一（模型爱在名称尾巴带「。」或空格不一致）；
#   ② 补「包含度」判重（交集/较小集 ≥0.92，且较小集 ≥2 个 trigram 才启用，
#     防 JVM 这类超短名误伤一切），抓「原文 + 后缀词」变体
#     （分代假说 vs 分代假说基础 这类 Jaccard 只有 ~0.6 的近重复）。
# 主判据 Jaccard >0.85 与 Java 侧保持一致；Java 的 NgramSimilarityGuard
# 若要同款增强，可在其判重调用处并行采用 containment（方法已存在）。
_NAME_PUNCT_RE = re.compile(r"[\s。·、，,;；:：!！?？…\-—～~·()（）\[\]【】《》「」『』'\"‘’“”]+")


def _norm_name(s: str) -> str:
    return _NAME_PUNCT_RE.sub("", (s or "").strip())


def _trigrams(s: str) -> set[str]:
    t = _norm_name(s)
    if len(t) < 3:
        return {t}
    return {t[i : i + 3] for i in range(len(t) - 2)}


def similarity(a: str, b: str) -> float:
    ta, tb = _trigrams(a), _trigrams(b)
    if not ta or not tb:
        return 0.0
    return len(ta & tb) / len(ta | tb)


DUP_THRESHOLD = 0.85  # 与 interview QuestionService.DUP_THRESHOLD 同值
CONTAIN_THRESHOLD = 0.92  # 包含度判重线（较 Jaccard 略高，宁少误杀）


def is_dup(a: str, b: str) -> bool:
    """判重三道闸：归一后同名 / trigram Jaccard / 受保护的包含度。

    包含度的两道护栏：较小名 ≥2 个 trigram（防「JVM」这类超短名命中一切）；
    归一后长度比 ≤1.7（防子串误杀——HashMap ⊂ ConcurrentHashMap 但不是重复）。
    """
    na, nb = _norm_name(a), _norm_name(b)
    if not na or not nb:
        return False
    if na == nb:
        return True
    ta, tb = _trigrams(a), _trigrams(b)
    if not ta or not tb:
        return False
    inter = len(ta & tb)
    if inter / len(ta | tb) > DUP_THRESHOLD:
        return True
    la, lb = len(na), len(nb)
    if max(la, lb) > min(la, lb) * 1.7:
        return False
    smaller = min(len(ta), len(tb))
    return smaller >= 2 and inter / smaller >= CONTAIN_THRESHOLD


def dedup_proposals(proposals: list[dict], existing_names: list[str]) -> tuple[list[dict], CoverageReport]:
    """纯函数：全局去重（批内 + 与已有概念），供 assemble 节点与 GET /runs 共用。

    assemble 节点被 interrupt 挂起时节点返回值尚未写入状态，审核页的载荷
    必须能从已合并的 proposals 现算——所以去重逻辑放这里，两处共用一套真相。
    """
    report = CoverageReport()
    kept: list[dict] = []
    kept_names: list[str] = []
    existing = [n for n in existing_names if n]
    for p in proposals:
        name = (p.get("name") or "").strip()
        if not name:
            continue
        if any(is_dup(name, k) for k in kept_names):
            report.dropped_duplicate += 1
            continue
        if any(is_dup(name, e) for e in existing):
            report.dropped_existing += 1
            continue
        kept.append({**p, "name": name})
        kept_names.append(name)
    report.total = len(kept)
    for p in kept:
        layers = report.topic_layer.setdefault(p.get("topic") or "未分组", {})
        key = str(p.get("layer") or 1)
        layers[key] = layers.get(key, 0) + 1
    return kept, report
