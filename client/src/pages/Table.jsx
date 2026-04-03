import { useEffect, useState, useCallback, useRef } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import PokerTable from '../components/PokerTable';
import ActionBar from '../components/ActionBar';
import CoachingPanel from '../components/CoachingPanel';
import HandComplete from '../components/HandComplete';
import Sidebar from '../components/Sidebar';
import TopBar from '../components/TopBar';
import TableChat from '../components/TableChat';
import AchievementToast from '../components/AchievementToast';
import StreakBadge from '../components/StreakBadge';
import { playDeal, playWin, playLose, playTurn, playSoundForAction } from '../utils/sounds';
import { checkAchievements } from '../utils/achievements';
import { vibrateTurn, vibrateWin } from '../utils/vibration';

export default function Table({ socket, playerName }) {
  const { tableId } = useParams();
  const [searchParams] = useSearchParams();
  const isTraining = searchParams.get('training') === '1';
  const [showCoaching, setShowCoaching] = useState(true);
  const [showSidebar, setShowSidebar] = useState(false);
  const [sidebarTab, setSidebarTab] = useState('stats');
  const [showTopBar, setShowTopBar] = useState(false);

  // Streaks
  const [winStreak, setWinStreak] = useState(0);
  const [loseStreak, setLoseStreak] = useState(0);
  const [handsPlayed, setHandsPlayed] = useState(0);
  const [handsWon, setHandsWon] = useState(0);
  const [bankrollHistory, setBankrollHistory] = useState([]);
  const startingStackRef = useRef(null);

  // Achievements
  const [achievementQueue, setAchievementQueue] = useState([]);
  const [currentAchievement, setCurrentAchievement] = useState(null);

  const {
    connected, gameState, playerId, coaching, handAnalysis,
    sessionSummary, leakReport, handHistory, lastAction, handComplete, error,
    joinTable, sendAction, getSuggestion, getHandAnalysis,
    getSessionSummary, getLeakReport, getHandHistory, startNextHand, addAI
  } = socket;

  useEffect(() => {
    if (connected && tableId) {
      joinTable(tableId, playerName || localStorage.getItem('poker_name') || 'Player');
    }
  }, [connected, tableId, joinTable, playerName]);

  const isMyTurn = gameState?.currentPlayerId === playerId;
  const myPlayer = gameState?.players?.find(p => p.id === playerId);

  // Record starting stack
  useEffect(() => {
    if (myPlayer && startingStackRef.current === null) {
      startingStackRef.current = myPlayer.stack;
      setBankrollHistory([myPlayer.stack]);
    }
  }, [myPlayer]);

  // Sound + vibrate on my turn
  useEffect(() => {
    if (isMyTurn) {
      playTurn();
      vibrateTurn();
    }
  }, [isMyTurn]);

  // Sound on actions
  useEffect(() => {
    if (lastAction) {
      playSoundForAction(lastAction.type);
    }
  }, [lastAction]);

  // Sound on hand start
  useEffect(() => {
    if (gameState?.state === 'preflop' && gameState?.handNumber) {
      playDeal();
    }
  }, [gameState?.handNumber]);

  // Track wins/losses, bankroll, achievements on hand complete
  useEffect(() => {
    if (!handComplete || !playerId) return;

    setHandsPlayed(p => p + 1);
    const isWinner = handComplete.winners?.some(w => w.playerId === playerId);
    const myWinAmount = handComplete.winners?.find(w => w.playerId === playerId)?.amount || 0;
    const bb = gameState?.config?.bigBlind || 2;

    if (isWinner) {
      playWin();
      vibrateWin();
      setWinStreak(s => s + 1);
      setLoseStreak(0);
      setHandsWon(w => w + 1);
    } else {
      playLose();
      setLoseStreak(s => s + 1);
      setWinStreak(0);
    }

    // Update bankroll history
    if (myPlayer) {
      setBankrollHistory(prev => [...prev.slice(-100), myPlayer.stack]);
    }

    // Check achievements
    const wasUncontested = !handComplete.showdown && isWinner;
    const wasAllIn = handComplete.players?.find(p => p.id === playerId)?.allIn;
    const newWinStreak = isWinner ? winStreak + 1 : 0;
    const wasDown50 = startingStackRef.current && myPlayer?.stack >= startingStackRef.current &&
      bankrollHistory.some(v => v < startingStackRef.current * 0.5);

    const newAch = checkAchievements({
      handsPlayed: handsPlayed + 1,
      handsWon: handsWon + (isWinner ? 1 : 0),
      winStreak: newWinStreak,
      bigBlind: bb,
      potWon: isWinner ? myWinAmount : 0,
      wasAllIn: wasAllIn && isWinner,
      gradeAPlus: false, // checked after analysis
      stackNow: myPlayer?.stack || 0,
      startingStack: startingStackRef.current,
      wasUncontested,
      wasDown50,
    });

    if (newAch.length > 0) {
      setAchievementQueue(q => [...q, ...newAch]);
    }
  }, [handComplete]);

  // Check A+ grade achievement
  useEffect(() => {
    if (handAnalysis?.overallGrade === 'A+') {
      const newAch = checkAchievements({ gradeAPlus: true, handsPlayed, handsWon, winStreak, bigBlind: gameState?.config?.bigBlind });
      if (newAch.length > 0) setAchievementQueue(q => [...q, ...newAch]);
    }
  }, [handAnalysis]);

  // Process achievement queue
  useEffect(() => {
    if (!currentAchievement && achievementQueue.length > 0) {
      setCurrentAchievement(achievementQueue[0]);
      setAchievementQueue(q => q.slice(1));
    }
  }, [currentAchievement, achievementQueue]);

  const handleAction = useCallback((action) => {
    sendAction(action);
  }, [sendAction]);

  const openSidebar = (tab) => {
    setSidebarTab(tab);
    setShowSidebar(true);
    if (tab === 'history') getHandHistory();
    if (tab === 'stats') getSessionSummary();
    if (tab === 'leaks') getLeakReport();
  };

  if (!connected) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-gray-950">
        <div className="text-center">
          <div className="text-2xl text-gold animate-pulse-soft mb-2">Connecting...</div>
          <div className="text-gray-500 text-sm">Establishing connection to server</div>
        </div>
      </div>
    );
  }

  if (!gameState) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-gray-950">
        <div className="text-xl text-gray-400 animate-pulse-soft">Loading table...</div>
      </div>
    );
  }

  return (
    <div className="w-full h-full flex flex-col bg-gray-950 relative overflow-hidden">
      {/* Collapsed top bar */}
      {!showTopBar && (
        <div
          className="absolute top-0 left-0 right-0 z-40 flex items-center justify-between px-3 py-1"
          style={{ background: 'linear-gradient(180deg, rgba(0,0,0,0.6) 0%, transparent 100%)' }}
        >
          <button onClick={() => window.history.back()} className="text-gray-400 active:text-white p-1">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>

          <div className="flex items-center gap-2">
            <StreakBadge winStreak={winStreak} loseStreak={loseStreak} />
            <button
              onClick={() => setShowTopBar(true)}
              className="text-gray-500 text-[10px] font-medium px-2 py-0.5 rounded bg-black/30 active:bg-black/60"
            >
              Hand #{gameState?.handNumber || 0}
            </button>
          </div>

          <button onClick={() => setShowTopBar(true)} className="text-gray-400 active:text-white p-1">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
        </div>
      )}

      {/* Full top bar (expandable) */}
      {showTopBar && (
        <>
          <div className="fixed inset-0 z-30" onClick={() => setShowTopBar(false)} />
          <div className="relative z-40">
            <TopBar
              gameState={gameState}
              tableId={tableId}
              isTraining={isTraining}
              onOpenSidebar={(tab) => { openSidebar(tab); setShowTopBar(false); }}
              onAddAI={(type) => { addAI(type); setShowTopBar(false); }}
              bankrollHistory={bankrollHistory}
            />
          </div>
        </>
      )}

      {/* Achievement Toast */}
      <AchievementToast
        achievement={currentAchievement}
        onDone={() => setCurrentAchievement(null)}
      />

      {/* Error Toast */}
      {error && (
        <div className="absolute top-8 left-4 right-4 bg-red-900/90 text-red-200 px-4 py-2 rounded-lg text-center text-sm z-50 animate-slide-up">
          {error}
        </div>
      )}

      {/* Poker Table */}
      <div className="flex-1 relative min-h-0">
        <PokerTable
          gameState={gameState}
          playerId={playerId}
          lastAction={lastAction}
          isTraining={isTraining}
        />
      </div>

      {/* Table Chat */}
      <TableChat lastAction={lastAction} handComplete={handComplete} playerId={playerId} />

      {/* Hand Complete Overlay */}
      {handComplete && (
        <HandComplete
          data={handComplete}
          playerId={playerId}
          onGetAnalysis={() => getHandAnalysis()}
          analysis={handAnalysis}
          isTraining={isTraining}
          onNextHand={() => startNextHand()}
        />
      )}

      {/* Coaching Panel */}
      {showCoaching && coaching && isMyTurn && (
        <CoachingPanel coaching={coaching} onDismiss={() => setCoaching(null)} />
      )}

      {/* Action Bar */}
      <ActionBar
        gameState={gameState}
        playerId={playerId}
        isMyTurn={isMyTurn}
        myPlayer={myPlayer}
        onAction={handleAction}
        onGetSuggestion={getSuggestion}
        showCoaching={showCoaching}
        onToggleCoaching={() => setShowCoaching(!showCoaching)}
      />

      {/* Sidebar */}
      {showSidebar && (
        <Sidebar
          tab={sidebarTab}
          onClose={() => setShowSidebar(false)}
          onChangeTab={setSidebarTab}
          sessionSummary={sessionSummary}
          leakReport={leakReport}
          handHistory={handHistory}
          playerId={playerId}
          onGetAnalysis={getHandAnalysis}
          handAnalysis={handAnalysis}
          onRefreshStats={getSessionSummary}
          onRefreshLeaks={getLeakReport}
          onRefreshHistory={getHandHistory}
          bankrollHistory={bankrollHistory}
        />
      )}
    </div>
  );
}
