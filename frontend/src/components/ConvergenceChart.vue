<template>
  <div class="panel">
    <h3>📉 收敛曲线</h3>
    <div ref="chart" class="chart"></div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, onMounted, onUnmounted } from 'vue'
import * as echarts from 'echarts'
import { useOptimizationStore } from '../store/optimization'

const store = useOptimizationStore()
const chart = ref<HTMLDivElement>()
let instance: echarts.ECharts | null = null
const onResize = () => instance?.resize()

function initChart() {
  if (!chart.value) return
  instance = echarts.init(chart.value)
  window.addEventListener('resize', onResize)
  updateChart()
}

function updateChart() {
  if (!instance || !store.result) return
  // 数据只画到当前步（进度只往右推进），但坐标轴按整段路径的口径固定
  const data = store.currentPath().map(p => [p.step, p.z])
  const [zLo, zHi] = store.zRange
  instance.setOption({
    backgroundColor: 'transparent',
    grid: { left: 50, right: 20, top: 20, bottom: 40 },
    xAxis: { type: 'value', name: '迭代步数', nameLocation: 'middle', nameGap: 25, min: 0, max: Math.max(1, store.maxStep) },
    yAxis: { type: 'value', name: 'f(x,y)', nameLocation: 'middle', nameGap: 40, min: zLo, max: zHi },
    series: [{
      type: 'line', data, smooth: true, symbol: 'none',
      lineStyle: { color: '#667eea', width: 2 },
      areaStyle: { color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
        { offset: 0, color: 'rgba(102,126,234,0.3)' }, { offset: 1, color: 'rgba(102,126,234,0)' }
      ]) }
    }],
    animation: false
  }, { notMerge: true })
}

onMounted(initChart)
watch(() => [store.result, store.animationStep], updateChart, { deep: true })
onUnmounted(() => {
  window.removeEventListener('resize', onResize)
  instance?.dispose(); instance = null
})
</script>

<style scoped>
.panel { background:#fff; border-radius:8px; padding:16px; margin-top:16px; box-shadow:0 2px 8px rgba(0,0,0,.06) }
.panel h3 { margin-bottom:8px; color:#333; font-size:14px }
.chart { width:100%; height:280px }
</style>
