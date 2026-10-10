import { useMemo } from 'react'
import * as THREE from 'three'
import Talker, { B, BOX, CAP, CYL, PLANE, SMILE, SPH, canvasTex, m } from './Talker.jsx'

// Prof. Peter Schott: light-blue button-down (open collar, chest pocket), khaki chinos, brown
// leather shoes, dark brown hair going gray at the temples, blue-gray eyes, big friendly smile.
// SoCal touches: sunglasses hooked on his shirt pocket. And a thick stack of problem sets in hand.

export const SCHOTT_ID = 'peter-schott'

const SKIN = '#e8bb9c'
const HAIR = '#3a2a20'
const GRAY = '#857a72'
const SHIRT = '#a8c3e8'
const SHIRT_DARK = '#93b1da'
const CHINOS = '#b9a27c'
const LEATHER = '#4a2f1d'

// cover sheet on top of the problem-set stack
const psetMat = () =>
  new THREE.MeshBasicMaterial({
    map: canvasTex(256, 352, (g, w) => {
      g.fillStyle = '#ffffff'
      g.fillRect(0, 0, w, 352)
      g.fillStyle = '#00356b'
      g.fillRect(0, 0, w, 64)
      g.fillStyle = '#ffffff'
      g.font = 'bold 30px Georgia, serif'
      g.textAlign = 'center'
      g.fillText('Yale SOM', w / 2, 44)
      g.fillStyle = '#1d2433'
      g.font = 'bold 40px system-ui, sans-serif'
      g.fillText('PROBLEM', w / 2, 140)
      g.fillText('SET 9', w / 2, 190)
      g.fillStyle = '#ff4fa3'
      g.font = '600 26px system-ui, sans-serif'
      g.fillText('47 pages · due Fri', w / 2, 250)
      g.fillStyle = '#9aa3b2'
      for (let y = 280; y < 340; y += 14) g.fillRect(30, y, w - 60, 4)
    }),
  })

