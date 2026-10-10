import { useEffect, useRef, useState } from 'react'

const TOOL_LABELS = {
  search_courses: 'Searched courses',
  get_course_details: 'Looked up course',
  get_instructor: 'Looked up instructor',
  list_categories: 'Listed categories',
}

// tiny markdown: **bold**, `code`, and "- " bullets (rendered as React nodes, never raw HTML)
function inline(text) {
  return text.split(/(\*\*[^*]+\*\*|`[^`]+`)/g).map((part, i) =>
    part.startsWith('**') && part.endsWith('**') ? (
      <strong key={i}>{part.slice(2, -2)}</strong>
    ) : part.startsWith('`') && part.endsWith('`') ? (
      <code key={i}>{part.slice(1, -1)}</code>
    ) : (
      part
    ),
  )
}

function Markdown({ text }) {
  const blocks = []
  for (const line of text.split('\n')) {
    const bullet = line.match(/^\s*[-*•]\s+(.*)/)
    const last = blocks[blocks.length - 1]
    if (bullet) {
      if (last?.type === 'ul') last.items.push(bullet[1])
      else blocks.push({ type: 'ul', items: [bullet[1]] })
    } else if (line.trim()) blocks.push({ type: 'p', text: line })
  }
  return blocks.map((b, i) =>
    b.type === 'ul' ? (
      <ul key={i}>
        {b.items.map((it, j) => (
          <li key={j}>{inline(it)}</li>
        ))}
      </ul>
    ) : (
      <p key={i}>{inline(b.text)}</p>
    ),
  )
}

const toolText = (t) => {
  const arg = t.args.query || t.args.course_number || t.args.name || t.args.category || t.args.instructor
  return `${TOOL_LABELS[t.name] || t.name}${arg ? `: ${arg}` : ''}`
}

export default function ChatPanel({ chat, info, onSend, onClose, onReset }) {
  const [draft, setDraft] = useState('')
  const listRef = useRef()
  const inputRef = useRef()

  useEffect(() => {
    inputRef.current?.focus()
  }, [chat.busy])
  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: 'smooth' })
  }, [chat.messages.length, chat.busy])

  const send = () => {
    const text = draft.trim()
    if (!text || chat.busy) return
    setDraft('')
    onSend(text)
  }

  return (
    <aside className="chat" role="dialog" aria-label={`Chat with ${info.name}`} onKeyDown={(e) => e.key === 'Escape' && onClose()}>
      <header className="chat-head">
        <div className="chat-avatar" aria-hidden="true">
          {info.initials}
        </div>
        <div className="chat-title">
          <div className="chat-name">{info.name}</div>
          <div className="chat-sub">{info.sub}</div>
        </div>
        <button className="chat-btn" onClick={onReset} disabled={chat.busy || !chat.messages.length} title="Start a new conversation">
          New chat
        </button>
        <button className="chat-btn close" onClick={onClose} aria-label="Close chat and keep walking">
          ✕
        </button>
      </header>

      <div className="chat-list" ref={listRef} aria-live="polite">
        {!chat.messages.length && (
          <div className="chat-empty">
            <p>
              Say hi to <b>{info.short}</b>. {info.intro}
            </p>
            {info.suggestions.map((q) => (
              <button key={q} className="chat-chip" onClick={() => onSend(q)}>
                {q}
              </button>
            ))}
          </div>
        )}
        {chat.messages.map((msg, i) => (
          <div key={i} className={`msg ${msg.role}${msg.error ? ' error' : ''}`}>
            <div className="bubble">{msg.role === 'prof' ? <Markdown text={msg.text} /> : msg.text}</div>
            {msg.tools?.length > 0 && (
              <div className="tools">
                {msg.tools.map((t, j) => (
                  <span key={j} className="tool">
                    {toolText(t)}
                  </span>
                ))}
              </div>
            )}
          </div>
        ))}
        {chat.busy && (
          <div className="msg prof">
            <div className="bubble typing" aria-label={`${info.short} is thinking`}>
              <span />
              <span />
              <span />
            </div>
          </div>
        )}
      </div>

      <form
        className="chat-input"
        onSubmit={(e) => {
          e.preventDefault()
          send()
        }}
      >
        <textarea
          ref={inputRef}
          value={draft}
          rows={2}
          maxLength={4000}
          placeholder={chat.busy ? `${info.short} is thinking…` : `Message ${info.short}…`}
          aria-label={`Message ${info.short}`}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault()
              send()
            }
          }}
        />
        <button type="submit" className="send" disabled={chat.busy || !draft.trim()}>
          Send
        </button>
      </form>
      <div className="chat-foot">Enter to send · Shift+Enter for a new line · Esc to keep walking</div>
    </aside>
  )
}
