import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import Labubu from './Labubu.jsx'
import Talker, { B, BOX, CAP, CYL, PLANE, SMILE, SPH, TORUS, canvasTex, m } from './Talker.jsx'

// Prof. Tauhid Zaman: black BLACKPINK hoodie, jeans, white-and-pink sneakers, glasses,
// and a pink Labubu swinging from his belt loop. Talker handles chat, facing you, and gestures.

export const ZAMAN_ID = 'tauhid-zaman'

const SKIN = '#c69066' // light brown
const HAIR = '#141010'
const HOODIE = '#141417'
const HOODIE_TRIM = '#202026'
const JEANS = '#2d4a7a'
const PINK = '#ff4fa3'

// pink wordmark across the hoodie chest
const logoMat = () =>
  new THREE.MeshBasicMaterial({
    transparent: true,
    map: canvasTex(512, 128, (g, w, h) => {
      g.fillStyle = '#f7a7c9'
      g.font = '900 68px "Arial Black", Impact, sans-serif'
      g.textAlign = 'center'
      g.textBaseline = 'middle'
      g.fillText('BLACKPINK', w / 2, h / 2 + 4)
    }),
  })

// Labubu keychain swinging on its chain
function Charm() {
  const ref = useRef()
  useFrame(({ clock }) => {
    const t = clock.elapsedTime
    ref.current.rotation.z = Math.sin(t * 2.2) * 0.22
    ref.current.rotation.x = Math.sin(t * 1.7 + 1) * 0.15
  })
  return (
    <group ref={ref}>
      <B g={CYL} c="#c9ccd2" o={{ metalness: 0.9, roughness: 0.25 }} p={[0, -0.04, 0]} s={[0.003, 0.06, 0.003]} />
      <Labubu fur="#ff8fc7" expression="mischief" height={0.2} position={[0, -0.28, 0]} />
    </group>
  )
}

