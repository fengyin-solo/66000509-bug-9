<template>
  <div class="panel">
    <h3>🏔️ 3D函数曲面 + 优化轨迹</h3>
    <div ref="container" class="viewer3d"></div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, onMounted, onUnmounted } from 'vue'
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { useOptimizationStore } from '../store/optimization'
import { getPathExtents } from '../utils/axis'

const store = useOptimizationStore()
const container = ref<HTMLDivElement>()
let scene: THREE.Scene, camera: THREE.PerspectiveCamera, renderer: THREE.WebGLRenderer, controls: OrbitControls, animId: number
let surfaceGroup = new THREE.Group(), pathGroup = new THREE.Group()

function initScene() {
  const c = container.value!; scene = new THREE.Scene(); scene.background = new THREE.Color(0x111827)
  camera = new THREE.PerspectiveCamera(45, c.clientWidth/c.clientHeight, 0.1, 50); camera.position.set(4, 4, 5)
  renderer = new THREE.WebGLRenderer({ antialias: true }); renderer.setSize(c.clientWidth, c.clientHeight)
  c.appendChild(renderer.domElement)
  controls = new OrbitControls(camera, renderer.domElement); controls.enableDamping = true
  scene.add(new THREE.AmbientLight(0x404060, 1.5))
  const dl = new THREE.DirectionalLight(0xffffff, 1); dl.position.set(3, 4, 3); scene.add(dl)
  const dl2 = new THREE.DirectionalLight(0x6688cc, 0.4); dl2.position.set(-3, -2, -2); scene.add(dl2)
  scene.add(surfaceGroup); scene.add(pathGroup)
}
function buildSurface() {
  surfaceGroup.clear(); pathGroup.clear()
  const path = store.result?.path || []; if (!path.length) return
  // 坐标范围按整条路径固定，保证与2D视图和收敛曲线使用同一口径。
  const extents = getPathExtents(path)
  const { x: xRange, y: yRange, z: rawZRange } = extents
  const px = xRange.max - xRange.min || 1, py = yRange.max - yRange.min || 1, pzRaw = rawZRange.max - rawZRange.min || 1
  const scale = 3
  const map = (x: number) => ((x - xRange.min) / px - 0.5) * scale
  const mapy = (y: number) => ((y - yRange.min) / py - 0.5) * scale
  const mapz = (z: number) => ((z - rawZRange.min) / pzRaw) * 2

  // Surface points as scattered dots
  const geom = new THREE.BufferGeometry()
  const positions: number[] = [], colors: number[] = []
  for (const pt of path) {
    positions.push(map(pt.x), mapz(pt.z), mapy(pt.y))
    const t = (pt.z - rawZRange.min) / pzRaw
    colors.push(t, 0.3 * (1 - t), 1 - t)
  }
  geom.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3))
  geom.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3))
  const mat = new THREE.PointsMaterial({ size: 0.05, vertexColors: true, blending: THREE.AdditiveBlending, depthWrite: false })
  surfaceGroup.add(new THREE.Points(geom, mat))

  // Path line
  const animPath = store.currentPath()
  if (animPath.length > 1) {
    const lineGeom = new THREE.BufferGeometry()
    const pts: number[] = []
    for (const pt of animPath) pts.push(map(pt.x), mapz(pt.z), mapy(pt.y))
    lineGeom.setAttribute('position', new THREE.Float32BufferAttribute(pts, 3))
    pathGroup.add(new THREE.Line(lineGeom, new THREE.LineBasicMaterial({ color: 0x00ffcc, linewidth: 1 })))
  }

  // Start/current/end markers
  const marker = (x: number, y: number, z: number, color: number, size = 0.12) => {
    const s = new THREE.Mesh(new THREE.SphereGeometry(size, 16, 16), new THREE.MeshPhongMaterial({ color, emissive: color, emissiveIntensity: 0.5 }))
    s.position.set(x, z, y); pathGroup.add(s)
  }
  if (path.length) {
    const first = path[0]; marker(map(first.x), mapy(first.y), mapz(first.z), 0x4fc3f7, 0.14)
    const cur = animPath[animPath.length - 1]; marker(map(cur.x), mapy(cur.y), mapz(cur.z), 0x66bb6a, 0.12)
    const last = path[path.length - 1]; marker(map(last.x), mapy(last.y), mapz(last.z), 0xef5350, 0.14)
  }
}
function animate() { animId = requestAnimationFrame(animate); controls.update(); renderer.render(scene, camera) }
onMounted(() => { initScene(); buildSurface(); animate() })
watch(() => [store.result, store.animationStep], buildSurface, { deep: true })
onUnmounted(() => { cancelAnimationFrame(animId); renderer?.dispose() })
</script>

<style scoped>
.panel { background:#fff; border-radius:8px; padding:16px; box-shadow:0 2px 8px rgba(0,0,0,.06) }
.panel h3 { margin-bottom:8px; color:#333; font-size:14px }
.viewer3d { width:100%; height:360px; border-radius:8px; overflow:hidden; border:1px solid #eee }
</style>