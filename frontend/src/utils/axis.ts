import type { IterationPoint } from '../types'

export interface AxisRange {
  min: number
  max: number
}

export interface PathExtents {
  x: AxisRange
  y: AxisRange
  z: AxisRange
}

const fallbackRange = (): AxisRange => ({ min: 0, max: 1 })

/** 始终使用整条优化路径计算范围，保证动画只增加数据、不改变坐标口径。 */
export function getPathExtents(path: IterationPoint[]): PathExtents {
  if (path.length === 0) {
    return { x: fallbackRange(), y: fallbackRange(), z: fallbackRange() }
  }

  const xs = path.map(point => point.x)
  const ys = path.map(point => point.y)
  const zs = path.map(point => point.z)

  return {
    x: { min: Math.min(...xs), max: Math.max(...xs) },
    y: { min: Math.min(...ys), max: Math.max(...ys) },
    z: { min: Math.min(...zs), max: Math.max(...zs) }
  }
}

export function paddedRange(range: AxisRange, ratio: number): AxisRange {
  const span = range.max - range.min
  if (span === 0) {
    return { min: range.min - 1, max: range.max + 1 }
  }

  const padding = span * ratio
  return { min: range.min - padding, max: range.max + padding }
}
