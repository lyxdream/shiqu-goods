from collections import defaultdict

# session_id -> list[{role, content}]
_sessions: dict[str, list[dict[str, str]]] = defaultdict(list)


def append_message(session_id: str | None, role: str, content: str) -> None:
    if not session_id:
        return
    _sessions[session_id].append({"role": role, "content": content})


def get_history(session_id: str | None, limit: int = 10) -> list[dict[str, str]]:
    if not session_id:
        return []
    return _sessions[session_id][-limit:]
