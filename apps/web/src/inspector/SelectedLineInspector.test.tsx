// @vitest-environment jsdom

import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { MVP_TIME_BAND_IDS } from '../domain/constants/timeBands';
import { createNoServiceLineServiceByTimeBand, createLineId, type Line } from '../domain/types/line';
import {
  createLineSegmentId,
  createRouteDistanceMeters,
  createRouteTravelMinutes,
  type LineRouteSegment
} from '../domain/types/lineRoute';
import { createStopId, type Stop } from '../domain/types/stop';
import type {
  LineFrequencyControlByTimeBand,
  LineFrequencyInputByTimeBand,
  LineFrequencyValidationByTimeBand
} from '../session/useNetworkSessionState';
import { SelectedLineInspector } from './SelectedLineInspector';

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

const createInputState = (value: string): LineFrequencyInputByTimeBand =>
  Object.fromEntries(MVP_TIME_BAND_IDS.map((timeBandId) => [timeBandId, value])) as LineFrequencyInputByTimeBand;

const createValidationState = (value: string | null): LineFrequencyValidationByTimeBand =>
  Object.fromEntries(MVP_TIME_BAND_IDS.map((timeBandId) => [timeBandId, value])) as LineFrequencyValidationByTimeBand;

const createControlState = (value: 'frequency' | 'no-service'): LineFrequencyControlByTimeBand =>
  Object.fromEntries(MVP_TIME_BAND_IDS.map((timeBandId) => [timeBandId, value])) as LineFrequencyControlByTimeBand;

const lineId = createLineId('line-1');
const stopA = createStopId('stop-a');
const stopB = createStopId('stop-b');
const stopMissing = createStopId('stop-missing');

const routeSegments: readonly LineRouteSegment[] = [
  {
    id: createLineSegmentId('segment-1'),
    lineId,
    fromStopId: stopA,
    toStopId: stopB,
    orderedGeometry: [
      [10, 53],
      [10.01, 53.01]
    ],
    distanceMeters: createRouteDistanceMeters(1_000),
    inMotionTravelMinutes: createRouteTravelMinutes(3.5),
    dwellMinutes: createRouteTravelMinutes(0.5),
    totalTravelMinutes: createRouteTravelMinutes(4),
    status: 'routed'
  }
];

const line: Line = {
  id: lineId,
  label: 'Line 1',
  stopIds: [stopA, stopMissing, stopB],
  topology: 'linear',
  servicePattern: 'one-way',
  routeSegments,
  frequencyByTimeBand: createNoServiceLineServiceByTimeBand()
};

const placedStops: readonly Stop[] = [
  { id: stopA, label: 'Alpha', position: { lat: 53, lng: 10 } },
  { id: stopB, label: 'Bravo', position: { lat: 53.01, lng: 10.01 } }
];

interface RenderResult {
  readonly container: HTMLDivElement;
  readonly root: Root;
  readonly onStopRename: ReturnType<typeof vi.fn>;
}

const renderInspector = (): RenderResult => {
  const container = document.createElement('div');
  document.body.appendChild(container);
  const root = createRoot(container);

  const onStopRename = vi.fn();

  act(() => {
    root.render(
      <SelectedLineInspector
        panelState={{ mode: 'line-selected', selectedLine: line }}
        selectedLineRouteBaseline={null}
        placedStops={placedStops}
        activeTimeBandId="morning-rush"
        lineFrequencyInputByTimeBand={createInputState('')}
        lineFrequencyControlByTimeBand={createControlState('no-service')}
        lineFrequencyValidationByTimeBand={createValidationState(null)}
        selectedLineServiceProjection={null}
        selectedLineServiceInspectorProjection={null}
        selectedLinePlanningVehicleProjection={null}
        onLineRename={vi.fn()}
        onLineSequenceStopFocus={vi.fn()}
        onStopSelectionChange={vi.fn()}
        onStopRename={onStopRename}
        onFrequencyChange={vi.fn()}
        openDialogIntent={null}
        onOpenDialogIntentConsumed={vi.fn()}
      />
    );
  });

  return { container, root, onStopRename };
};

let mounted: RenderResult | null = null;

afterEach(() => {
  if (!mounted) {
    return;
  }

  act(() => {
    mounted?.root.unmount();
  });
  mounted.container.remove();
  mounted = null;
});

describe('SelectedLineInspector route sequence', () => {
  it('renders ordered stop badges and resolves labels from placedStops with fallback for missing stops', () => {
    mounted = renderInspector();

    const routeItems = mounted.container.querySelectorAll('.selected-line-inspector__route-item');
    expect(routeItems.length).toBe(3);
    expect(routeItems[0]?.textContent).toContain('1');
    expect(routeItems[0]?.textContent).toContain('Alpha');
    expect(routeItems[1]?.textContent).toContain('2');
    expect(routeItems[1]?.textContent).toContain('Unknown stop (stop-missing)');
    expect(routeItems[2]?.textContent).toContain('3');
    expect(routeItems[2]?.textContent).toContain('Bravo');
  });

  it('wires line-context stop focus callback when badge is clicked', () => {
    const onLineSequenceStopFocus = vi.fn();
    const container = document.createElement('div');
    document.body.appendChild(container);
    const root = createRoot(container);

    act(() => {
      root.render(
        <SelectedLineInspector
          panelState={{ mode: 'line-selected', selectedLine: line }}
          selectedLineRouteBaseline={null}
          placedStops={placedStops}
          activeTimeBandId="morning-rush"
          lineFrequencyInputByTimeBand={createInputState('')}
          lineFrequencyControlByTimeBand={createControlState('no-service')}
          lineFrequencyValidationByTimeBand={createValidationState(null)}
          selectedLineServiceProjection={null}
          selectedLineServiceInspectorProjection={null}
          selectedLinePlanningVehicleProjection={null}
          onLineRename={vi.fn()}
          onLineSequenceStopFocus={onLineSequenceStopFocus}
          onStopSelectionChange={vi.fn()}
          onStopRename={vi.fn()}
          onFrequencyChange={vi.fn()}
          openDialogIntent={null}
          onOpenDialogIntentConsumed={vi.fn()}
        />
      );
    });

    const badges = container.querySelectorAll('.selected-line-inspector__route-order-badge');
    const firstBadge = badges.item(0);
    expect(firstBadge).not.toBeNull();

    act(() => {
      (firstBadge as HTMLElement).click();
    });

    expect(onLineSequenceStopFocus).toHaveBeenCalledWith(stopA);

    act(() => {
      root.unmount();
    });
    container.remove();
  });

  it('wires stop rename callback from route-row inline rename control', () => {
    mounted = renderInspector();

    const renameButtons = mounted.container.querySelectorAll('[aria-label="Rename stop"]');
    const firstStopRenameButton = renameButtons.item(0);
    expect(firstStopRenameButton).not.toBeNull();

    act(() => {
      (firstStopRenameButton as HTMLElement).click();
    });

    const input = mounted.container.querySelector('input[aria-label="stop name"]') as HTMLInputElement;
    const valueSetter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')?.set;
    if (!valueSetter) {
      throw new Error('Unable to resolve HTMLInputElement value setter.');
    }

    act(() => {
      valueSetter.call(input, '  Alpha Prime  ');
      input.dispatchEvent(new Event('input', { bubbles: true }));
      input.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
    });

    expect(mounted.onStopRename).toHaveBeenCalledWith(stopA, 'Alpha Prime');
  });
});
