import { useEffect, useRef } from 'react'
import * as THREE from 'three'
import OrbitingGeometry from '../scenes/OrbitingGeometry'

export default function ThreeScene() {
  const canvasRef = useRef(null)

  useEffect(() => {
    const canvas = canvasRef.current
    const renderer = new THREE.WebGLRenderer({ canvas, antialias: true })
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    renderer.setSize(window.innerWidth, window.innerHeight)

    const scene = new OrbitingGeometry(renderer)
    scene.init(window.innerWidth, window.innerHeight)

    const clock = new THREE.Clock()
    let rafId

    function animate() {
      rafId = requestAnimationFrame(animate)
      const delta = Math.min(clock.getDelta(), 0.05)
      const elapsed = clock.getElapsedTime()
      scene.update(delta, elapsed)
      renderer.render(scene.getScene(), scene.getCamera())
    }
    animate()

    function onResize() {
      const w = window.innerWidth
      const h = window.innerHeight
      renderer.setSize(w, h)
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
      scene.onResize(w, h)
    }
    window.addEventListener('resize', onResize)

    return () => {
      cancelAnimationFrame(rafId)
      window.removeEventListener('resize', onResize)
      scene.destroy()
      renderer.dispose()
    }
  }, [])

  return (
    <>
      <canvas
        ref={canvasRef}
        style={{ display: 'block', position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh' }}
      />
      <div style={{
        position: 'fixed',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        textAlign: 'center',
        pointerEvents: 'none',
        zIndex: 10,
        mixBlendMode: 'difference',
        fontFamily: 'Inter, system-ui, -apple-system, sans-serif',
      }}>
        <h1 style={{
          fontSize: 'clamp(2.5rem, 8vw, 7rem)',
          fontWeight: 200,
          letterSpacing: '0.3em',
          color: '#fff',
          textTransform: 'uppercase',
          margin: 0,
        }}>
          Awba
        </h1>
      </div>
    </>
  )
}
