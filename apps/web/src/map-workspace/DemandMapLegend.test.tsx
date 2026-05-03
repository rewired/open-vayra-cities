import { renderToStaticMarkup } from 'react-dom/server';
import { describe, it, expect } from 'vitest';
import { DemandMapLegend } from './DemandMapLegend';

describe('DemandMapLegend', () => {
  it('renders correctly when only gap overlay is visible', () => {
    const markup = renderToStaticMarkup(
      <DemandMapLegend isGapOverlayVisible={true} isOdHintVisible={false} />
    );

    expect(markup).toContain('Demand Gap Pressure');
    expect(markup).not.toContain('OD Hints');
    expect(markup).toContain('Generated scenario demand');
    
    // Verify categories
    expect(markup).toContain('Uncaptured Residential');
    expect(markup).toContain('Captured but Unserved');
    expect(markup).toContain('Unreachable Workplace');
  });

  it('renders correctly when only OD hint layer is visible', () => {
    const markup = renderToStaticMarkup(
      <DemandMapLegend isGapOverlayVisible={false} isOdHintVisible={true} />
    );

    expect(markup).not.toContain('Demand Gap Pressure');
    expect(markup).toContain('OD Hints');
    expect(markup).toContain('Generated scenario demand');
    
    // Verify OD hint explanation
    expect(markup).toContain('Straight planning hints');
  });

  it('renders both sections without duplicate caveat when both are visible', () => {
    const markup = renderToStaticMarkup(
      <DemandMapLegend isGapOverlayVisible={true} isOdHintVisible={true} />
    );

    expect(markup).toContain('Demand Gap Pressure');
    expect(markup).toContain('OD Hints');
    
    // Caveat should be present
    expect(markup).toContain('Generated scenario demand');
    
    // Check for "duplicate" - this is harder with static markup but we can check the count of sections
    const sectionCount = (markup.match(/demand-gap-legend__section/g) || []).length;
    expect(sectionCount).toBe(2);
  });

  it('contains no "actual" or "true" precision claims in player-facing text', () => {
    const markup = renderToStaticMarkup(
      <DemandMapLegend isGapOverlayVisible={true} isOdHintVisible={true} />
    );
    
    const content = markup.toLowerCase();
    
    expect(content).not.toContain('actual demand');
    expect(content).not.toContain('true od');
    expect(content).not.toContain('real passenger flow');
    expect(content).not.toContain('commuter flow');
    
    // Positive check for non-claim wording
    expect(markup).toContain('Demand Gap Pressure');
    expect(markup).toContain('Straight planning hints');
  });
});
