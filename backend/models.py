"""Request/response shapes for the API."""

from __future__ import annotations

from typing import Any

from pydantic import BaseModel, Field


class ChatRequest(BaseModel):
    professor_id: str = Field(description="Instructor slug from GET /api/professors, e.g. 'tauhid-zaman'.")
    message: str = Field(min_length=1, max_length=4000)
    session_id: str = Field(min_length=1, max_length=100, description="Random id the browser keeps so each visitor has their own conversation.")


class ToolUse(BaseModel):
    name: str
    args: dict[str, Any] = {}


class ChatResponse(BaseModel):
    professor_id: str
    reply: str
    tools_used: list[ToolUse] = []


class ResetRequest(BaseModel):
    professor_id: str
    session_id: str


class ProfessorSummary(BaseModel):
    id: str
    name: str
    courses: list[str]
    rooms: list[str]
    has_style: bool = Field(description="True if a custom speaking style exists in prompts/styles/.")
