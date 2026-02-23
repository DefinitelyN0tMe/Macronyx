// Natural Mouse Curve Generator — produces bezier-based intermediate points
// for smooth, human-like cursor movement (v1.4)

import type { MouseCurveSettings } from '../../shared/types'

interface Point {
  x: number
  y: number
}

export class MouseCurveGenerator {
  /** Generate intermediate points along a bezier curve from start to end.
   *  Returns an array of points including start and end. */
  static generateCurve(
    start: Point,
    end: Point,
    settings: MouseCurveSettings
  ): Point[] {
    const dist = Math.sqrt(
      Math.pow(end.x - start.x, 2) + Math.pow(end.y - start.y, 2)
    )

    // Adaptive resolution: more points for longer distances
    const numPoints = Math.max(5, Math.min(20, Math.round(dist / 30)))

    // Generate control points for cubic bezier
    const { curvature, overshoot } = settings

    // Direction vector and perpendicular
    const dx = end.x - start.x
    const dy = end.y - start.y
    const len = Math.max(1, Math.sqrt(dx * dx + dy * dy))
    const perpX = -dy / len
    const perpY = dx / len

    // Curvature offset (random direction for natural feel)
    const curveSign = Math.random() > 0.5 ? 1 : -1
    const curveAmount = (curvature / 100) * dist * 0.3 * curveSign

    // Control point 1: 1/3 of the way, offset perpendicular
    const cp1: Point = {
      x: start.x + dx * 0.33 + perpX * curveAmount * (0.5 + Math.random() * 0.5),
      y: start.y + dy * 0.33 + perpY * curveAmount * (0.5 + Math.random() * 0.5)
    }

    // Control point 2: 2/3 of the way, offset perpendicular (less than cp1 for S-curve variation)
    const cp2: Point = {
      x: start.x + dx * 0.66 + perpX * curveAmount * (0.2 + Math.random() * 0.3),
      y: start.y + dy * 0.66 + perpY * curveAmount * (0.2 + Math.random() * 0.3)
    }

    // Generate points along the cubic bezier
    const points: Point[] = []

    for (let i = 0; i <= numPoints; i++) {
      let t = i / numPoints

      // Apply speed profile easing
      t = MouseCurveGenerator.applySpeedProfile(t, settings.speedProfile)

      const point = MouseCurveGenerator.cubicBezier(start, cp1, cp2, end, t)
      points.push(point)
    }

    // Apply overshoot: extend past the target slightly, then correct
    if (overshoot > 0 && dist > 30) {
      const overshootAmount = (overshoot / 50) * Math.min(dist * 0.08, 15)
      const overshootDir = { x: dx / len, y: dy / len }

      // Insert overshoot point before the last point
      const overshootPoint: Point = {
        x: end.x + overshootDir.x * overshootAmount,
        y: end.y + overshootDir.y * overshootAmount
      }

      // Replace last two points with overshoot sequence
      if (points.length >= 2) {
        points[points.length - 2] = overshootPoint
        // Last point is already the target (end)
      }
    }

    return points
  }

  /** Cubic bezier interpolation */
  private static cubicBezier(
    p0: Point, p1: Point, p2: Point, p3: Point, t: number
  ): Point {
    const mt = 1 - t
    const mt2 = mt * mt
    const mt3 = mt2 * mt
    const t2 = t * t
    const t3 = t2 * t

    return {
      x: mt3 * p0.x + 3 * mt2 * t * p1.x + 3 * mt * t2 * p2.x + t3 * p3.x,
      y: mt3 * p0.y + 3 * mt2 * t * p1.y + 3 * mt * t2 * p2.y + t3 * p3.y
    }
  }

  /** Apply speed profile easing to the t parameter */
  private static applySpeedProfile(
    t: number,
    profile: MouseCurveSettings['speedProfile']
  ): number {
    switch (profile) {
      case 'ease-in-out':
        // Smooth S-curve: slow start, fast middle, slow end
        return t < 0.5
          ? 4 * t * t * t
          : 1 - Math.pow(-2 * t + 2, 3) / 2

      case 'natural':
        // Quick acceleration, gradual deceleration (more natural for mouse)
        return 1 - Math.pow(1 - t, 2.5)

      case 'constant':
      default:
        return t
    }
  }
}
