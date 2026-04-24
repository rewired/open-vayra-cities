import type { RouteGeometryCoordinate } from '../types/lineRoute';

/**
 * Clamps a raw route-segment progress ratio to the inclusive `[0, 1]` range.
 *
 * Values below `0` are treated as `0` (start of geometry), values above `1` are treated as `1`
 * (end of geometry), and finite values inside the range are returned unchanged.
 */
export const clampRouteSegmentProgressRatio = (rawProgressRatio: number): number => {
  if (!Number.isFinite(rawProgressRatio)) {
    throw new Error('Route segment progress ratio must be a finite number.');
  }

  return Math.max(0, Math.min(1, rawProgressRatio));
};

/**
 * Projects one coordinate along ordered route geometry by traversing leg distances.
 *
 * The helper requires at least two coordinates, clamps `progressRatio` to `[0, 1]`, and then walks
 * each geometry leg using Euclidean distance in coordinate space until the target distance is reached.
 */
export const projectCoordinateAlongRouteGeometry = (
  orderedGeometry: readonly RouteGeometryCoordinate[],
  progressRatio: number
): RouteGeometryCoordinate => {
  if (orderedGeometry.length < 2) {
    throw new Error('Route geometry interpolation requires at least two coordinates.');
  }

  const clampedProgressRatio = clampRouteSegmentProgressRatio(progressRatio);

  const legDistances = orderedGeometry.slice(0, -1).map((fromCoordinate, index) => {
    const toCoordinate = orderedGeometry[index + 1] as RouteGeometryCoordinate;
    const deltaLng = toCoordinate[0] - fromCoordinate[0];
    const deltaLat = toCoordinate[1] - fromCoordinate[1];

    return Math.hypot(deltaLng, deltaLat);
  });

  const totalDistance = legDistances.reduce((sum, distance) => sum + distance, 0);

  if (totalDistance === 0) {
    return clampedProgressRatio >= 1
      ? (orderedGeometry[orderedGeometry.length - 1] as RouteGeometryCoordinate)
      : (orderedGeometry[0] as RouteGeometryCoordinate);
  }

  const targetDistance = totalDistance * clampedProgressRatio;
  let traversedDistance = 0;

  for (let index = 0; index < legDistances.length; index += 1) {
    const legDistance = legDistances[index] ?? 0;
    const fromCoordinate = orderedGeometry[index] as RouteGeometryCoordinate;
    const toCoordinate = orderedGeometry[index + 1] as RouteGeometryCoordinate;

    const legTargetDistance = targetDistance - traversedDistance;

    if (legDistance === 0) {
      if (legTargetDistance <= 0) {
        return fromCoordinate;
      }

      continue;
    }

    if (legTargetDistance <= legDistance || index === legDistances.length - 1) {
      const legRatio = legTargetDistance / legDistance;
      const projectedLng = fromCoordinate[0] + (toCoordinate[0] - fromCoordinate[0]) * legRatio;
      const projectedLat = fromCoordinate[1] + (toCoordinate[1] - fromCoordinate[1]) * legRatio;

      return [projectedLng, projectedLat];
    }

    traversedDistance += legDistance;
  }

  return orderedGeometry[orderedGeometry.length - 1] as RouteGeometryCoordinate;
};
