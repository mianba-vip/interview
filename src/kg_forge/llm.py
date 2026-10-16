"""LLM 调用层：OpenAI 兼容 + 结构化输出（json_object + Pydantic 解析 + 带错重试）。

与 interview 后端 StructuredOutputInvoker 同一套纪律：解析失败把错误喂回去重试，
最多 2 次；BYOK key 由 KeyRing 按 thread_id 提供（调用时再取，不进任何持久化状态）。
"""

from __future__ import annotations

import json
import logging
import re
from typing import TypeVar

from openai import OpenAI
from pydantic import BaseModel

from .config import settings

log = logging.getLogger(__name__)

T = TypeVar("T", bound=BaseModel)

_MAX_ATTEMPTS = 3  # 1 次原始 + 2 次带错重试（对齐 Java StructuredOutputInvoker）


def _strip_fences(text: str) -> str:
    """剥离 ```json 围栏 / 首尾杂文，截取首个 { 到最后一个 }。"""
    t = text.strip()
    t = re.sub(r"^```(?:json)?\s*", "", t)
    t = re.sub(r"\s*```$", "", t)
    start, end = t.find("{"), t.rfind("}")
    if start >= 0 and end > start:
        return t[start : end + 1]
    return t


class Llm:
    """每次调用用调用方的 key 实例化（无全局 client，key 不落任何共享结构）。"""

    def __init__(self, base_url: str, api_key: str, model: str, temperature: float = 0.7) -> None:
        self._client = OpenAI(base_url=base_url, api_key=api_key, timeout=120.0, max_retries=0)
        self._model = model
        self._temperature = temperature

    def complete_json(self, system: str, user: str, schema: type[T]) -> T:
        """一次结构化调用：失败带错重试，全部失败抛 RuntimeError。"""
        last_error: Exception | None = None
        current_user = user
        for attempt in range(1, _MAX_ATTEMPTS + 1):
            try:
                resp = self._client.chat.completions.create(
                    model=self._model,
                    temperature=self._temperature,
                    response_format={"type": "json_object"},
                    messages=[
                        {"role": "system", "content": system},
                        {"role": "user", "content": current_user},
                    ],
                )
                content = resp.choices[0].message.content or ""
                # 推理模型偶发只回 reasoning：显式报错走重试，而不是解析出空对象
                if not content.strip():
                    raise ValueError("模型返回空 content（可能只输出了 reasoning_content）")
                return schema.model_validate_json(_strip_fences(content))
            except Exception as e:  # noqa: BLE001 —— 统一喂回重试
                last_error = e
                log.warning("结构化输出解析失败 attempt=%s/%s: %s", attempt, _MAX_ATTEMPTS, e)
                current_user = (
                    f"上次输出解析出错，请修正。\n错误信息：{e}\n\n---\n原始请求：\n{user}"
                )
        raise RuntimeError(f"结构化输出失败（已尝试 {_MAX_ATTEMPTS} 次）：{last_error}")


class KeyRing:
    """thread_id → 用户 BYOK 配置。仅进程内存；服务重启即失效（任务可重新触发）。"""

    def __init__(self) -> None:
        self._keys: dict[str, dict] = {}

    def put(self, thread_id: str, llm: dict | None) -> None:
        if llm:
            self._keys[thread_id] = llm

    def get(self, thread_id: str) -> Llm:
        cfg = self._keys.get(thread_id)
        if cfg:
            return Llm(
                base_url=cfg["base_url"],
                api_key=cfg["api_key"],
                model=cfg["model"],
                temperature=cfg.get("temperature", 0.7),
            )
        # 兜底：服务端默认 key（本地单机模式）；云端多用户应为空并在此报错
        if not settings.forge_api_key:
            raise RuntimeError("该任务没有可用的 LLM 配置（BYOK 未随任务传入且服务端未配置默认 key）")
        return Llm(settings.forge_base_url, settings.forge_api_key, settings.forge_model)

    def pop(self, thread_id: str) -> None:
        self._keys.pop(thread_id, None)


key_ring = KeyRing()
