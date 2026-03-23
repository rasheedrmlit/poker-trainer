import { useState, useEffect } from 'react';
import Card from './Card';
import PlayerSeat from './PlayerSeat';
import PreflopBadge from './PreflopBadge';
import { formatChips } from '../utils/cards';

const SEAT_LAYOUTS = {
  2: [[50, 92], [50, 4]],
  3: [[50, 92], [12, 25], [88, 25]],
  4: [[50, 92], [6, 50], [50, 4], [94, 50]],
  5: [[50, 92], [6, 55], [25, 4], [75, 4], [94, 55]],
  6: [[50, 92], [4, 55], [16, 6], [50, 2], [84, 6], [96, 55]],
  7: [[50, 93], [3, 62], [3, 22], [28, 2], [72, 2], [97, 22], [97, 62]],
  8: [[50, 93], [3, 65], [3, 28], [20, 2], [50, 0], [80, 2], [97, 28], [97, 65]],
  9: [[50, 93], [3, 68], [3, 32], [13, 5], [38, 0], [62, 0], [87, 5], [97, 32], [97, 68]],
  10: [[50, 93], [3, 68], [3, 35], [10, 8], [30, 0], [50, -2], [70, 0], [90, 8], [97, 35], [97, 68]]
};

function useIsMobile() {
  const [mobile, setMobile] = useState(false);
  useEffect(() => {
    const check = () => setMobile(window.innerHeight < 500 && window.innerWidth > window.innerHeight);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);
  return mobile;
}

export default function PokerTable({ gameState, playerId, lastAction, isTraining = false }) {
  if (!gameState) return null;
  const isMobile = useIsMobile();

  const players = gameState.players || [];
  const community = gameState.communityCards || [];
  const numPlayers = players.length;

  const heroIdx = players.findIndex(p => p.id === playerId);
  const reordered = [];
  if (heroIdx >= 0) {
    for (let i = 0; i < numPlayers; i++) {
      reordered.push(players[(heroIdx + i) % numPlayers]);
    }
  } else {
    reordered.push(...players);
  }

  const layout = SEAT_LAYOUTS[Math.min(numPlayers, 10)] || SEAT_LAYOUTS[10];
  const hero = players.find(p => p.id === playerId);
  const bb = gameState.config?.bigBlind || 2;
  const effectiveBB = hero ? Math.round((hero.stack + (hero.bet || 0)) / bb) : 100;
  const cardSize = isMobile ? 'lg' : 'md';

  return (
    <div className="w-full h-full relative overflow-hidden">

      {/* ============================================ */}
      {/* MOBILE: Full-screen felt, no table shape     */}
      {/* ============================================ */}
      {isMobile ? (
        <>
          {/* Full-screen felt background */}
          <div className="absolute inset-0" style={{
            background: `radial-gradient(ellipse 120% 100% at 50% 45%,
              var(--felt-light, #2a7a42) 0%, var(--felt, #1a5c2e) 35%, var(--felt-dark, #0f3d1e) 100%
            )`,
          }} />
          {/* Felt micro-texture */}
          <div className="absolute inset-0 opacity-[0.04]" style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='6' height='6' viewBox='0 0 6 6' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M1 5h1v1H1V5zm3-3h1v1H4V2zm-1 3h1v1H3V5zm2-3h1v1H5V2zM0 2h1v1H0V2zm2 0h1v1H2V2z' fill='%23fff'/%3E%3C/svg%3E")`,
          }} />
          {/* Subtle vignette */}
          <div className="absolute inset-0" style={{
            background: 'radial-gradient(ellipse 80% 70% at 50% 45%, transparent 50%, rgba(0,0,0,0.35) 100%)'
          }} />
          {/* Center light */}
          <div className="absolute left-1/2 top-[40%] -translate-x-1/2 -translate-y-1/2 w-[50%] h-[50%]"
            style={{ background: 'radial-gradient(ellipse, rgba(255,255,255,0.04) 0%, transparent 70%)' }} />
        </>
      ) : (
        /* ============================================ */
        /* DESKTOP: Premium table with rails            */
        /* ============================================ */
        <>
          {/* Room backdrop */}
          <div className="absolute inset-0" style={{
            background: 'radial-gradient(ellipse 130% 100% at 50% 55%, #1a1a2e 0%, #0a0a14 50%, #050508 100%)'
          }} />
          {/* Ambient glow */}
          <div className="absolute left-1/2 top-[45%] -translate-x-1/2 -translate-y-1/2 w-[90%] h-[85%] opacity-20"
            style={{ borderRadius: '50% / 42%', background: 'radial-gradient(ellipse, var(--felt, #1a5c2e) 0%, transparent 70%)' }} />
          {/* Shadow */}
          <div className="absolute left-[5%] right-[5%] top-[2%] bottom-[2%]"
            style={{ borderRadius: '50% / 42%', boxShadow: '0 10px 40px rgba(0,0,0,0.8), 0 0 60px rgba(0,0,0,0.4)' }} />
          {/* Wood rail */}
          <div className="absolute left-[5%] right-[5%] top-[2%] bottom-[2%]" style={{
            borderRadius: '50% / 42%',
            background: `linear-gradient(160deg, var(--rail-light, #a0792c) 0%, var(--rail, #6b4c1e) 25%, color-mix(in srgb, var(--rail, #6b4c1e) 60%, black) 50%, var(--rail, #6b4c1e) 75%, var(--rail-light, #a0792c) 100%)`,
            padding: '5px',
            boxShadow: 'inset 0 2px 4px rgba(255,255,255,0.12), inset 0 -2px 4px rgba(0,0,0,0.3)',
          }}>
            {/* Grain */}
            <div className="absolute inset-0 opacity-[0.06]" style={{
              borderRadius: '50% / 42%',
              backgroundImage: `repeating-linear-gradient(92deg, transparent, transparent 10px, rgba(0,0,0,0.25) 10px, rgba(0,0,0,0.25) 11px)`,
            }} />
            {/* Inner rail */}
            <div className="w-full h-full" style={{
              borderRadius: '50% / 42%',
              background: `linear-gradient(170deg, color-mix(in srgb, var(--rail, #6b4c1e) 75%, black), color-mix(in srgb, var(--rail, #6b4c1e) 45%, black))`,
              padding: '3px', boxShadow: 'inset 0 2px 8px rgba(0,0,0,0.5)',
            }}>
              {/* Bumper */}
              <div className="w-full h-full" style={{
                borderRadius: '50% / 42%',
                background: `linear-gradient(165deg, color-mix(in srgb, var(--rail, #6b4c1e) 30%, black), color-mix(in srgb, var(--rail, #6b4c1e) 15%, black))`,
                padding: '3px',
              }}>
                {/* Felt */}
                <div className="w-full h-full relative overflow-hidden" style={{
                  borderRadius: '50% / 42%',
                  background: `radial-gradient(ellipse 100% 90% at 50% 40%, var(--felt-light, #2a7a42) 0%, var(--felt, #1a5c2e) 40%, var(--felt-dark, #0f3d1e) 100%)`,
                  boxShadow: 'inset 0 4px 30px rgba(0,0,0,0.4), inset 0 -3px 20px rgba(0,0,0,0.25)',
                }}>
                  <div className="absolute inset-0 opacity-[0.03]" style={{
                    backgroundImage: `url("data:image/svg+xml,%3Csvg width='6' height='6' viewBox='0 0 6 6' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M1 5h1v1H1V5zm3-3h1v1H4V2zm-1 3h1v1H3V5zm2-3h1v1H5V2zM0 2h1v1H0V2zm2 0h1v1H2V2z' fill='%23fff'/%3E%3C/svg%3E")`,
                  }} />
                  <div className="absolute left-1/2 top-[38%] -translate-x-1/2 -translate-y-1/2 w-[50%] h-[50%]"
                    style={{ background: 'radial-gradient(ellipse, rgba(255,255,255,0.05) 0%, transparent 70%)' }} />
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {/* === POT (shared) === */}
      {gameState.pot > 0 && (
        <div className="absolute left-1/2 top-[33%] -translate-x-1/2 -translate-y-1/2 z-10">
          <div className="flex items-center gap-1.5 animate-chip-toss">
            <div className="relative w-4 h-4">
              <div className="absolute bottom-0 left-0 w-3.5 h-1 rounded-full" style={{
                background: 'linear-gradient(180deg, #dc2626, #991b1b)', border: '1px solid rgba(255,255,255,0.15)'
              }} />
              <div className="absolute bottom-0.5 left-0.5 w-3.5 h-1 rounded-full" style={{
                background: 'linear-gradient(180deg, #2563eb, #1e40af)', border: '1px solid rgba(255,255,255,0.1)'
              }} />
              <div className="absolute bottom-1.5 left-0 w-3.5 h-1 rounded-full" style={{
                background: 'linear-gradient(180deg, #d4af37, #b8960f)', border: '1px solid rgba(255,255,255,0.2)'
              }} />
            </div>
            <div className="bg-black/50 backdrop-blur rounded-full px-2.5 py-0.5 border border-white/10">
              <span className="text-gold font-black text-[11px]">{formatChips(gameState.pot)}</span>
            </div>
          </div>
        </div>
      )}

      {/* === COMMUNITY CARDS (shared) === */}
      <div className="absolute left-1/2 top-[47%] -translate-x-1/2 -translate-y-1/2 flex gap-1 z-10">
        {community.map((card, i) => (
          <div key={i} className="drop-shadow-lg">
            <Card card={card} size={cardSize} delay={i * 120} />
          </div>
        ))}
        {Array.from({ length: Math.max(0, 5 - community.length) }).map((_, i) => (
          <div key={`ph-${i}`}
            className={isMobile ? 'rounded' : 'rounded-lg'}
            style={isMobile ? { width: 60, height: 86 } : { width: 48, height: 68 }}
            style={{ border: '1px solid rgba(255,255,255,0.03)', background: 'rgba(0,0,0,0.08)' }} />
        ))}
      </div>

      {/* Hero bankroll — left of cards on mobile */}
      {isMobile && hero && (
        <div style={{
          position: 'absolute', left: '25%', bottom: '78%', zIndex: 30,
          background: 'rgba(0,0,0,0.7)', borderRadius: 8, padding: '3px 8px',
          border: '1px solid rgba(212,175,55,0.25)',
        }}>
          <div style={{ color: '#d4af37', fontSize: 10, fontWeight: 900 }}>{formatChips(hero.stack)}</div>
          <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: 7, fontWeight: 600, textAlign: 'center' }}>STACK</div>
        </div>
      )}

      {/* Preflop badge */}
      {isTraining && (() => {
        if (hero?.holeCards?.length === 2 && gameState.state !== 'waiting' && gameState.state !== 'hand_complete') {
          return <PreflopBadge cards={hero.holeCards} effectiveBB={effectiveBB} compact={isMobile} />;
        }
        return null;
      })()}

      {/* === PLAYER SEATS (shared) === */}
      {reordered.map((player, i) => {
        const pos = layout[i] || layout[0];
        const isHero = player.id === playerId;
        const isActive = player.id === gameState.currentPlayerId;
        const acted = lastAction?.playerId === player.id;

        return (
          <PlayerSeat
            key={player.id}
            player={player}
            position={pos}
            isHero={isHero}
            isActive={isActive}
            lastAction={acted ? lastAction : null}
            showCards={isHero || gameState.state === 'hand_complete'}
            compact={isMobile}
          />
        );
      })}
    </div>
  );
}
