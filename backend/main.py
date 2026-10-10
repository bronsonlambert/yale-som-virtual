"""FastAPI backend: every Yale SOM instructor in the catalog is a chat-able PydanticAI agent.

Run from this folder:  uvicorn main:app --port 8000
"""

from __future__ import annotations

import logging
import os

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware

import agent
import db
from models import ChatRequest, ChatResponse, ProfessorSummary, ResetRequest

log = logging.getLogger("uvicorn.error")

app = FastAPI(title="Yale SOM Virtual — Professor Agents")
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "https://bronsonlambert.github.io",
        *filter(None, os.getenv("EXTRA_CORS_ORIGINS", "").split(",")),
    ],
    allow_methods=["GET", "POST"],
    allow_headers=["*"],
)


def _require(professor_id: str) -> str:
    if professor_id not in db.instructors():
        raise HTTPException(404, f"Unknown professor {professor_id!r}. See GET /api/professors.")
    return professor_id


def _summary(professor_id: str) -> ProfessorSummary:
    profile = db.instructor_profile(db.instructors()[professor_id])
    sections = [s for c in profile["courses"] for s in c["sections"]]
    return ProfessorSummary(
        id=professor_id,
        name=profile["name"],
        courses=[f"{c['course_number']} {c['title']}" for c in profile["courses"]],
        rooms=sorted({s["room"] for s in sections if s["room"] != "TBA"}),
        has_style=agent.style_path(professor_id) is not None,
    )


@app.get("/api/health")
def health() -> dict:
    return {"ok": True, "model": agent.MODEL_NAME, "professors": len(db.instructors())}


@app.get("/api/professors", response_model=list[ProfessorSummary])
def professors() -> list[ProfessorSummary]:
    return [_summary(pid) for pid in db.instructors()]


@app.get("/api/professors/{professor_id}", response_model=ProfessorSummary)
def professor(professor_id: str) -> ProfessorSummary:
    return _summary(_require(professor_id))


@app.post("/api/chat", response_model=ChatResponse)
async def chat(req: ChatRequest) -> ChatResponse:
    _require(req.professor_id)
    try:
        reply, used = await agent.chat(req.professor_id, req.session_id, req.message.strip())
    except Exception as exc:  # surface a clean error to the chat window; details stay in the server log
        log.exception("chat failed")
        raise HTTPException(502, f"The professor's brain glitched ({type(exc).__name__}). Try again in a moment.") from exc
    return ChatResponse(professor_id=req.professor_id, reply=reply, tools_used=used)


@app.post("/api/chat/reset")
def reset(req: ResetRequest) -> dict:
    agent.reset(_require(req.professor_id), req.session_id)
    return {"ok": True}
