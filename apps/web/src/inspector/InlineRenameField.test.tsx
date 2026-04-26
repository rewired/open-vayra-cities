// @vitest-environment jsdom

import { act, type ComponentProps } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { InlineRenameField } from './InlineRenameField';

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

interface RenderResult {
  readonly container: HTMLDivElement;
  readonly root: Root;
}

const renderInlineRenameField = (props: ComponentProps<typeof InlineRenameField>): RenderResult => {
  const container = document.createElement('div');
  document.body.appendChild(container);
  const root = createRoot(container);

  act(() => {
    root.render(<InlineRenameField {...props} />);
  });

  return { container, root };
};

const click = (element: Element): void => {
  act(() => {
    (element as HTMLElement).click();
  });
};

const inputText = (input: HTMLInputElement, value: string): void => {
  const valueSetter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')?.set;
  if (!valueSetter) {
    throw new Error('Unable to resolve HTMLInputElement value setter.');
  }

  act(() => {
    valueSetter.call(input, value);
    input.dispatchEvent(new Event('input', { bubbles: true }));
  });
};

const pressKey = (input: HTMLInputElement, key: string): void => {
  act(() => {
    input.dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true }));
  });
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

describe('InlineRenameField', () => {
  it('accepts rename on Enter key', () => {
    const onAccept = vi.fn();
    mounted = renderInlineRenameField({ value: 'Alpha', entityLabel: 'stop', onAccept });

    const renameButton = mounted.container.querySelector('[aria-label="Rename stop"]');
    expect(renameButton).not.toBeNull();
    click(renameButton!);

    const input = mounted.container.querySelector('input[aria-label="stop name"]') as HTMLInputElement;
    inputText(input, 'Bravo');
    pressKey(input, 'Enter');

    expect(onAccept).toHaveBeenCalledWith('Bravo');
    expect(mounted.container.querySelector('[aria-label="Rename stop"]')).not.toBeNull();
  });

  it('cancels rename on Escape key', () => {
    const onAccept = vi.fn();
    mounted = renderInlineRenameField({ value: 'Alpha', entityLabel: 'stop', onAccept });

    click(mounted.container.querySelector('[aria-label="Rename stop"]')!);
    const input = mounted.container.querySelector('input[aria-label="stop name"]') as HTMLInputElement;
    inputText(input, 'Bravo');
    pressKey(input, 'Escape');

    expect(onAccept).not.toHaveBeenCalled();
    expect(mounted.container.querySelector('[aria-label="Rename stop"]')).not.toBeNull();
  });

  it('accepts rename when clicking the check button', () => {
    const onAccept = vi.fn();
    mounted = renderInlineRenameField({ value: 'Alpha', entityLabel: 'stop', onAccept });

    click(mounted.container.querySelector('[aria-label="Rename stop"]')!);
    const input = mounted.container.querySelector('input[aria-label="stop name"]') as HTMLInputElement;
    inputText(input, 'Charlie');
    click(mounted.container.querySelector('[aria-label="Accept stop rename"]')!);

    expect(onAccept).toHaveBeenCalledWith('Charlie');
  });

  it('cancels rename when clicking the close button', () => {
    const onAccept = vi.fn();
    mounted = renderInlineRenameField({ value: 'Alpha', entityLabel: 'stop', onAccept });

    click(mounted.container.querySelector('[aria-label="Rename stop"]')!);
    const input = mounted.container.querySelector('input[aria-label="stop name"]') as HTMLInputElement;
    inputText(input, 'Charlie');
    click(mounted.container.querySelector('[aria-label="Cancel stop rename"]')!);

    expect(onAccept).not.toHaveBeenCalled();
    expect(mounted.container.querySelector('[aria-label="Rename stop"]')).not.toBeNull();
  });

  it('trims accepted input and rejects empty names', () => {
    const onAccept = vi.fn();
    mounted = renderInlineRenameField({ value: 'Alpha', entityLabel: 'stop', onAccept });

    click(mounted.container.querySelector('[aria-label="Rename stop"]')!);
    const input = mounted.container.querySelector('input[aria-label="stop name"]') as HTMLInputElement;

    inputText(input, '   Delta   ');
    pressKey(input, 'Enter');
    expect(onAccept).toHaveBeenCalledWith('Delta');

    click(mounted.container.querySelector('[aria-label="Rename stop"]')!);
    const secondInput = mounted.container.querySelector('input[aria-label="stop name"]') as HTMLInputElement;
    inputText(secondInput, '   ');
    pressKey(secondInput, 'Enter');

    expect(onAccept).toHaveBeenCalledTimes(1);
    expect(mounted.container.textContent).toContain('Name cannot be empty.');
  });

  it('does not auto-commit on blur', () => {
    const onAccept = vi.fn();
    mounted = renderInlineRenameField({ value: 'Alpha', entityLabel: 'stop', onAccept });

    click(mounted.container.querySelector('[aria-label="Rename stop"]')!);
    const input = mounted.container.querySelector('input[aria-label="stop name"]') as HTMLInputElement;
    inputText(input, 'Echo');

    act(() => {
      input.dispatchEvent(new FocusEvent('blur', { bubbles: true }));
    });

    expect(onAccept).not.toHaveBeenCalled();
    expect(mounted.container.querySelector('input[aria-label="stop name"]')).not.toBeNull();
  });
});