export default function Schott(props) {
  const pset = useMemo(psetMat, [])
  const hand = m(SKIN)
  const sleeve = m(SHIRT)
  const arm = () => (
    <>
      <mesh geometry={CAP} material={sleeve} position={[0, -0.23, 0]} scale={[0.066, 0.19, 0.066]} />
      <B g={CYL} c={SHIRT_DARK} p={[0, -0.45, 0]} s={[0.054, 0.045, 0.054]} />
      <mesh geometry={SPH} material={hand} position={[0, -0.51, 0.01]} scale={[0.045, 0.055, 0.04]} />
    </>
  )

  return (
    <Talker id={SCHOTT_ID} label="Prof. Schott" {...props}>
      {({ head, armR, armL }) => (
        <>
          {/* brown leather shoes */}
          {[-1, 1].map((sx) => (
            <group key={sx}>
              <B g={BOX} c={LEATHER} o={{ roughness: 0.45 }} p={[0.1 * sx, 0.04, 0.04]} s={[0.11, 0.08, 0.28]} />
              <B g={BOX} c="#2a1a10" p={[0.1 * sx, 0.006, 0.04]} s={[0.115, 0.012, 0.285]} />
            </group>
          ))}
          {/* khaki chinos + brown belt */}
          {[-1, 1].map((sx) => (
            <B key={sx} g={CYL} c={CHINOS} p={[0.1 * sx, 0.5, 0]} s={[0.078, 0.82, 0.08]} />
          ))}
          <B g={CYL} c={CHINOS} p={[0, 0.88, 0]} s={[0.19, 0.1, 0.13]} />
          <B g={CYL} c={LEATHER} p={[0, 0.92, 0]} s={[0.193, 0.03, 0.133]} />
          <B g={BOX} c="#c9ccd2" o={{ metalness: 0.9, roughness: 0.25 }} p={[0, 0.92, 0.133]} s={[0.04, 0.028, 0.008]} />

          {/* light-blue button-down, tucked in */}
          <B g={CYL} c={SHIRT} p={[0, 1.19, 0]} s={[0.21, 0.54, 0.148]} />
          <B c={SHIRT} p={[0, 1.42, 0]} s={[0.255, 0.09, 0.15]} />
          <B g={BOX} c={SHIRT_DARK} p={[0, 1.17, 0.149]} s={[0.026, 0.5, 0.004]} />
          {[1.0, 1.1, 1.2, 1.3].map((y) => (
            <B key={y} c="#f4f6fa" p={[0, y, 0.153]} s={[0.008, 0.008, 0.004]} />
          ))}
          {/* open collar: skin V at the neck + collar points */}
          <B g={BOX} c={SKIN} p={[0, 1.45, 0.128]} r={[0, 0, Math.PI / 4]} s={[0.06, 0.06, 0.01]} />
          {[-1, 1].map((sx) => (
            <B key={sx} g={BOX} c={SHIRT} p={[0.045 * sx, 1.46, 0.135]} r={[0.3, 0, 0.5 * sx]} s={[0.07, 0.035, 0.008]} />
          ))}
          <B g={CYL} c={SHIRT} p={[0, 1.5, -0.01]} s={[0.065, 0.04, 0.06]} />
          {/* chest pocket on his left, with sunglasses hooked on it */}
          <B g={BOX} c={SHIRT_DARK} p={[0.095, 1.25, 0.15]} s={[0.08, 0.09, 0.005]} />
          <group position={[0.095, 1.3, 0.158]}>
            {[-1, 1].map((sx) => (
              <B key={sx} g={BOX} c="#1a1d24" o={{ roughness: 0.2, metalness: 0.4 }} p={[0.022 * sx, -0.012, 0]} s={[0.036, 0.026, 0.006]} />
            ))}
            <B g={BOX} c="#1a1d24" p={[0, 0, 0]} s={[0.012, 0.005, 0.006]} />
          </group>
          <B g={CYL} c={SKIN} p={[0, 1.53, 0]} s={[0.05, 0.06, 0.05]} />

          {/* arms (his right = -x); the left hand carries the problem sets */}
          <group ref={armR} position={[-0.25, 1.43, 0]}>
            {arm()}
          </group>
          <group ref={armL} position={[0.25, 1.43, 0]}>
            {arm()}
            <group position={[0.01, -0.53, 0.06]} rotation={[0.25, 0, 0]}>
              <B g={BOX} c="#f6f4ee" p={[0, 0, 0]} s={[0.17, 0.1, 0.22]} />
              {[-0.03, 0, 0.03].map((y) => (
                <B key={y} g={BOX} c="#d9d4c7" p={[0, y, 0]} s={[0.172, 0.004, 0.222]} />
              ))}
              <B g={BOX} c="#c9ccd2" o={{ metalness: 0.8 }} p={[-0.07, 0.051, -0.095]} s={[0.012, 0.004, 0.012]} />
              <mesh geometry={PLANE} material={pset} position={[0, 0.0505, 0]} rotation={[-Math.PI / 2, 0, 0]} scale={[0.16, 0.21, 1]} />
            </group>
          </group>

          {/* head: pivots at the neck so it can nod and tilt */}
          <group ref={head} position={[0, 1.52, 0]}>
            <group position={[0, -1.52, 0]}>
              <B c={SKIN} p={[0, 1.645, 0]} s={[0.112, 0.14, 0.122]} />
              {[-1, 1].map((sx) => (
                <B key={sx} c={SKIN} p={[0.114 * sx, 1.645, 0]} s={[0.02, 0.036, 0.02]} />
              ))}
              {/* dark brown hair, full on top with a side part, gray at the temples */}
              <B c={HAIR} p={[0, 1.715, -0.015]} s={[0.12, 0.09, 0.128]} />
              <B c={HAIR} p={[-0.02, 1.77, 0.045]} r={[0.35, 0, 0.2]} s={[0.105, 0.045, 0.075]} />
              <B c={HAIR} p={[0, 1.66, -0.07]} s={[0.115, 0.08, 0.07]} />
              {[-1, 1].map((sx) => (
                <B key={sx} c={GRAY} p={[0.104 * sx, 1.675, -0.01]} s={[0.022, 0.05, 0.075]} />
              ))}
              {/* blue-gray eyes, dark brows */}
              {[-1, 1].map((sx) => (
                <group key={sx}>
                  <B c="#ffffff" p={[0.042 * sx, 1.665, 0.108]} s={[0.02, 0.014, 0.012]} />
                  <B c="#6f8aa0" p={[0.042 * sx, 1.665, 0.117]} s={[0.01, 0.01, 0.006]} />
                  <B c="#1d1410" p={[0.042 * sx, 1.665, 0.121]} s={[0.005, 0.005, 0.004]} />
                  <B g={BOX} c={HAIR} p={[0.044 * sx, 1.695, 0.113]} r={[0, 0, 0.08 * sx]} s={[0.045, 0.01, 0.01]} />
                </group>
              ))}
              {/* nose + big friendly smile */}
              <B c={SKIN} p={[0, 1.63, 0.124]} s={[0.021, 0.032, 0.026]} />
              <B g={BOX} c="#ffffff" p={[0, 1.6, 0.114]} s={[0.034, 0.008, 0.006]} />
              <B g={SMILE} c="#8a4a40" p={[0, 1.607, 0.114]} r={[0, 0, Math.PI]} s={[0.03, 0.016, 0.01]} />
              {[-1, 1].map((sx) => (
                <B key={sx} c="#e2a58c" p={[0.07 * sx, 1.625, 0.095]} s={[0.022, 0.015, 0.01]} />
              ))}
            </group>
          </group>
        </>
      )}
    </Talker>
  )
}
