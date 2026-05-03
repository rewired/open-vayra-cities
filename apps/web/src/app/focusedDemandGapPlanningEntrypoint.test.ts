import { describe, expect, it, vi } from 'vitest';
import {
  applyFocusedDemandGapPlanningEntrypoint,
  resolveFocusedDemandGapPlanningEntrypointToolMode,
  type FocusedDemandGapPlanningEntrypointRequest,
  type FocusedDemandGapPlanningEntrypointHandlers
} from './focusedDemandGapPlanningEntrypoint';

describe('focusedDemandGapPlanningEntrypoint', () => {
  describe('resolveFocusedDemandGapPlanningEntrypointToolMode', () => {
    it('resolves start-stop-placement-near-gap to place-stop', () => {
      expect(resolveFocusedDemandGapPlanningEntrypointToolMode('start-stop-placement-near-gap')).toBe('place-stop');
    });

    it('resolves start-line-planning-near-gap to build-line', () => {
      expect(resolveFocusedDemandGapPlanningEntrypointToolMode('start-line-planning-near-gap')).toBe('build-line');
    });
  });

  describe('applyFocusedDemandGapPlanningEntrypoint', () => {
    it('focuses map and selects place-stop mode for stop placement request', () => {
      const focusPosition = vi.fn();
      const selectToolMode = vi.fn();
      const handlers: FocusedDemandGapPlanningEntrypointHandlers = { focusPosition, selectToolMode };
      
      const request: FocusedDemandGapPlanningEntrypointRequest = {
        kind: 'start-stop-placement-near-gap',
        position: { lng: 10, lat: 20 }
      };

      applyFocusedDemandGapPlanningEntrypoint(request, handlers);

      expect(focusPosition).toHaveBeenCalledWith({ lng: 10, lat: 20 });
      expect(selectToolMode).toHaveBeenCalledWith('place-stop');
      
      // Ensure focus happens before tool mode selection for better UX sequencing
      const focusCallOrder = focusPosition.mock.invocationCallOrder[0];
      const selectModeCallOrder = selectToolMode.mock.invocationCallOrder[0];
      expect(focusCallOrder).toBeLessThan(selectModeCallOrder as number);
    });

    it('focuses map and selects build-line mode for line planning request', () => {
      const focusPosition = vi.fn();
      const selectToolMode = vi.fn();
      const handlers: FocusedDemandGapPlanningEntrypointHandlers = { focusPosition, selectToolMode };
      
      const request: FocusedDemandGapPlanningEntrypointRequest = {
        kind: 'start-line-planning-near-gap',
        position: { lng: 30, lat: 40 }
      };

      applyFocusedDemandGapPlanningEntrypoint(request, handlers);

      expect(focusPosition).toHaveBeenCalledWith({ lng: 30, lat: 40 });
      expect(selectToolMode).toHaveBeenCalledWith('build-line');
      
      const focusCallOrder = focusPosition.mock.invocationCallOrder[0];
      const selectModeCallOrder = selectToolMode.mock.invocationCallOrder[0];
      expect(focusCallOrder).toBeLessThan(selectModeCallOrder as number);
    });
  });
});
