// Shows win/loss streak as a flame or ice badge
export default function StreakBadge({ winStreak, loseStreak }) {
  if (winStreak >= 2) {
    const intensity = Math.min(winStreak, 10);
    return (
      <div className="flex items-center gap-1 px-2 py-0.5 rounded-full animate-fade-in" style={{
        background: `rgba(239, 68, 68, ${0.1 + intensity * 0.03})`,
        border: '1px solid rgba(239, 68, 68, 0.3)',
      }}>
        <span style={{ fontSize: 12 }}>🔥</span>
        <span className="text-orange-400 font-black text-[10px]">{winStreak}W</span>
      </div>
    );
  }

  if (loseStreak >= 3) {
    return (
      <div className="flex items-center gap-1 px-2 py-0.5 rounded-full animate-fade-in" style={{
        background: 'rgba(59, 130, 246, 0.1)',
        border: '1px solid rgba(59, 130, 246, 0.3)',
      }}>
        <span style={{ fontSize: 12 }}>🧊</span>
        <span className="text-blue-400 font-black text-[10px]">{loseStreak}L</span>
      </div>
    );
  }

  return null;
}
