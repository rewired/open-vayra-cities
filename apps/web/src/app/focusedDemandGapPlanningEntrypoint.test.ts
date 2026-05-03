import { describe, expect, it, vi } from 'vitest';
import {
  applyFocusedDemandGapPlanningEntrypoint,
  resolveFocusedDemandGapPlanningEntrypointToolMode,
  type FocusedDemandGapPlanningEntrypointRequest,
  type FocusedDemandGapPlanningEntrypointHandlers
} from './focusedDemandGapPlanningEntrypoint';

const getSingleInvocationOrder = (
  mockFn: { readonly mock: { readonly invocationCallOrder: readonly number[] } },
  label: string
): number => {
  const [callOrder] = mockFn.mock.invocationCallOrder;
  if (callOrder === undefined) {
    throw new Error(`Expected ${label} to have been called.`);
  }
  return callOrder;
};
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
      const focusCallOrder = getSingleInvocationOrder(focusPosition, 'focusPosition');
      const selectModeCallOrder = getSingleInvocationOrder(selectToolMode, 'selectToolMode');
      expect(focusCallOrder).toBeLessThan(selectModeCallOrder);
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
      
      const focusCallOrder = getSingleInvocationOrder(focusPosition, 'focusPosition');
      const selectModeCallOrder = getSingleInvocationOrder(selectToolMode, 'selectToolMode');
      expect(focusCallOrder).toBeLessThan(selectModeCallOrder);
    });
  });
});
