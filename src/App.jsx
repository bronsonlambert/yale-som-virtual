import { useCallback, useEffect, useRef, useState } from 'react'
import { Canvas } from '@react-three/fiber'
import World from './World.jsx'
import Player from './Player.jsx'
import Minimap from './Minimap.jsx'
import TouchControls from './TouchControls.jsx'
import ClickToTalk from './ClickToTalk.jsx'
import ChatPanel from './ChatPanel.jsx'
import { REAL_PROFS } from './realProfs.js'
import { EYE, SPAWN } from './layout.js'
import { resetChat, sendChat } from './api.js'

export default function App() {
  const [locked, setLocked] = useState(false)
  const [where, setWhere] = useState('')
  const [showMap, setShowMap] = useState(true)
  const lockRef = useRef()
  const mapRef = useRef()
  const onLock = useCallback((v) => setLocked(v), [])
  const onWhere = useCallback((w) => setWhere(w), [])
  // phones have no pointer lock, so they get a joystick + drag-to-look instead
  const [isTouch] = useState(() => matchMedia('(pointer: coarse)').matches) // phones + tablets; touchscreen laptops still get mouse mode
  const [touchOn, setTouchOn] = useState(false)
  const touchRef = useRef({ active: false, move: [0, 0], look: [0, 0], jump: false })
  const setTouch = (on) => {
    touchRef.current.active = on
    touchRef.current.move = [0, 0]
    setTouchOn(on)
  }
  const playing = locked || touchOn

  // ---- talking to professors
  const talkables = useRef(new Map()) // professor id -> 3D object, for crosshair picking
  const histories = useRef({}) // professor id -> messages, so reopening a chat keeps the conversation
  const resumeMode = useRef(null) // how you were walking before the chat opened
  const [chat, setChat] = useState(null) // { id, busy, messages: [{ role: 'me' | 'prof', text, tools?, error? }] }
  const [aimId, setAimId] = useState(null)
  const [nearId, setNearId] = useState(null)

  const openChat = useCallback((id) => {
    resumeMode.current = document.pointerLockElement ? 'lock' : touchRef.current.active ? 'touch' : null
    document.exitPointerLock?.()
    touchRef.current.active = false
    touchRef.current.move = [0, 0]
    setTouchOn(false)
    setChat({ id, busy: false, messages: histories.current[id] || [] })
  }, [])
  const closeChat = () => {
    if (chat?.busy) return
    setChat(null)
    if (resumeMode.current === 'lock') lockRef.current?.()
    if (resumeMode.current === 'touch') setTouch(true)
  }
  const send = async (text) => {
    const id = chat.id
    const push = (msg, busy) =>
      setChat((c) => {
        const messages = [...c.messages, msg]
        histories.current[id] = messages
        return { ...c, busy, messages }
      })
    push({ role: 'me', text }, true)
    try {
      const res = await sendChat(id, text)
      push({ role: 'prof', text: res.reply, tools: res.tools_used }, false)
    } catch (err) {
      push({ role: 'prof', text: err.message, error: true }, false)
    }
  }
  const reset = async () => {
    histories.current[chat.id] = []
    setChat((c) => ({ ...c, messages: [] }))
    resetChat(chat.id).catch(() => {}) // if the backend is down there's no history to clear anyway
  }

  useEffect(() => {
    const k = (e) => e.code === 'KeyM' && !e.target.closest?.('input, textarea') && setShowMap((v) => !v)
    window.addEventListener('keydown', k)
    return () => window.removeEventListener('keydown', k)
  }, [])

  return (
    <>
      <Canvas
        camera={{ fov: 72, near: 0.05, far: 800, position: [SPAWN.x, EYE, SPAWN.z] }}
        dpr={[1, 1.75]}
      >
        <World chat={chat} talkables={talkables} onTalk={openChat} />
        <ClickToTalk talkables={talkables} onTalk={openChat} onAim={setAimId} onNear={setNearId} />
        <Player lockRef={lockRef} mapRef={mapRef} touchRef={touchRef} onLock={onLock} onWhere={onWhere} />
      </Canvas>

      <div className="where">
        <span className="dot" />
        {where}
      </div>
      <div className={showMap ? 'mapwrap' : 'mapwrap hidden'}>
        <Minimap drawRef={mapRef} />
      </div>
      <button className="maptoggle" onClick={() => setShowMap((s) => !s)}>
        {showMap ? 'hide map' : 'map'}
      </button>
      {playing && <div className={aimId ? 'crosshair aim' : 'crosshair'} />}
      {locked && aimId && <div className="talkhint">Click to chat with {REAL_PROFS[aimId].short}</div>}
      {touchOn && <TouchControls touchRef={touchRef} onPause={() => setTouch(false)} />}
      {touchOn && nearId && (
        <button className="talkbtn" onClick={() => openChat(nearId)}>
          💬 Talk to {REAL_PROFS[nearId].short}
        </button>
      )}
      {chat && <ChatPanel chat={chat} info={REAL_PROFS[chat.id]} onSend={send} onClose={closeChat} onReset={reset} />}

      {!playing && !chat && (
        <div className="overlay" onClick={() => (isTouch ? setTouch(true) : lockRef.current?.())}>
          <div className="card">
            <div className="kicker">Yale SOM · Evans Hall</div>
            <h1>Floor 2</h1>
            <p className="sub">Classroom drums, the cloister, Ross Library, the Beinecke Terrace Room, and the courtyard.</p>
            <button className="go">{isTouch ? 'Tap to walk in' : 'Click to walk in'}</button>
            {!isTouch && (
              <button
                className="go alt"
                onClick={(e) => {
                  e.stopPropagation()
                  setTouch(true)
                }}
              >
                Use on-screen joystick
              </button>
            )}
            {isTouch ? (
              <div className="keys">
                <span><b>Left thumb</b> joystick to walk (push all the way to hurry)</span>
                <span><b>Right thumb</b> drag to look</span>
              </div>
            ) : (
              <div className="keys">
                <span><b>W A S D</b> walk</span>
                <span><b>Mouse</b> look</span>
                <span><b>Shift</b> sprint</span>
                <span><b>Space</b> jump</span>
                <span><b>C</b> crouch</span>
                <span><b>M</b> map</span>
                <span><b>Esc</b> pause</span>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  )
}
