import { useEffect, useMemo, useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'

const AIM_RANGE = 8 // m: how far away the crosshair can pick a professor
const NEAR_RANGE = 4 // m: touch players get a Talk button inside this distance

// With pointer lock the mouse has no screen position, so we raycast from the crosshair (screen
// center) every frame. A click while aiming at a professor opens the chat.
export default function ClickToTalk({ talkables, onTalk, onAim, onNear }) {
  const { camera } = useThree()
  const ray = useMemo(() => new THREE.Raycaster(undefined, undefined, 0, AIM_RANGE), [])
  const center = useMemo(() => new THREE.Vector2(0, 0), [])
  const p = useMemo(() => new THREE.Vector3(), [])
  const aim = useRef(null)
  const near = useRef(null)

  useFrame(() => {
    ray.setFromCamera(center, camera)
    let aimed = null
    let closest = null
    let best = NEAR_RANGE
    for (const [id, obj] of talkables.current) {
      if (ray.intersectObject(obj, true).some((h) => h.object.visible)) aimed = id
      obj.getWorldPosition(p)
      const d = Math.hypot(camera.position.x - p.x, camera.position.z - p.z)
      if (d < best) {
        best = d
        closest = id
      }
    }
    if (aimed !== aim.current) onAim((aim.current = aimed))
    if (closest !== near.current) onNear((near.current = closest))
  })

  useEffect(() => {
    const down = (e) => {
      if (e.button === 0 && document.pointerLockElement && aim.current) onTalk(aim.current)
    }
    window.addEventListener('mousedown', down)
    return () => window.removeEventListener('mousedown', down)
  }, [onTalk])

  return null
}
