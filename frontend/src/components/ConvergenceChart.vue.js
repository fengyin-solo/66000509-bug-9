/// <reference types="../../node_modules/.vue-global-types/vue_3.5_0_0_0.d.ts" />
import { ref, watch, onMounted, onUnmounted } from 'vue';
import * as echarts from 'echarts';
import { useOptimizationStore } from '../store/optimization';
const store = useOptimizationStore();
const chart = ref();
let instance = null;
const onResize = () => instance?.resize();
function initChart() {
    if (!chart.value)
        return;
    instance = echarts.init(chart.value);
    window.addEventListener('resize', onResize);
    updateChart();
}
function updateChart() {
    if (!instance || !store.result)
        return;
    // 数据只画到当前步（进度只往右推进），但坐标轴按整段路径的口径固定
    const data = store.currentPath().map(p => [p.step, p.z]);
    const [zLo, zHi] = store.zRange;
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
    }, { notMerge: true });
}
onMounted(initChart);
watch(() => [store.result, store.animationStep], updateChart, { deep: true });
onUnmounted(() => {
    window.removeEventListener('resize', onResize);
    instance?.dispose();
    instance = null;
});
debugger; /* PartiallyEnd: #3632/scriptSetup.vue */
const __VLS_ctx = {};
let __VLS_components;
let __VLS_directives;
/** @type {__VLS_StyleScopedClasses['panel']} */ ;
// CSS variable injection 
// CSS variable injection end 
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "panel" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.h3, __VLS_intrinsicElements.h3)({});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ref: "chart",
    ...{ class: "chart" },
});
/** @type {typeof __VLS_ctx.chart} */ ;
/** @type {__VLS_StyleScopedClasses['panel']} */ ;
/** @type {__VLS_StyleScopedClasses['chart']} */ ;
var __VLS_dollars;
const __VLS_self = (await import('vue')).defineComponent({
    setup() {
        return {
            chart: chart,
        };
    },
});
export default (await import('vue')).defineComponent({
    setup() {
        return {};
    },
});
; /* PartiallyEnd: #4569/main.vue */
