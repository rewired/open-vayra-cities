import type { ReactElement } from 'react';

interface OsmStopCandidateHoverTooltipProps {
  readonly candidateGroupId: string;
  readonly label: string;
  readonly memberCount: number;
  readonly memberKinds: string;
  readonly berthCountHint: number;
  readonly x: number;
  readonly y: number;
}

/**
 * Simpler tooltip for OSM candidate hover displaying candidate name and kind.
 * Distinct from CityOps stop hover - no line membership or selection state.
 */
export function OsmStopCandidateHoverTooltip({
  candidateGroupId,
  label,
  memberCount,
  memberKinds,
  berthCountHint,
  x,
  y
}: OsmStopCandidateHoverTooltipProps): ReactElement {
  const memberLabel = memberCount === 1 ? '1 OSM object' : `${memberCount} OSM objects grouped`;
  const berthLabel = berthCountHint > 0 ? `${berthCountHint} visible stop bays` : null;

  return (
    <div
      className="osm-candidate-hover-tooltip"
      style={{
        position: 'absolute',
        left: x + 12,
        top: y - 12,
        pointerEvents: 'none',
        zIndex: 1000,
        backgroundColor: 'rgba(55, 65, 81, 0.95)',
        backdropFilter: 'blur(8px)',
        border: '1px solid rgba(255, 255, 255, 0.15)',
        borderRadius: '6px',
        padding: '8px 12px',
        boxShadow: '0 8px 20px -4px rgba(0, 0, 0, 0.3)',
        color: '#f8fafc',
        minWidth: '140px'
      }}
    >
      <h3 style={{ margin: '0 0 4px 0', fontSize: '13px', fontWeight: 600, color: '#d1d5db' }}>
        {label}
      </h3>
      <div style={{ fontSize: '11px', color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
        {memberLabel}
      </div>
      {berthLabel && (
        <div style={{ fontSize: '10px', color: '#64748b', marginTop: '2px', fontStyle: 'italic' }}>
          {berthLabel}
        </div>
      )}
    </div>
  );
}