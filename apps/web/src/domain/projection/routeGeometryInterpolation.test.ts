import { describe, expect, it } from 'vitest';

import type { RouteGeometryCoordinate } from '../types/lineRoute';
import {
  clampRouteSegmentProgressRatio,
  projectCoordinateAlongRouteGeometry
} from './routeGeometryInterpolation';

describe('clampRouteSegmentProgressRatio', () => {
  it('clamps values below zero and above one', () => {
    expect(clampRouteSegmentProgressRatio(-0.4)).toBe(0);
    expect(clampRouteSegmentProgressRatio(1.7)).toBe(1);
  });

  it('throws for non-finite progress ratios', () => {
    expect(() => clampRouteSegmentProgressRatio(Number.NaN)).toThrowError('finite');
  });
});

describe('projectCoordinateAlongRouteGeometry', () => {
  it('projects midpoint on a two-point geometry', () => {
    const geometry: readonly RouteGeometryCoordinate[] = [
      [10, 53],
      [12, 57]
    ];

    expect(projectCoordinateAlongRouteGeometry(geometry, 0.5)).toEqual([11, 55]);
  });

  it('walks multi-point leg distances instead of endpoint-only interpolation', () => {
    const geometry: readonly RouteGeometryCoordinate[] = [
      [0, 0],
      [3, 0],
      [3, 4]
    ];

    expect(projectCoordinateAlongRouteGeometry(geometry, 0.5)).toEqual([3, 0.5]);
  });

  it('clamps out-of-range progress ratios to terminal geometry coordinates', () => {
    const geometry: readonly RouteGeometryCoordinate[] = [
      [5, 6],
      [9, 10],
      [11, 12]
    ];

    expect(projectCoordinateAlongRouteGeometry(geometry, -0.25)).toEqual([5, 6]);
    expect(projectCoordinateAlongRouteGeometry(geometry, 2)).toEqual([11, 12]);
  });

  it('throws when geometry has fewer than two coordinates', () => {
    const singlePointGeometry: readonly RouteGeometryCoordinate[] = [[10, 53]];

    expect(() => projectCoordinateAlongRouteGeometry(singlePointGeometry, 0.3)).toThrowError('at least two');
  });
});
