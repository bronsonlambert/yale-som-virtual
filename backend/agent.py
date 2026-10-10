"""One PydanticAI agent per professor.

Each professor's instructions are built from the course database (bio + the courses they teach)
plus prompts/base.md and an optional speaking style in prompts/styles/<professor-id>.md.
"""

from __future__ import annotations

import json
import os
from datetime import datetime, timezone
from pathlib import Path

os.environ.setdefault("PYDANTIC_AI_NO_BANNER", "1")

from dotenv import dotenv_values, load_dotenv
from openai import AsyncOpenAI
from pydantic_ai import Agent, UsageLimits
from pydantic_ai.messages import ModelMessage, ModelResponse, ToolCallPart
from pydantic_ai.models.openai import OpenAIResponsesModel
from pydantic_ai.providers.openai import OpenAIProvider

import db
from models import ToolUse
from tools import ALL_TOOLS

BACKEND_DIR = Path(__file__).resolve().parent
PROMPTS_DIR = BACKEND_DIR / "prompts"
STYLES_DIR = PROMPTS_DIR / "styles"
AUDIT_PATH = BACKEND_DIR / "output" / "audit_trail.json"

# Only PORTKEY_API_KEY comes from the class-folder .env (its OPENAI_MODEL is for older projects).
# Override the model with a real OPENAI_MODEL env var or a backend/.env file.
load_dotenv(BACKEND_DIR / ".env")
for parent in BACKEND_DIR.parents:
    key = dotenv_values(parent / ".env").get("PORTKEY_API_KEY") if (parent / ".env").exists() else None
    if key:
        os.environ.setdefault("PORTKEY_API_KEY", key)
        break
MODEL_NAME = os.getenv("OPENAI_MODEL", "gpt-6-luna")

MAX_HISTORY_TURNS = 12
LIMITS = UsageLimits(request_limit=10, tool_calls_limit=20)  # broad questions fan out into several parallel searches


def style_path(professor_id: str) -> Path | None:
    path = STYLES_DIR / f"{professor_id}.md"
    return path if path.exists() else None


def _courses_text(courses: list[dict]) -> str:
    lines = []
    for c in courses:
        lines.append(f"- **{c['course_number']} {c['title']}** ({c['category']}, {c['units']} units)")
        for s in c["sections"]:
            lines.append(f"  - Section {s['section']}: {s['meets']}, room {s['room']}, session {s['session']}")
        if c.get("description"):
            lines.append(f"  - Description: {c['description']}")
    return "\n".join(lines) or "(No courses listed.)"


def build_instructions(professor_id: str) -> str:
    profile = db.instructor_profile(db.instructors()[professor_id])
    style = (style_path(professor_id) or STYLES_DIR / "default.md").read_text(encoding="utf-8")
    template = (PROMPTS_DIR / "base.md").read_text(encoding="utf-8")
    return (
        template.replace("{name}", profile["name"])
        .replace("{bio}", profile["bio"] or "(No bio in the catalog.)")
        .replace("{courses}", _courses_text(profile["courses"]))
        .replace("{style}", style.strip())
    )


_client: AsyncOpenAI | None = None
_agents: dict[str, Agent[None, str]] = {}
_histories: dict[tuple[str, str], list[list[ModelMessage]]] = {}  # (session, professor) -> turns


def _model() -> OpenAIResponsesModel:
    global _client
    if _client is None:
        key = os.getenv("PORTKEY_API_KEY")
        if not key:
            raise RuntimeError("PORTKEY_API_KEY is not set (looked for it in .env files above backend/).")
        _client = AsyncOpenAI(
            api_key=key,
            base_url="https://api.portkey.ai/v1",
            default_headers={"x-portkey-api-key": key, "x-portkey-provider": "openai"},
            timeout=90.0,
            max_retries=1,
        )
    return OpenAIResponsesModel(MODEL_NAME, provider=OpenAIProvider(openai_client=_client))


def get_agent(professor_id: str) -> Agent[None, str]:
    if professor_id not in _agents:
        _agents[professor_id] = Agent(
            _model(),
            output_type=str,
            # A callable so prompt/style edits apply on the next message without a restart.
            instructions=lambda: build_instructions(professor_id),
            tools=ALL_TOOLS,
            retries=1,
        )
    return _agents[professor_id]


def _tools_used(messages: list[ModelMessage]) -> list[ToolUse]:
    used = []
    for msg in messages:
        if isinstance(msg, ModelResponse):
            for part in msg.parts:
                if isinstance(part, ToolCallPart):
                    used.append(ToolUse(name=part.tool_name, args=part.args_as_dict()))
    return used


def _audit(entry: dict) -> None:
    AUDIT_PATH.parent.mkdir(exist_ok=True)
    try:
        log = json.loads(AUDIT_PATH.read_text(encoding="utf-8"))
    except (FileNotFoundError, json.JSONDecodeError):
        log = []
    log.append(entry)
    AUDIT_PATH.write_text(json.dumps(log, indent=2, ensure_ascii=False), encoding="utf-8")


async def chat(professor_id: str, session_id: str, message: str) -> tuple[str, list[ToolUse]]:
    key = (session_id, professor_id)
    turns = _histories.setdefault(key, [])
    history = [m for turn in turns for m in turn]
    result = await get_agent(professor_id).run(message, message_history=history, usage_limits=LIMITS)
    new = result.new_messages()
    turns.append(new)
    del turns[:-MAX_HISTORY_TURNS]  # keep whole turns so a tool call is never split from its result
    used = _tools_used(new)
    _audit(
        {
            "timestamp": datetime.now(timezone.utc).isoformat(timespec="seconds"),
            "professor_id": professor_id,
            "session_id": session_id,
            "model": MODEL_NAME,
            "user_message": message,
            "tools_used": [t.model_dump() for t in used],
            "reply": result.output,
        }
    )
    return result.output, used


def reset(professor_id: str, session_id: str) -> None:
    _histories.pop((session_id, professor_id), None)
