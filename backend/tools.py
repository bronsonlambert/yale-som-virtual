"""Course-catalog tools every professor agent can call. Docstrings are what the model sees."""

from __future__ import annotations

import db


def search_courses(query: str = "", category: str | None = None, instructor: str | None = None, limit: int = 12) -> list[dict]:
    """Search the Yale SOM Fall 2026 course catalog.

    Returns one entry per course with its sections (instructor, session, meeting time, room).
    Descriptions are omitted; call get_course_details for those.

    Args:
        query: Keywords that must all appear in the course number, title, description, or category,
            e.g. "regression", "private equity", "MGT 403". Use few, distinctive words. Empty = no keyword filter.
            Results are ranked with title matches first. For broad topics, also try synonyms or the category
            filter (e.g. for AI: query "AI", query "machine learning", and category "Artificial Intelligence").
        category: Optional category filter, e.g. "Finance", "Core", "Artificial Intelligence", "EMBA".
        instructor: Optional instructor name (first, last, or both), e.g. "Zaman".
        limit: Max courses to return (1-25).
    """
    return db.search_courses(query, category, instructor, limit)


def get_course_details(course_number: str) -> list[dict]:
    """Full details for a course: description, units, syllabus link, and every section.

    Args:
        course_number: e.g. "MGT 409". Spacing and case don't matter.
    """
    return db.course_details(course_number) or [{"error": f"No course matches {course_number!r}."}]


def get_instructor(name: str) -> dict:
    """Look up a faculty member: their bio and all the courses they teach this term.

    Args:
        name: First, last, or full name, e.g. "Sudhir" or "Eva Chalioti".
    """
    words = name.lower().replace(",", " ").split()
    matches = [raw for s, raw in db.instructors().items() if all(w in s for w in words)]
    if not matches:
        return {"error": f"No instructor matches {name!r}."}
    if len(matches) > 1:
        return {"ambiguous": [db.display_name(m) for m in matches]}
    return db.instructor_profile(matches[0])


def list_categories() -> list[dict]:
    """List course categories with how many courses each has."""
    return db.categories()


ALL_TOOLS = [search_courses, get_course_details, get_instructor, list_categories]
