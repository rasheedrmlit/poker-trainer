import Card from './Card';
import { formatChips } from '../utils/cards';
import BankrollGraph from './BankrollGraph';
import { ACHIEVEMENT_DEFS, getAchievements, getUnlockedCount } from '../utils/achievements';
import { isMuted, toggleMute, getSfxVolume, setSfxVolume, getMusicVolume, setMusicVolume, isMusicPlaying, toggleMusic, loadCustomMusic, isCustomMusicLoaded, getCustomTrackName, clearCustomMusic, playCustomMusic } from '../utils/sounds';
import { isVibrationEnabled, toggleVibration } from '../utils/vibration';
import { getStoredTheme, toggleTheme } from '../utils/theme';
import { useState, useRef } from 'react';

const TABS = [
  { key: 'stats', label: 'Stats' },
  { key: 'leaks', label: 'Leaks' },
  { key: 'history', label: 'History' },
  { key: 'achievements', label: 'Awards' },
  { key: 'settings', label: 'Settings' },
];

export default function Sidebar({
  tab, onClose, onChangeTab,
  sessionSummary, leakReport, handHistory,
  playerId, onGetAnalysis, handAnalysis,
  onRefreshStats, onRefreshLeaks, onRefreshHistory,
  bankrollHistory,
}) {
  return (
    <div className="fixed inset-0 z-50 flex">
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />
      <div className="relative ml-auto w-full max-w-sm bg-gray-900 h-full overflow-y-auto animate-slide-up">
        <div className="sticky top-0 bg-gray-900 z-10 border-b border-gray-800">
          <div className="flex items-center justify-between px-4 py-3">
            <h2 className="text-lg font-bold text-white">Dashboard</h2>
            <button onClick={onClose} className="text-gray-400 active:text-white p-1">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          <div className="flex border-b border-gray-800 overflow-x-auto">
            {TABS.map(t => (
              <button
                key={t.key}
                onClick={() => {
                  onChangeTab(t.key);
                  if (t.key === 'stats') onRefreshStats();
                  if (t.key === 'leaks') onRefreshLeaks();
                  if (t.key === 'history') onRefreshHistory();
                }}
                className={`flex-1 py-2.5 text-xs font-semibold whitespace-nowrap px-2 transition-colors ${
                  tab === t.key ? 'text-gold border-b-2 border-gold' : 'text-gray-500'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>

        <div className="p-4">
          {tab === 'stats' && <StatsTab data={sessionSummary} bankrollHistory={bankrollHistory} />}
          {tab === 'leaks' && <LeaksTab data={leakReport} />}
          {tab === 'history' && <HistoryTab data={handHistory} playerId={playerId} onAnalyze={onGetAnalysis} analysis={handAnalysis} />}
          {tab === 'achievements' && <AchievementsTab />}
          {tab === 'settings' && <SettingsTab />}
        </div>
      </div>
    </div>
  );
}

function StatsTab({ data, bankrollHistory }) {
  if (!data || !data.hasData) {
    return <div className="text-gray-500 text-center py-8">Play some hands to see your stats!</div>;
  }

  return (
    <div className="space-y-4">
      {/* Bankroll Graph */}
      <BankrollGraph history={bankrollHistory} />

      <div className="grid grid-cols-2 gap-3">
        <StatCard label="Hands Played" value={data.handsPlayed} />
        <StatCard label="Hands Won" value={data.handsWon} />
        <StatCard label="Win Rate" value={`${data.winPct || 0}%`} />
        <StatCard label="Avg Grade" value={data.avgGrade} highlight />
      </div>

      {data.encouragement && (
        <div className="bg-gold/10 border border-gold/20 rounded-xl p-4">
          <p className="text-sm text-gray-300">{data.encouragement}</p>
        </div>
      )}

      <div className="bg-gray-800 rounded-xl p-4">
        <h3 className="text-sm font-semibold text-gray-300 mb-3">Session Summary</h3>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-500">Total Won</span>
            <span className="text-green-400 font-mono">{formatChips(data.totalWon)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">Hands Lost</span>
            <span className="text-red-400 font-mono">{data.handsLost}</span>
          </div>
        </div>
      </div>

      {data.topTip && (
        <div className="bg-gold/10 border border-gold/20 rounded-xl p-4">
          <div className="text-xs text-gold font-semibold mb-1">Top Tip</div>
          <p className="text-sm text-gray-300">{data.topTip}</p>
        </div>
      )}
    </div>
  );
}

function StatCard({ label, value, highlight }) {
  return (
    <div className="bg-gray-800 rounded-xl p-3 text-center">
      <div className={`text-xl font-bold ${highlight ? 'text-gold' : 'text-white'}`}>{value}</div>
      <div className="text-[10px] text-gray-500 uppercase tracking-wide mt-0.5">{label}</div>
    </div>
  );
}

function LeaksTab({ data }) {
  if (!data || !data.hasEnoughData) {
    return (
      <div className="text-center py-8">
        <div className="text-gray-500 mb-2">Not enough data yet</div>
        <p className="text-gray-600 text-sm">{data?.message || 'Play at least 5 hands to generate a leak report.'}</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {data.summary && (
        <div className="bg-orange-950/30 border border-orange-500/30 rounded-xl p-4">
          <p className="text-sm text-gray-300 leading-relaxed">{data.summary}</p>
        </div>
      )}
      <div className="bg-gray-800 rounded-xl p-4">
        <div className="text-sm text-gray-400 mb-1">Total Mistakes Tracked</div>
        <div className="text-2xl font-bold text-white">{data.totalMistakes}</div>
        <div className="text-xs text-gray-500 mt-1">
          Most mistakes happen: <span className="text-orange-400">{data.worstStreetName || data.worstStreet}</span>
        </div>
      </div>
      {data.leaks?.map((leak, i) => (
        <div key={i} className="bg-gray-800 rounded-xl p-4 border-l-4 border-orange-500">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-semibold text-orange-400">Leak #{i + 1}</span>
            <span className="text-xs text-gray-500">{leak.frequency}% of mistakes</span>
          </div>
          <p className="text-sm text-gray-200 mb-2 font-medium">{leak.description}</p>
          <p className="text-xs text-gray-400 leading-relaxed mb-2">{leak.fix}</p>
          {leak.examples && (
            <div className="bg-gray-900/50 rounded-lg p-3 mt-2">
              <div className="text-[10px] text-gray-500 uppercase tracking-wide mb-1">Example</div>
              <p className="text-xs text-gray-400">{leak.examples}</p>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

function HistoryTab({ data, playerId, onAnalyze, analysis }) {
  if (!data || data.length === 0) {
    return <div className="text-gray-500 text-center py-8">No hand history yet.</div>;
  }

  return (
    <div className="space-y-3">
      {[...data].reverse().slice(0, 20).map((hand, i) => {
        const playerData = hand.players.find(p => p.id === playerId);
        const winner = hand.winners.find(w => w.playerId === playerId);
        const isWinner = !!winner;

        return (
          <div
            key={hand.handNumber}
            className="bg-gray-800 rounded-xl p-3 active:bg-gray-700 transition-colors"
            onClick={() => onAnalyze(data.length - 1 - i)}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-gray-500">Hand #{hand.handNumber}</span>
              <span className={`text-xs font-bold ${isWinner ? 'text-green-400' : 'text-red-400'}`}>
                {isWinner ? `+${formatChips(winner.amount)}` : 'Lost'}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex gap-0.5">
                {playerData?.holeCards?.map((c, j) => (
                  <Card key={j} card={c} size="sm" />
                ))}
              </div>
              <div className="flex gap-0.5 ml-2">
                {hand.communityCards?.map((c, j) => (
                  <Card key={j} card={c} size="sm" />
                ))}
              </div>
              <span className="ml-auto text-[10px] text-gray-500 bg-gray-700 px-1.5 py-0.5 rounded">
                {playerData?.position}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function AchievementsTab() {
  const unlocked = getAchievements();
  const count = getUnlockedCount();

  return (
    <div className="space-y-3">
      <div className="text-center mb-4">
        <div className="text-2xl font-black text-gold">{count}</div>
        <div className="text-xs text-gray-500">of {ACHIEVEMENT_DEFS.length} unlocked</div>
        {/* Progress bar */}
        <div className="w-full bg-gray-800 rounded-full h-2 mt-2">
          <div className="bg-gold rounded-full h-2 transition-all" style={{ width: `${(count / ACHIEVEMENT_DEFS.length) * 100}%` }} />
        </div>
      </div>

      {ACHIEVEMENT_DEFS.map(a => {
        const isUnlocked = !!unlocked[a.id];
        return (
          <div key={a.id} className={`flex items-center gap-3 p-3 rounded-xl ${isUnlocked ? 'bg-gray-800' : 'bg-gray-800/40 opacity-50'}`}>
            <div className="text-2xl">{isUnlocked ? a.icon : '🔒'}</div>
            <div className="flex-1">
              <div className={`text-sm font-bold ${isUnlocked ? 'text-white' : 'text-gray-500'}`}>{a.name}</div>
              <div className="text-xs text-gray-400">{a.desc}</div>
            </div>
            {isUnlocked && (
              <div className="text-[10px] text-green-400 font-bold">DONE</div>
            )}
          </div>
        );
      })}
    </div>
  );
}

function SettingsTab() {
  const [muted, setMuted] = useState(isMuted());
  const [vibOn, setVibOn] = useState(isVibrationEnabled());
  const [theme, setThemeState] = useState(getStoredTheme());
  const [sfxVol, setSfxVol] = useState(getSfxVolume());
  const [musVol, setMusVol] = useState(getMusicVolume());
  const [musicOn, setMusicOn] = useState(isMusicPlaying());
  const [customTrack, setCustomTrack] = useState(getCustomTrackName());
  const [loadingTrack, setLoadingTrack] = useState(false);
  const fileInputRef = useRef(null);

  const handleFileSelect = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setLoadingTrack(true);
    try {
      const name = await loadCustomMusic(file);
      setCustomTrack(name);
      playCustomMusic();
      setMusicOn(true);
    } catch (err) {
      console.error('Failed to load music:', err);
    }
    setLoadingTrack(false);
    // Reset input so same file can be re-selected
    e.target.value = '';
  };

  return (
    <div className="space-y-3">
      <SettingToggle
        label="Sound Effects"
        desc="Card deals, chip clicks, win/lose sounds"
        value={!muted}
        onChange={() => { toggleMute(); setMuted(isMuted()); }}
      />

      {/* SFX Volume */}
      {!muted && (
        <div className="bg-gray-800 rounded-xl p-4">
          <div className="flex items-center justify-between mb-2">
            <div className="text-sm font-bold text-white">SFX Volume</div>
            <span className="text-xs text-gray-400">{Math.round(sfxVol * 100)}%</span>
          </div>
          <input type="range" min="0" max="1" step="0.05" value={sfxVol}
            onChange={e => { const v = parseFloat(e.target.value); setSfxVol(v); setSfxVolume(v); }}
            className="w-full h-2 appearance-none rounded-full bg-gray-700 outline-none"
            style={{ background: `linear-gradient(90deg, #d4af37 0%, #d4af37 ${sfxVol * 100}%, #374151 ${sfxVol * 100}%, #374151 100%)` }}
          />
        </div>
      )}

      {/* Background Music */}
      <SettingToggle
        label="Background Music"
        desc={customTrack ? `Playing: ${customTrack}` : 'Lofi jazz ambience while you play'}
        value={musicOn}
        onChange={() => { toggleMusic(); setMusicOn(isMusicPlaying()); }}
      />

      {/* Music Volume */}
      {musicOn && (
        <div className="bg-gray-800 rounded-xl p-4">
          <div className="flex items-center justify-between mb-2">
            <div className="text-sm font-bold text-white">Music Volume</div>
            <span className="text-xs text-gray-400">{Math.round(musVol * 100)}%</span>
          </div>
          <input type="range" min="0" max="1" step="0.05" value={musVol}
            onChange={e => { const v = parseFloat(e.target.value); setMusVol(v); setMusicVolume(v); }}
            className="w-full h-2 appearance-none rounded-full bg-gray-700 outline-none"
            style={{ background: `linear-gradient(90deg, #d4af37 0%, #d4af37 ${musVol * 100}%, #374151 ${musVol * 100}%, #374151 100%)` }}
          />
        </div>
      )}

      {/* Load Your Own Music */}
      <div className="bg-gray-800 rounded-xl p-4">
        <div className="text-sm font-bold text-white mb-1">Load Your Own Music</div>
        <div className="text-xs text-gray-500 mb-3">Pick an MP3, M4A, or OGG file from your device</div>

        <input
          ref={fileInputRef}
          type="file"
          accept="audio/mpeg,audio/mp4,audio/ogg,audio/wav,.mp3,.m4a,.ogg,.wav"
          onChange={handleFileSelect}
          className="hidden"
        />

        <div className="flex gap-2">
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={loadingTrack}
            className="flex-1 bg-gold text-black font-bold py-2.5 rounded-xl text-sm active:scale-[0.97] transition-transform disabled:opacity-50"
          >
            {loadingTrack ? 'Loading...' : 'Choose File'}
          </button>
          {customTrack && (
            <button
              onClick={() => { clearCustomMusic(); setCustomTrack(''); setMusicOn(false); }}
              className="bg-gray-700 text-gray-300 font-bold py-2.5 px-4 rounded-xl text-sm active:scale-[0.97] transition-transform"
            >
              Clear
            </button>
          )}
        </div>

        {customTrack && (
          <div className="mt-2 flex items-center gap-2 bg-gray-900/50 rounded-lg p-2">
            <span className="text-lg">🎵</span>
            <span className="text-xs text-gray-300 truncate flex-1">{customTrack}</span>
          </div>
        )}

        <div className="mt-3 text-[10px] text-gray-600 leading-relaxed">
          Free tracks: <a href="https://pixabay.com/music/search/lofi%20jazz/" target="_blank" rel="noopener" className="text-gold/60 underline">Pixabay</a> &bull; <a href="https://freemusicarchive.org/music/holiznacc0/lo-fi-and-chill" target="_blank" rel="noopener" className="text-gold/60 underline">Free Music Archive</a> &bull; <a href="https://www.chosic.com/free-music/lofi/" target="_blank" rel="noopener" className="text-gold/60 underline">Chosic</a>
        </div>
      </div>

      <SettingToggle
        label="Vibration"
        desc="Haptic feedback on your turn and wins"
        value={vibOn}
        onChange={() => { toggleVibration(); setVibOn(isVibrationEnabled()); }}
      />
      <SettingToggle
        label="Dark Mode"
        desc="Toggle between dark and light theme"
        value={theme === 'dark'}
        onChange={() => { const t = toggleTheme(); setThemeState(t); }}
      />
    </div>
  );
}

function SettingToggle({ label, desc, value, onChange }) {
  return (
    <div className="flex items-center justify-between bg-gray-800 rounded-xl p-4">
      <div>
        <div className="text-sm font-bold text-white">{label}</div>
        <div className="text-xs text-gray-500">{desc}</div>
      </div>
      <button
        onClick={onChange}
        className={`w-12 h-6 rounded-full transition-colors relative ${value ? 'bg-gold' : 'bg-gray-600'}`}
      >
        <div className={`w-5 h-5 rounded-full bg-white shadow absolute top-0.5 transition-transform ${value ? 'translate-x-6' : 'translate-x-0.5'}`} />
      </button>
    </div>
  );
}
