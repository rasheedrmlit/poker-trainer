import { useEffect, useState, useCallback } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import PokerTable from '../components/PokerTable';
import ActionBar from '../components/ActionBar';
import CoachingPanel from '../components/CoachingPanel';
import HandComplete from '../components/HandComplete';
import Sidebar from '../components/Sidebar';
import TopBar from '../components/TopBar';

export default function Table({ socket, playerName }) {
  const { tableId } = useParams();
  const [searchParams] = useSearchParams();
  const isTraining = searchParams.get('training') === '1';
  const [showCoaching, setShowCoaching] = useState(true);
  const [showSidebar, setShowSidebar] = useState(false);
  const [sidebarTab, setSidebarTab] = useState('stats');

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
      {/* Top Bar */}
      <TopBar
        gameState={gameState}
        tableId={tableId}
        isTraining={isTraining}
        onOpenSidebar={openSidebar}
        onAddAI={addAI}
      />

      {/* Error Toast */}
      {error && (
        <div className="absolute top-16 left-4 right-4 bg-red-900/90 text-red-200 px-4 py-2 rounded-lg text-center text-sm z-50 animate-slide-up">
          {error}
        </div>
      )}

      {/* Poker Table */}
      <div className="flex-1 relative">
        <PokerTable
          gameState={gameState}
          playerId={playerId}
          lastAction={lastAction}
          isTraining={isTraining}
        />
      </div>

      {/* Hand Complete Overlay */}
      {handComplete && (
        <HandComplete
          data={handComplete}
          playerId={playerId}
          onGetAnalysis={() => getHandAnalysis()}
          analysis={handAnalysis}
          isTraining={isTraining}
          onNextHand={() => {
            startNextHand();
          }}
        />
      )}

      {/* Coaching Panel */}
      {showCoaching && coaching && isMyTurn && (
        <CoachingPanel
          coaching={coaching}
          onDismiss={() => setCoaching(null)}
        />
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
        />
      )}
    </div>
  );
}