export default function Zaman(props) {
  const logo = useMemo(logoMat, [])
  const hand = m(SKIN)
  const sleeve = m(HOODIE)
  const arm = (side) => (
    <>
      <mesh geometry={CAP} material={sleeve} position={[0, -0.23, 0]} scale={[0.07, 0.19, 0.07]} />
      <B g={CYL} c={HOODIE_TRIM} p={[0, -0.45, 0]} s={[0.058, 0.04, 0.058]} />
      <mesh geometry={SPH} material={hand} position={[0, -0.51, 0.01]} scale={[0.045, 0.055, 0.04]} />
      <B g={BOX} c={PINK} p={[side * 0.071, -0.25, 0]} s={[0.004, 0.26, 0.02]} />
    </>
  )

  return (
    <Talker id={ZAMAN_ID} label="Prof. Zaman" {...props}>
      {({ head, armR, armL }) => (
        <>
          {/* sneakers: white with a pink stripe */}
          {[-1, 1].map((sx) => (
            <group key={sx}>
              <B g={BOX} c="#f4f4f6" p={[0.1 * sx, 0.045, 0.035]} s={[0.12, 0.09, 0.28]} />
              <B g={BOX} c={PINK} p={[0.1 * sx + 0.061 * sx, 0.05, 0.03]} s={[0.004, 0.035, 0.16]} />
              <B g={BOX} c="#d9d9de" p={[0.1 * sx, 0.006, 0.035]} s={[0.125, 0.012, 0.285]} />
            </group>
          ))}
          {/* jeans */}
          {[-1, 1].map((sx) => (
            <B key={sx} g={CYL} c={JEANS} p={[0.1 * sx, 0.5, 0]} s={[0.078, 0.82, 0.08]} />
          ))}
          <B g={CYL} c={JEANS} p={[0, 0.88, 0]} s={[0.19, 0.1, 0.13]} />
          <B g={CYL} c="#1a1a1a" p={[0, 0.9, 0]} s={[0.192, 0.025, 0.132]} />

          {/* Labubu keychain on his right belt loop */}
          <group position={[-0.17, 0.89, 0.07]}>
            <B g={TORUS} c="#c9ccd2" o={{ metalness: 0.9, roughness: 0.25 }} r={[0, Math.PI / 2, 0]} s={[0.018, 0.018, 0.018]} />
            <Charm />
          </group>

          {/* hoodie */}
          <B g={CYL} c={HOODIE} p={[0, 1.18, 0]} s={[0.215, 0.56, 0.15]} />
          <B g={CYL} c={HOODIE_TRIM} p={[0, 0.93, 0]} s={[0.22, 0.06, 0.155]} />
          <B c={HOODIE} p={[0, 1.43, 0]} s={[0.26, 0.09, 0.155]} />
          <B g={BOX} c={HOODIE_TRIM} p={[0, 1.02, 0.15]} s={[0.24, 0.12, 0.012]} />
          <mesh geometry={PLANE} material={logo} position={[0, 1.24, 0.153]} scale={[0.3, 0.075, 1]} />
          {/* hood resting behind the neck, plus drawstrings */}
          <B g={TORUS} c={HOODIE} p={[0, 1.49, -0.02]} r={[Math.PI / 2 + 0.25, 0, 0]} s={[0.11, 0.1, 0.25]} />
          <B c={HOODIE} p={[0, 1.5, -0.12]} s={[0.15, 0.11, 0.07]} />
          {[-1, 1].map((sx) => (
            <group key={sx}>
              <B g={CYL} c="#f4f4f6" p={[0.045 * sx, 1.36, 0.15]} s={[0.006, 0.15, 0.006]} />
              <B g={CYL} c={PINK} p={[0.045 * sx, 1.28, 0.15]} s={[0.009, 0.02, 0.009]} />
            </group>
          ))}
          <B g={CYL} c={SKIN} p={[0, 1.52, 0]} s={[0.05, 0.07, 0.05]} />

          {/* arms (his right = -x) */}
          <group ref={armR} position={[-0.25, 1.43, 0]}>
            {arm(-1)}
          </group>
          <group ref={armL} position={[0.25, 1.43, 0]}>
            {arm(1)}
          </group>

          {/* head: pivots at the neck so it can nod and tilt */}
          <group ref={head} position={[0, 1.52, 0]}>
            <group position={[0, -1.52, 0]}>
              <B c={SKIN} p={[0, 1.64, 0]} s={[0.115, 0.135, 0.125]} />
              {[-1, 1].map((sx) => (
                <B key={sx} c={SKIN} p={[0.117 * sx, 1.64, 0]} s={[0.02, 0.034, 0.02]} />
              ))}
              {/* short black hair with a little volume up front */}
              <B c={HAIR} p={[0, 1.7, -0.012]} s={[0.122, 0.095, 0.13]} />
              <B c={HAIR} p={[0.01, 1.755, 0.055]} r={[0.3, 0, -0.15]} s={[0.1, 0.045, 0.07]} />
              {[-1, 1].map((sx) => (
                <B key={sx} c={HAIR} p={[0.105 * sx, 1.67, -0.02]} s={[0.025, 0.06, 0.09]} />
              ))}
              {/* eyes + brows */}
              {[-1, 1].map((sx) => (
                <group key={sx}>
                  <B c="#ffffff" p={[0.043 * sx, 1.66, 0.112]} s={[0.021, 0.017, 0.012]} />
                  <B c="#1d1410" p={[0.043 * sx, 1.66, 0.122]} s={[0.011, 0.012, 0.008]} />
                  <B g={BOX} c={HAIR} p={[0.045 * sx, 1.697, 0.116]} r={[0, 0, -0.12 * sx]} s={[0.045, 0.011, 0.01]} />
                </group>
              ))}
              {/* nerd glasses: black rectangular frames */}
              {[-1, 1].map((sx) => (
                <group key={sx} position={[0.045 * sx, 1.66, 0.128]}>
                  <B g={BOX} c="#0d0d0f" p={[0, 0.022, 0]} s={[0.054, 0.007, 0.006]} />
                  <B g={BOX} c="#0d0d0f" p={[0, -0.02, 0]} s={[0.054, 0.006, 0.006]} />
                  <B g={BOX} c="#0d0d0f" p={[0.027 * sx, 0, 0]} s={[0.006, 0.048, 0.006]} />
                  <B g={BOX} c="#0d0d0f" p={[-0.027 * sx, 0, 0]} s={[0.006, 0.048, 0.006]} />
                  <B g={BOX} c="#bfe3ff" o={{ transparent: true, opacity: 0.2 }} s={[0.05, 0.04, 0.002]} />
                  <B g={BOX} c="#0d0d0f" p={[0.06 * sx, 0.012, -0.05]} s={[0.004, 0.006, 0.1]} />
                </group>
              ))}
              <B g={BOX} c="#0d0d0f" p={[0, 1.67, 0.13]} s={[0.022, 0.005, 0.005]} />
              {/* nose + easy grin */}
              <B c={SKIN} p={[0, 1.625, 0.128]} s={[0.02, 0.028, 0.024]} />
              <B g={SMILE} c="#6b2f2a" p={[0, 1.605, 0.118]} r={[0, 0, Math.PI]} s={[0.026, 0.014, 0.01]} />
            </group>
          </group>
        </>
      )}
    </Talker>
  )
}
