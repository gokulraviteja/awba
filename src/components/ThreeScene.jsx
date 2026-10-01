import { useEffect, useRef } from 'react'
import * as THREE from 'three'
import OrbitingGeometry from '../scenes/OrbitingGeometry'

export default function ThreeScene({ theme }) {
  const canvasRef = useRef(null)

  useEffect(() => {
    const canvas = canvasRef.current
    const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true })
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    const scene = new OrbitingGeometry(renderer, theme)
    const clock = new THREE.Clock()
    let frameId

    function resize() {
      const rect = canvas.getBoundingClientRect()
      renderer.setSize(rect.width, rect.height, false)
      scene.onResize(rect.width, rect.height)
    }

    scene.init(canvas.clientWidth, canvas.clientHeight)
    resize()

    function animate() {
      frameId = requestAnimationFrame(animate)
      scene.update(Math.min(clock.getDelta(), 0.05))
      renderer.render(scene.getScene(), scene.getCamera())
    }
    animate()

    const observer = new ResizeObserver(resize)
    observer.observe(canvas)
    return () => {
      cancelAnimationFrame(frameId)
      observer.disconnect()
      scene.destroy()
      renderer.dispose()
    }
  }, [theme])

  return <canvas className="hero-canvas" ref={canvasRef} aria-hidden="true" />
}
