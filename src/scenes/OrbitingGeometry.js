import * as THREE from 'three'

export default class OrbitingGeometry {
  static sceneName = 'Orbiting Geometry'

  constructor(renderer) {
    this.renderer = renderer
    this.scene = new THREE.Scene()
    this.camera = null
    this._mesh = null
    this._mouse = new THREE.Vector2()
    this._targetRotation = new THREE.Vector2()
    this._currentLean = new THREE.Vector2()
    this._baseRotation = new THREE.Vector2()
    this._onMouseMove = this._onMouseMove.bind(this)
  }

  init(width, height) {
    this.camera = new THREE.PerspectiveCamera(60, width / height, 0.1, 100)
    this.camera.position.z = 5

    this.scene.background = new THREE.Color(0x000000)

    const icoGeo = new THREE.IcosahedronGeometry(1.8, 1)
    const edgesGeo = new THREE.EdgesGeometry(icoGeo)
    icoGeo.dispose()

    const material = new THREE.LineBasicMaterial({
      color: 0xffffff,
      opacity: 0.85,
      transparent: true,
    })

    this._mesh = new THREE.LineSegments(edgesGeo, material)
    this.scene.add(this._mesh)

    window.addEventListener('mousemove', this._onMouseMove)
  }

  _onMouseMove(e) {
    this._mouse.x = (e.clientX / window.innerWidth) * 2 - 1
    this._mouse.y = -(e.clientY / window.innerHeight) * 2 + 1
    this._targetRotation.set(this._mouse.y * 0.4, this._mouse.x * 0.4)
  }

  update(delta, elapsed) {
    if (!this._mesh) return

    this._baseRotation.y += delta * 0.3
    this._baseRotation.x += delta * 0.1

    this._currentLean.lerp(this._targetRotation, delta * 2)

    this._mesh.rotation.x = this._baseRotation.x + this._currentLean.x
    this._mesh.rotation.y = this._baseRotation.y + this._currentLean.y
  }

  getScene() { return this.scene }
  getCamera() { return this.camera }

  onResize(width, height) {
    if (this.camera) {
      this.camera.aspect = width / height
      this.camera.updateProjectionMatrix()
    }
  }

  destroy() {
    window.removeEventListener('mousemove', this._onMouseMove)
    this.scene.traverse((obj) => {
      if (obj.geometry) obj.geometry.dispose()
      if (obj.material) obj.material.dispose()
    })
    this._mesh = null
  }
}
