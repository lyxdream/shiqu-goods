"""
LLM 调用封装。
- 仅在 settings.llm_enabled=True 且 llm_api_key 非空时生效。
- 调用失败（网络错误、超时、API 限流）统一返回 None，由调用方决定是否降级。
"""

import json

from openai import OpenAI

from app.config import settings

_client: OpenAI | None = None


def _get_client() -> OpenAI:
    global _client
    if _client is None:
        _client = OpenAI(
            api_key=settings.llm_api_key,
            base_url=settings.llm_base_url,
        )
    return _client


def ask(
    system: str,
    user: str,
    history: list[dict] | None = None,
) -> str | None:
    """
    发起单次对话，返回模型回复文本。
    失败时返回 None。
    history 格式：[{"role": "user"/"assistant", "content": "..."}]
    """
    if not settings.llm_enabled or not settings.llm_api_key:
        return None

    messages: list[dict] = [{"role": "system", "content": system}]
    if history:
        messages.extend(history[-6:])  # 最近 3 轮上下文
    messages.append({"role": "user", "content": user})

    try:
        resp = _get_client().chat.completions.create(
            model=settings.llm_model,
            messages=messages,
            temperature=0.7,
            max_tokens=800,
        )
        return resp.choices[0].message.content
    except Exception:
        return None


def ask_json(
    system: str,
    user: str,
    history: list[dict] | None = None,
) -> dict | None:
    """
    要求 LLM 以 JSON 格式回复（用于需要返回结构化数据的场景，如推荐/凑单）。
    失败或解析错误时返回 None。
    """
    if not settings.llm_enabled or not settings.llm_api_key:
        return None

    messages: list[dict] = [{"role": "system", "content": system}]
    if history:
        messages.extend(history[-6:])
    messages.append({"role": "user", "content": user})

    try:
        resp = _get_client().chat.completions.create(
            model=settings.llm_model,
            messages=messages,
            temperature=0.3,
            max_tokens=800,
            response_format={"type": "json_object"},
        )
        content = resp.choices[0].message.content or ""
        return json.loads(content)
    except Exception:
        return None
