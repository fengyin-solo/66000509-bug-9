import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import axios from 'axios'
import type { OptimizationParams, OptimizationResult, IterationPoint } from '@/types'

export const useOptimizationStore = defineStore('optimization', () => {
  const loading = ref(false)
  const result = ref<OptimizationResult | null>(null)
  const animationStep = ref(0)
  const isPlaying = ref(false)
  let playTimer: ReturnType<typeof setInterval> | null = null

  // 统一坐标口径：所有图表都基于整段路径一次性算定，动画只推进进度，不重算范围
  const fullPath = computed<IterationPoint[]>(() => result.value?.path ?? [])
  const maxStep = computed(() => Math.max(0, fullPath.value.length - 1))
  const zRange = computed<[number, number]>(() => {
    const zs = fullPath.value.map(p => p.z)
    if (!zs.length) return [0, 1]
    const lo = Math.min(...zs), hi = Math.max(...zs)
    const pad = (hi - lo) * 0.1 || Math.abs(hi) * 0.1 || 1
    return [lo - pad, hi + pad]
  })

  async function runOptimization(params: OptimizationParams) {
    loading.value = true
    stopAnimation()
    try {
      const { data } = await axios.post('/api/optimize', params)
      result.value = data
      animationStep.value = 0
    } finally { loading.value = false }
  }

  const currentPath = () => {
    if (!result.value) return []
    return result.value.path.slice(0, animationStep.value + 1)
  }

  function playAnimation() {
    if (!result.value || isPlaying.value) return
    // 已播到末尾时再次播放，从头开始，保证进度只往右推进
    if (animationStep.value >= maxStep.value) animationStep.value = 0
    isPlaying.value = true
    playTimer = setInterval(() => {
      if (animationStep.value < maxStep.value) {
        animationStep.value++
      } else {
        stopAnimation()
      }
    }, 80)
  }

  function pauseAnimation() { stopAnimation() }
  function stopAnimation() {
    isPlaying.value = false
    if (playTimer) { clearInterval(playTimer); playTimer = null }
  }

  function resetAnimation() { stopAnimation(); animationStep.value = 0 }
  function setStep(step: number) {
    animationStep.value = Math.min(Math.max(0, Math.round(step)), maxStep.value)
  }

  return {
    loading, result, animationStep, isPlaying, currentPath,
    fullPath, maxStep, zRange,
    runOptimization, playAnimation, pauseAnimation, stopAnimation, resetAnimation, setStep
  }
})
