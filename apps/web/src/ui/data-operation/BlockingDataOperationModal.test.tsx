import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { BlockingDataOperationModal } from './BlockingDataOperationModal';
import type { ActiveDataOperation } from './types';

describe('BlockingDataOperationModal', () => {
  it('renders nothing when activeOperation is null', () => {
    const markup = renderToStaticMarkup(
      <BlockingDataOperationModal activeOperation={null} />
    );
    expect(markup).toBe('');
  });

  it('renders title and phase when active', () => {
    const op: ActiveDataOperation = {
      title: 'Test Operation',
      phase: 'Doing something...',
      progress: { kind: 'indeterminate' }
    };

    const markup = renderToStaticMarkup(
      <BlockingDataOperationModal activeOperation={op} />
    );

    expect(markup).toContain('Test Operation');
    expect(markup).toContain('Doing something...');
    expect(markup).toContain('role="dialog"');
    expect(markup).toContain('aria-modal="true"');
  });

  it('renders indeterminate progress bar when progress kind is indeterminate', () => {
    const op: ActiveDataOperation = {
      title: 'Test',
      phase: 'Testing...',
      progress: { kind: 'indeterminate' }
    };

    const markup = renderToStaticMarkup(
      <BlockingDataOperationModal activeOperation={op} />
    );

    expect(markup).toContain('blocking-data-operation-modal__progress-bar--indeterminate');
  });

  it('renders determinate progress bar with correct percent and accessibility attributes', () => {
    const op: ActiveDataOperation = {
      title: 'Test',
      phase: 'Testing...',
      progress: { kind: 'determinate', completed: 45, total: 100 }
    };

    const markup = renderToStaticMarkup(
      <BlockingDataOperationModal activeOperation={op} />
    );

    expect(markup).toContain('style="width:45%"');
    expect(markup).toContain('aria-valuenow="45"');
    expect(markup).toContain('role="progressbar"');
    expect(markup).toContain('45%');
  });

  it('clamps determinate progress between 0 and 100 percent', () => {
    const opOver: ActiveDataOperation = {
      title: 'Test',
      phase: 'Testing...',
      progress: { kind: 'determinate', completed: 150, total: 100 }
    };

    const markupOver = renderToStaticMarkup(
      <BlockingDataOperationModal activeOperation={opOver} />
    );
    expect(markupOver).toContain('style="width:100%"');
    expect(markupOver).toContain('aria-valuenow="100"');

    const opUnder: ActiveDataOperation = {
      title: 'Test',
      phase: 'Testing...',
      progress: { kind: 'determinate', completed: -10, total: 100 }
    };

    const markupUnder = renderToStaticMarkup(
      <BlockingDataOperationModal activeOperation={opUnder} />
    );
    expect(markupUnder).toContain('style="width:0%"');
    expect(markupUnder).toContain('aria-valuenow="0"');
  });
});
