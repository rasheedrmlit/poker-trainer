import { useEffect, useRef, useState, useCallback } from 'react';
import { io } from 'socket.io-client';

const SERVER_URL = import.meta.env.PROD ? '' : 'http://localhost:3000';

export function useSocket() {
  const socketRef = useRef(null);
  const [connected, setConnected] = useState(false);
  const [gameState, setGameState] = useState(null);
  const [playerId, setPlayerId] = useState(null);
  const [tableId, setTableId] = useState(null);
  const [coaching, setCoaching] = useState(null);
  const [handAnalysis, setHandAnalysis] = useState(null);
  const [sessionSummary, setSessionSummary] = useState(null);
  const [leakReport, setLeakReport] = useState(null);
  const [handHistory, setHandHistory] = useState([]);
  const [lastAction, setLastAction] = useState(null);
  const [handComplete, setHandComplete] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    const socket = io(SERVER_URL, {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1000
    });

    socketRef.current = socket;

    socket.on('connect', () => setConnected(true));
    socket.on('disconnect', () => setConnected(false));

    socket.on('joined', (data) => {
      setPlayerId(data.playerId);
      setTableId(data.tableId);
      setGameState(data.gameState);
      // Save for reconnect
      localStorage.setItem('poker_playerId', data.playerId);
      localStorage.setItem('poker_tableId', data.tableId);
    });

    socket.on('game-state', (state) => {
      setGameState(state);
      setError(null);
    });

    socket.on('player-acted', (action) => {
      setLastAction(action);
      setTimeout(() => setLastAction(null), 2000);
    });

    socket.on('hand-started', () => {
      setHandComplete(null);
      setCoaching(null);
      setHandAnalysis(null);
    });

    socket.on('hand-complete', (data) => {
      setHandComplete(data);
    });

    socket.on('coaching-feedback', (data) => {
      setCoaching(data);
    });

    socket.on('suggestion', (data) => {
      setCoaching(prev => ({ ...prev, suggestion: data }));
    });

    socket.on('hand-analysis', (data) => {
      setHandAnalysis(data);
    });

    socket.on('session-summary', (data) => {
      setSessionSummary(data);
    });

    socket.on('leak-report', (data) => {
      setLeakReport(data);
    });

    socket.on('hand-history', (data) => {
      setHandHistory(data);
    });

    socket.on('error', (data) => {
      setError(data.message);
      setTimeout(() => setError(null), 3000);
    });

    // Try reconnect
    const savedPlayerId = localStorage.getItem('poker_playerId');
    const savedTableId = localStorage.getItem('poker_tableId');
    if (savedPlayerId && savedTableId) {
      socket.emit('reconnect-player', { tableId: savedTableId, playerId: savedPlayerId });
    }

    return () => {
      socket.disconnect();
    };
  }, []);

  const joinTable = useCallback((tid, playerName) => {
    if (socketRef.current) {
      socketRef.current.emit('join-table', { tableId: tid, playerName });
    }
  }, []);

  const sendAction = useCallback((action) => {
    if (socketRef.current) {
      socketRef.current.emit('player-action', { action });
    }
  }, []);

  const getSuggestion = useCallback(() => {
    if (socketRef.current) {
      socketRef.current.emit('get-suggestion');
    }
  }, []);

  const getHandAnalysis = useCallback((handIndex) => {
    if (socketRef.current) {
      socketRef.current.emit('get-hand-analysis', { handIndex });
    }
  }, []);

  const getSessionSummary = useCallback(() => {
    if (socketRef.current) {
      socketRef.current.emit('get-session-summary');
    }
  }, []);

  const getLeakReport = useCallback(() => {
    if (socketRef.current) {
      socketRef.current.emit('get-leak-report');
    }
  }, []);

  const getHandHistory = useCallback(() => {
    if (socketRef.current) {
      socketRef.current.emit('get-hand-history');
    }
  }, []);

  const startNextHand = useCallback(() => {
    if (socketRef.current) {
      socketRef.current.emit('start-next-hand');
    }
  }, []);

  const addAI = useCallback((aiType) => {
    if (socketRef.current) {
      socketRef.current.emit('add-ai', { aiType });
    }
  }, []);

  return {
    connected, gameState, playerId, tableId,
    coaching, handAnalysis, sessionSummary, leakReport, handHistory,
    lastAction, handComplete, error,
    joinTable, sendAction, getSuggestion, getHandAnalysis,
    getSessionSummary, getLeakReport, getHandHistory, startNextHand, addAI
  };
}
