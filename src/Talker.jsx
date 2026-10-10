import { useEffect, useMemo, useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'

// Shared pieces for the real, chat-able professors (Zaman.jsx, Schott.jsx, ...).
// Each avatar builds its own body from these primitives and wraps it in <Talker>, which handles
// clicking to chat, turning to face you, nodding, gestures, and the floating name tag.
// Figures face +z; their right hand is at -x. Talker passes refs for the head and both arms:
// pivot the head at the neck (y = 1.52) and the arms at the shoulders.

const PINK = '#ff4fa3'

const mats = new Map()
export const m = (color, o = {}) => {
  const k = color + JSON.stringify(o)
  if (!mats.has(k)) mats.set(k, new THREE.MeshStandardMaterial({ color, roughness: 0.85, ...o }))
  return mats.get(k)
}
export const SPH = new THREE.SphereGeometry(1, 24, 16)
export const CYL = new THREE.CylinderGeometry(1, 1, 1, 24)
export const BOX = new THREE.BoxGeometry(1, 1, 1)
export const TORUS = new THREE.TorusGeometry(1, 0.14, 8, 24)
export const CAP = new THREE.CapsuleGeometry(1, 1, 6, 12)
export const PLANE = new THREE.PlaneGeometry(1, 1)
export const SMILE = new THREE.TorusGeometry(1, 0.22, 6, 16, Math.PI) // half ring

export const B = ({ g = SPH, c, p, s, r = [0, 0, 0], o }) => <mesh geometry={g} material={m(c, o)} position={p} scale={s} rotation={r} />

export function canvasTex(w, h, draw) {
  const c = document.createElement('canvas')
  c.width = w
  c.height = h
  draw(c.getContext('2d'), w, h)
  const t = new THREE.CanvasTexture(c)
  t.colorSpace = THREE.SRGBColorSpace
  return t
}

// floating name tag (a sprite, so it always faces you)
const tagMat = (label) =>
  new THREE.SpriteMaterial({
    depthTest: false,
    map: canvasTex(512, 150, (g, w) => {
      g.fillStyle = 'rgba(11,11,13,0.85)'
      g.strokeStyle = PINK
      g.lineWidth = 6
      g.beginPath()
      g.roundRect(6, 6, w - 12, 138, 36)
      g.fill()
      g.stroke()
      g.textAlign = 'center'
      g.fillStyle = '#ffffff'
      g.font = 'bold 50px system-ui, sans-serif'
      g.fillText(label, w / 2, 66)
      g.fillStyle = PINK
      g.font = '600 34px system-ui, sans-serif'
      g.fillText('click to chat', w / 2, 116)
    }),
  })

const wrap = (a) => Math.atan2(Math.sin(a), Math.cos(a))

export default function Talker({ id, label, position = [0, 0, 0], rotation = 0, talking = false, busy = false, talkables, onTalk, children }) {
  const { camera } = useThree()
  const root = useRef()
  const head = useRef()
  const armR = useRef()
  const armL = useRef()
  const tag = useRef()
  const yaw = useRef(rotation)
  const tagM = useMemo(() => tagMat(label), [label])
  const me = useMemo(() => new THREE.Vector3(), [])

  useEffect(() => {
    if (!talkables) return
    talkables.current.set(id, root.current)
    return () => talkables.current.delete(id)
  }, [id, talkables])

  useFrame(({ clock }, rawDt) => {
    const dt = Math.min(rawDt, 0.05)
    const t = clock.elapsedTime
    root.current.getWorldPosition(me)
    const dx = camera.position.x - me.x
    const dz = camera.position.z - me.z
    const near = Math.hypot(dx, dz) < 3.5
    // face you while you talk (or walk right up); otherwise scan the room
    const target = talking || near ? Math.atan2(dx, dz) : rotation + Math.sin(t * 0.35) * 0.4
    yaw.current += wrap(target - yaw.current) * Math.min(1, dt * (talking ? 6 : 2.5))
    root.current.rotation.y = yaw.current

    // tilt the head toward your eye height when you're close
    const pitch = talking || near ? -Math.atan2(camera.position.y - (me.y + 1.63), Math.hypot(dx, dz)) * 0.6 : 0
    head.current.rotation.x += (pitch - head.current.rotation.x) * Math.min(1, dt * 5)
    head.current.rotation.z = busy ? Math.sin(t * 2) * 0.08 : 0

    // arms: hand on chin while thinking, gesturing while chatting, relaxed otherwise
    const R = armR.current.rotation
    const L = armL.current.rotation
    if (busy) {
      R.x += (-2.1 - R.x) * dt * 6
      R.z += (0.55 - R.z) * dt * 6
      L.x += (-0.9 - L.x) * dt * 6
      L.z += (-0.7 - L.z) * dt * 6
    } else if (talking) {
      R.x += (-0.6 - Math.max(0, Math.sin(t * 2.4)) * 0.7 - R.x) * dt * 6
      R.z += (-0.2 - R.z) * dt * 6
      L.x += (-0.3 - Math.max(0, Math.sin(t * 2.4 + 2)) * 0.5 - L.x) * dt * 6
      L.z += (0.2 - L.z) * dt * 6
    } else {
      R.x += (Math.sin(t * 1.1) * 0.08 - R.x) * dt * 4
      R.z += (-0.12 - R.z) * dt * 4
      L.x += (-Math.sin(t * 1.1) * 0.08 - L.x) * dt * 4
      L.z += (0.12 - L.z) * dt * 4
    }
    tag.current.visible = !talking
    tag.current.position.y = 2.12 + Math.sin(t * 2) * 0.03
  })

  return (
    <group
      ref={root}
      position={position}
      rotation={[0, rotation, 0]}
      onClick={(e) => {
        e.stopPropagation()
        if (!document.pointerLockElement) onTalk?.(id) // while walking, ClickToTalk handles the crosshair
      }}
      onPointerOver={() => (document.body.style.cursor = 'pointer')}
      onPointerOut={() => (document.body.style.cursor = '')}
    >
      {children({ head, armR, armL })}
      <sprite ref={tag} material={tagM} position={[0, 2.12, 0]} scale={[0.62, 0.18, 1]} renderOrder={10} />
    </group>
  )
}
