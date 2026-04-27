import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { AppShell } from './AppShell';

describe('AppShell Layout', () => {
  it('renders blockingModal and toastHost outside of the app-shell div', () => {
    const markup = renderToStaticMarkup(
      <AppShell
        isBlocked={true}
        toastHost={<div className="toast-host" />}
        blockingModal={<div className="blocking-modal" />}
      >
        <div className="app-content" />
      </AppShell>
    );

    // Verify shell has blocked class
    expect(markup).toContain('app-shell app-shell--blocked');
    
    // Verify modal and toast are present
    expect(markup).toContain('blocking-modal');
    expect(markup).toContain('toast-host');
    
    // CRITICAL CHECK: The shell div should close BEFORE the modal and toast appear.
    const shellOpening = '<div class="app-shell app-shell--blocked"';
    const toastDiv = '<div class="toast-host"></div>';
    const modalDiv = '<div class="blocking-modal"></div>';
    
    const shellIndex = markup.indexOf(shellOpening);
    const toastIndex = markup.indexOf(toastDiv);
    const modalIndex = markup.indexOf(modalDiv);
    
    expect(shellIndex).toBeGreaterThan(-1);
    expect(toastIndex).toBeGreaterThan(-1);
    expect(modalIndex).toBeGreaterThan(-1);
    
    // Find the end of the shell content. Since we have simple children, we can find the first </div>
    // However, a better way is to check that the string before toastIndex contains the shell closing tag
    // and that the counts of open/close divs match.
    
    const markupBeforeOverlays = markup.substring(0, Math.min(toastIndex, modalIndex));
    
    const openDivs = (markupBeforeOverlays.match(/<div/g) || []).length;
    const closeDivs = (markupBeforeOverlays.match(/<\/div>/g) || []).length;
    
    // The shell div and its children (app-content) should all be closed.
    // Shell: 1 open, Content: 1 open. Total 2.
    // They should both be closed before overlays start.
    expect(openDivs).toBe(2);
    expect(closeDivs).toBe(2);
    
    // Ensure overlays are NOT part of the shell's inner HTML
    expect(markupBeforeOverlays).not.toContain('blocking-modal');
    expect(markupBeforeOverlays).not.toContain('toast-host');
  });

  it('does not apply blocked class when isBlocked is false', () => {
    const markup = renderToStaticMarkup(
      <AppShell
        isBlocked={false}
        toastHost={<div />}
        blockingModal={null}
      >
        <div />
      </AppShell>
    );

    expect(markup).toContain('class="app-shell"');
    expect(markup).not.toContain('app-shell--blocked');
  });
});
