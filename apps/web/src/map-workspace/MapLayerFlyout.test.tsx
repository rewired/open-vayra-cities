// @vitest-environment jsdom

import { act, type ComponentProps } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { INITIAL_MAP_LAYER_VISIBILITY } from '../ui/constants/mapLayerUiConstants';
import { MapLayerFlyout } from './MapLayerFlyout';

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

interface RenderResult {
  readonly container: HTMLDivElement;
  readonly root: Root;
}

const renderMapLayerFlyout = (props: ComponentProps<typeof MapLayerFlyout>): RenderResult => {
  const container = document.createElement('div');
  document.body.appendChild(container);
  const root = createRoot(container);

  act(() => {
    root.render(<MapLayerFlyout {...props} />);
  });

  return { container, root };
};

const clickElement = (element: HTMLElement): void => {
  act(() => {
    element.click();
  });
};

const pressEscape = (): void => {
  act(() => {
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
  });
};

const requireElement = <TElement extends Element>(element: TElement | null, label: string): TElement => {
  if (!element) {
    throw new Error(`Expected ${label} to be rendered.`);
  }

  return element;
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

describe('MapLayerFlyout', () => {
  it('opens from the stack button and hides the opener while open', () => {
    mounted = renderMapLayerFlyout({
      visibility: INITIAL_MAP_LAYER_VISIBILITY,
      onToggleLayer: vi.fn()
    });

    const opener = requireElement(
      mounted.container.querySelector<HTMLButtonElement>('[aria-label="Map layers"]'),
      'map layer opener'
    );

    clickElement(opener);

    expect(mounted.container.querySelector('[role="dialog"][aria-label="Map Overlays"]')).not.toBeNull();
    expect(mounted.container.querySelector('[aria-label="Map layers"]')).toBeNull();
    expect(mounted.container.querySelector('[aria-label="Close map layers"]')).not.toBeNull();
  });

  it('closes only from the header close button', () => {
    mounted = renderMapLayerFlyout({
      visibility: INITIAL_MAP_LAYER_VISIBILITY,
      onToggleLayer: vi.fn()
    });

    clickElement(requireElement(
      mounted.container.querySelector<HTMLButtonElement>('[aria-label="Map layers"]'),
      'map layer opener'
    ));

    pressEscape();
    expect(mounted.container.querySelector('[role="dialog"][aria-label="Map Overlays"]')).not.toBeNull();

    act(() => {
      document.body.click();
    });
    expect(mounted.container.querySelector('[role="dialog"][aria-label="Map Overlays"]')).not.toBeNull();

    clickElement(requireElement(
      mounted.container.querySelector<HTMLButtonElement>('[aria-label="Close map layers"]'),
      'map layer close button'
    ));

    expect(mounted.container.querySelector('[role="dialog"][aria-label="Map Overlays"]')).toBeNull();
    expect(mounted.container.querySelector('[aria-label="Map layers"]')).not.toBeNull();
  });

  it('keeps registered layer toggles wired while the flyout is open', () => {
    const onToggleLayer = vi.fn();
    mounted = renderMapLayerFlyout({
      visibility: INITIAL_MAP_LAYER_VISIBILITY,
      onToggleLayer
    });

    clickElement(requireElement(
      mounted.container.querySelector<HTMLButtonElement>('[aria-label="Map layers"]'),
      'map layer opener'
    ));

    const demandGapToggle = requireElement(
      mounted.container.querySelector<HTMLInputElement>('[aria-label="Toggle Demand gaps"]'),
      'demand gap toggle'
    );

    act(() => {
      demandGapToggle.click();
    });

    expect(onToggleLayer).toHaveBeenCalledWith('demand-gap-overlay');
  });
});
