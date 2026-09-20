<template>
  <div class="panel">
    <h3>🗺️ 2D等高线 + 优化路径</h3>
    <canvas ref="cvs" width="400" height="400" class="contour-canvas"></canvas>
    <div class="info">🔵 起点 🟢 当前步 🔴 终点</div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, onMounted } from 'vue'
import { useOptimizationStore } from '../store/optimization'
import { getPathExtents, paddedRange } from '../utils/axis'
const store = useOptimizationStore()
const cvs = ref<HTMLCanvasElement>()

function draw() {
  const c = cvs.value!; const ctx = c.getContext('2d')!; const W = c.width, H = c.height
  ctx.clearRect(0, 0, W, H)

  // Fill background
  ctx.fillStyle = '#0a1929'; ctx.fillRect(0, 0, W, H)

  const path = store.result?.path || []
  if (path.length === 0) return

  // 坐标范围按整条路径固定，动画过程中只追加轨迹，不重新缩放。
  const extents = getPathExtents(path)
  const xRange = paddedRange(extents.x, 0.2)
  const yRange = paddedRange(extents.y, 0.2)
  const zRange = extents.z

  const rx = xRange.min, ry = yRange.min
  const rw = xRange.max - xRange.min, rh = yRange.max - yRange.min

  const tx = (v: number) => ((v - rx) / rw) * W
  const ty = (v: number) => H - ((v - ry) / rh) * H

  // Draw contour-like grid
  ctx.strokeStyle = 'rgba(255,255,255,0.06)'; ctx.lineWidth = 1
  for (let i = 0; i <= 10; i++) {
    const x = i / 10 * W; ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke()
    const y = i / 10 * H; ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke()
  }

  // Draw heatmap-style fill based on z values
  const zr = zRange.max - zRange.min || 1
  for (const pt of path) {
    const t = (pt.z - zRange.min) / zr
    const px = tx(pt.x), py = ty(pt.y)
    // blend: red (high) → blue (low)
    const r = Math.round(255 * t), b = Math.round(255 * (1 - t)), g = Math.round(128 * (1 - Math.abs(t - 0.5) * 2))
    ctx.fillStyle = `rgba(${r},${g},${b},0.3)`
    ctx.beginPath(); ctx.arc(px, py, 2.5, 0, Math.PI * 2); ctx.fill()
  }

  // Draw path line
  const animPath = store.currentPath()
  if (animPath.length > 1) {
    ctx.strokeStyle = 'rgba(0, 255, 200, 0.8)'; ctx.lineWidth = 2
    ctx.beginPath()
    ctx.moveTo(tx(animPath[0].x), ty(animPath[0].y))
    for (let i = 1; i < animPath.length; i++) ctx.lineTo(tx(animPath[i].x), ty(animPath[i].y))
    ctx.stroke()
  }

  // Start point
  ctx.fillStyle = '#4fc3f7'; ctx.strokeStyle = '#fff'; ctx.lineWidth = 2
  ctx.beginPath(); ctx.arc(tx(path[0].x), ty(path[0].y), 6, 0, Math.PI * 2); ctx.fill(); ctx.stroke()

  // Current point
  const cur = animPath[animPath.length - 1]
  ctx.fillStyle = '#66bb6a'
  ctx.beginPath(); ctx.arc(tx(cur.x), ty(cur.y), 5, 0, Math.PI * 2); ctx.fill(); ctx.stroke()

  // Final point
  const last = path[path.length - 1]
  ctx.fillStyle = '#ef5350'
  ctx.beginPath(); ctx.arc(tx(last.x), ty(last.y), 6, 0, Math.PI * 2); ctx.fill(); ctx.stroke()

  // Labels
  ctx.fillStyle = '#aaa'; ctx.font = '11px system-ui'
  ctx.fillText(`x: ${cur.x.toFixed(3)}`, 10, 20)
  ctx.fillText(`y: ${cur.y.toFixed(3)}`, 10, 36)
  ctx.fillText(`f: ${cur.z.toFixed(4)}`, 10, 52)
}

onMounted(draw)
watch(() => [store.result, store.animationStep], draw, { deep: true })
</script>

<style scoped>
.panel { background:#fff; border-radius:8px; padding:16px; box-shadow:0 2px 8px rgba(0,0,0,.06) }
.panel h3 { margin-bottom:8px; color:#333; font-size:14px }
.contour-canvas { display:block; margin:0 auto; border-radius:8px; border:1px solid #eee }
.info { text-align:center; margin-top:8px; font-size:12px; color:#888 }
</style>