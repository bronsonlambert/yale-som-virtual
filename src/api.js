// Talks to the FastAPI backend in ../backend (uvicorn main:app --port 8000).
// Set VITE_API_URL to point at a deployed backend.
export const API_URL = (import.meta.env.VITE_API_URL || 'http://localhost:8000').replace(/\/$/, '')

// one id per browser tab, so each visitor gets their own conversation history on the server
const SESSION_ID = crypto.randomUUID()

async function post(path, body) {
  let res
  try {
    res = await fetch(`${API_URL}${path}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...body, session_id: SESSION_ID }),
    })
  } catch {
    throw new Error(`Can't reach the professor backend at ${API_URL}. Is it running?`)
  }
  const data = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(typeof data.detail === 'string' ? data.detail : `Backend error (${res.status}).`)
  return data
}

export const sendChat = (professorId, message) => post('/api/chat', { professor_id: professorId, message })
export const resetChat = (professorId) => post('/api/chat/reset', { professor_id: professorId })
