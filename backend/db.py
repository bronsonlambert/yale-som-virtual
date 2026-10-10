"""Read-only access to the Yale SOM course catalog (../data/yale_som.db, table `courses`).

Each row is one section of a course, so most helpers group rows by course_number.
"""

from __future__ import annotations

import re
import sqlite3
from functools import lru_cache
from pathlib import Path

DB_PATH = Path(__file__).resolve().parent.parent / "data" / "yale_som.db"

SECTION_FIELDS = ("section", "daytimes", "room", "course_session", "faculty_1")


def _connect() -> sqlite3.Connection:
    # New connection per call: cheap for SQLite and safe across FastAPI's worker threads.
    conn = sqlite3.connect(f"file:{DB_PATH.as_posix()}?mode=ro", uri=True)
    conn.row_factory = sqlite3.Row
    return conn


def _rows(sql: str, params: tuple = ()) -> list[dict]:
    with _connect() as conn:
        return [dict(r) for r in conn.execute(sql, params)]


def _clean(text: str | None) -> str:
    return re.sub(r"\s+", " ", text or "").strip()


def _group(rows: list[dict], full: bool = False) -> list[dict]:
    """Collapse section rows into one entry per course."""
    courses: dict[str, dict] = {}
    for r in rows:
        key = r["course_number"]
        c = courses.get(key)
        if c is None:
            c = courses[key] = {
                "course_number": r["course_number"],
                "title": r["course_title"],
                "category": r["course_category"] or "Uncategorized",
                "units": r["units"],
                "sections": [],
            }
            if full:
                c["description"] = _clean(r["course_description"])
                c["syllabus"] = r["syllabus"] or r["old_syllabus"] or ""
        c["sections"].append(
            {
                "section": r["section"],
                "instructor": display_name(r["faculty_1"]),
                "session": r["course_session"],
                "meets": _clean(r["daytimes"]) or "TBA / online",
                "room": r["room"] or "TBA",
            }
        )
    return list(courses.values())


def display_name(faculty: str | None) -> str:
    """'Zaman, Tauhid' -> 'Tauhid Zaman'."""
    if not faculty:
        return "TBA"
    last, _, first = faculty.partition(",")
    return f"{first.strip()} {last.strip()}".strip()


def slug(faculty: str) -> str:
    return re.sub(r"[^a-z0-9]+", "-", display_name(faculty).lower()).strip("-")


@lru_cache(maxsize=1)
def instructors() -> dict[str, str]:
    """slug -> raw faculty_1 value, for everyone who teaches at least one course."""
    names = [r["faculty_1"] for r in _rows("SELECT DISTINCT faculty_1 FROM courses WHERE faculty_1 <> '' ORDER BY faculty_1")]
    return {slug(n): n for n in names}


def instructor_profile(faculty: str) -> dict:
    rows = _rows("SELECT * FROM courses WHERE faculty_1 = ? ORDER BY course_number, section", (faculty,))
    bio = next((_clean(r["faculty_bio"]) for r in rows if r["faculty_bio"]), "")
    return {"name": display_name(faculty), "bio": bio, "courses": _group(rows, full=True)}


def _score(row: dict, words: list[str]) -> int:
    """0 if any word is missing; otherwise title hits count most, then category, then description.
    Words match whole-word at the start ("AI" won't match "maintain"; "regress" still matches "regression")."""
    fields = ((row["course_number"] + " " + row["course_title"], 5), (row["course_category"] or "", 3), (row["course_description"] or "", 1))
    total = 0
    for word in words:
        pattern = re.compile(rf"\b{re.escape(word)}", re.IGNORECASE)
        hit = sum(weight for text, weight in fields if pattern.search(text))
        if not hit:
            return 0
        total += hit
    return total


def search_courses(query: str = "", category: str | None = None, instructor: str | None = None, limit: int = 10) -> list[dict]:
    """Every word of `query` must appear in the course number, title, description, or category.
    Results are ranked by where the words appear (title first)."""
    sql = "SELECT * FROM courses WHERE 1=1"
    params: list[str] = []
    if category:
        sql += " AND course_category LIKE ?"
        params.append(f"%{category}%")
    if instructor:
        sql += " AND (faculty_1 LIKE ? OR faculty_1 LIKE ?)"
        params += [f"%{instructor}%", f"%{instructor.split()[-1]}%"]
    sql += " ORDER BY course_number, section"
    rows = _rows(sql, tuple(params))
    words = query.split()
    if words:
        scores = {r["id"]: _score(r, words) for r in rows}
        rows = sorted((r for r in rows if scores[r["id"]]), key=lambda r: -scores[r["id"]])  # stable: keeps sections in order
    return _group(rows)[: max(1, min(limit, 25))]


def course_details(course_number: str) -> list[dict]:
    # Accept "MGT409", "mgt 409", "409", etc.
    digits = re.sub(r"\D", "", course_number)
    letters = re.sub(r"[^A-Za-z]", "", course_number).upper()
    rows = _rows("SELECT * FROM courses WHERE REPLACE(course_number, ' ', '') LIKE ? ORDER BY course_number, section", (f"%{letters}{digits}%",))
    return _group(rows, full=True)


def categories() -> list[dict]:
    return _rows(
        "SELECT course_category AS category, COUNT(DISTINCT course_number) AS courses FROM courses "
        "WHERE course_category <> '' GROUP BY course_category ORDER BY courses DESC"
    )
