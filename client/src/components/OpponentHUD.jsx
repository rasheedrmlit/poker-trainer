// Opponent HUD — shows VPIP / PFR / AGG as small badges on player seats
export default function OpponentHUD({ stats, compact = false }) {
  if (!stats) return null;

  const { vpip, pfr, agg } = stats;
  if (vpip == null && pfr == null) return null;

  const vpipColor = vpip > 40 ? '#ef4444' : vpip > 25 ? '#eab308' : '#22c55e';
  const pfrColor = pfr > 20 ? '#ef4444' : pfr > 12 ? '#eab308' : '#22c55e';
  const aggColor = agg > 3 ? '#ef4444' : agg > 1.5 ? '#eab308' : '#3b82f6';

  const fontSize = compact ? 6 : 8;
  const gap = compact ? 1 : 2;

  return (
    <div className="flex items-center justify-center" style={{ gap, marginTop: compact ? 1 : 2 }}>
      <HUDPill label="V" value={vpip} color={vpipColor} fontSize={fontSize} />
      <HUDPill label="P" value={pfr} color={pfrColor} fontSize={fontSize} />
      <HUDPill label="A" value={agg} color={aggColor} fontSize={fontSize} decimal />
    </div>
  );
}

function HUDPill({ label, value, color, fontSize, decimal }) {
  if (value == null) return null;
  return (
    <div style={{
      background: 'rgba(0,0,0,0.6)',
      borderRadius: 3,
      padding: '1px 3px',
      display: 'flex',
      alignItems: 'center',
      gap: 1,
    }}>
      <span style={{ fontSize: fontSize - 1, color: 'rgba(255,255,255,0.4)', fontWeight: 700 }}>{label}</span>
      <span style={{ fontSize, color, fontWeight: 900 }}>{decimal ? value?.toFixed(1) : Math.round(value)}</span>
    </div>
  );
}
