const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const path = require('path');
const { nanoid } = require('nanoid');

const GameEngine = require('./game/GameEngine');
const { AIEngine, AI_PROFILES } = require('./ai/AIEngine');
const GTOEngine = require('./gto/GTOEngine');
const CoachingEngine = require('./coaching/CoachingEngine');
const { GAME_STATES, ACTIONS } = require('../shared/constants');

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: process.env.NODE_ENV === 'production'
      ? process.env.CLIENT_URL || '*'
      : ['http://localhost:5173', 'http://localhost:3000', 'http://localhost:4173'],
    methods: ['GET', 'POST']
  }
});

app.use(cors());
app.use(express.json());

// Serve static files in production
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '..', 'client', 'dist')));
}

// Game tables
const tables = new Map();
const playerSockets = new Map();
const coaching = new CoachingEngine();
const gtoEngine = new GTOEngine();

// REST API
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', tables: tables.size });
});

app.get('/api/tables', (req, res) => {
  const tableList = [];
  for (const [id, table] of tables) {
    tableList.push({
      id,
      players: table.engine.getSeatedPlayers().length,
      maxPlayers: table.engine.config.maxPlayers,
      state: table.engine.state,
      blinds: `${table.engine.config.smallBlind}/${table.engine.config.bigBlind}`
    });
  }
  res.json(tableList);
});

app.post('/api/tables', (req, res) => {
  const { config } = req.body || {};
  const tableId = nanoid(8);
  const engine = new GameEngine(tableId, config);
  tables.set(tableId, { engine, aiEngines: new Map(), autoPlay: null });
  res.json({ tableId, url: `/table/${tableId}` });
});

app.get('/api/ai-profiles', (req, res) => {
  res.json(AIEngine.getProfiles());
});

// Create a quick play table with AI opponents
app.post('/api/quick-play', (req, res) => {
  const { playerName, aiCount = 9, aiTypes, config } = req.body || {};
  const tableId = nanoid(8);
  const engine = new GameEngine(tableId, { maxPlayers: 10, ...config });
  const table = { engine, aiEngines: new Map(), autoPlay: null };
  tables.set(tableId, table);

  // Add AI players — full ring (9 AI + 1 human = 10 players)
  const allTypes = ['gto_bot', 'aggro_pro', 'loose_rec', 'nit_reg', 'elite_hybrid', 'maniac', 'rock', 'trappy', 'calling_station', 'lag_shark'];
  // Shuffle to randomize table composition
  for (let i = allTypes.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [allTypes[i], allTypes[j]] = [allTypes[j], allTypes[i]];
  }
  // Use all available types up to aiCount, cycling if needed
  const types = aiTypes || allTypes.slice(0, Math.min(aiCount, allTypes.length));

  for (let i = 0; i < Math.min(types.length, 5); i++) {
    const aiType = types[i];
    const profile = AI_PROFILES[aiType];
    const aiId = `ai_${aiType}_${nanoid(4)}`;
    engine.addPlayer(aiId, profile?.name || aiType, true, aiType);
    table.aiEngines.set(aiId, new AIEngine(aiType));
  }

  res.json({ tableId, url: `/table/${tableId}` });
});

// Training mode - specific scenarios
app.post('/api/training', (req, res) => {
  const { scenario = 'random', playerName, config } = req.body || {};
  const tableId = `train_${nanoid(8)}`;
  const engine = new GameEngine(tableId, { maxPlayers: 10, ...config });
  const table = { engine, aiEngines: new Map(), autoPlay: null, isTraining: true, scenario };
  tables.set(tableId, table);

  // Add 9 AI opponents for training — full ring with varied personalities
  const allTrainTypes = ['gto_bot', 'aggro_pro', 'nit_reg', 'loose_rec', 'elite_hybrid', 'maniac', 'rock', 'trappy', 'calling_station', 'lag_shark'];
  // Shuffle to randomize
  for (let i = allTrainTypes.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [allTrainTypes[i], allTrainTypes[j]] = [allTrainTypes[j], allTrainTypes[i]];
  }
  const types = allTrainTypes.slice(0, 9);
  for (const aiType of types) {
    const profile = AI_PROFILES[aiType];
    const aiId = `ai_${aiType}_${nanoid(4)}`;
    engine.addPlayer(aiId, profile.name, true, aiType);
    table.aiEngines.set(aiId, new AIEngine(aiType));
  }

  res.json({ tableId, url: `/table/${tableId}` });
});

// Socket.IO connection handling
io.on('connection', (socket) => {
  let currentTableId = null;
  let currentPlayerId = null;

  socket.on('join-table', ({ tableId, playerName, playerId }) => {
    let table = tables.get(tableId);
    if (!table) {
      // Auto-create table
      const engine = new GameEngine(tableId);
      table = { engine, aiEngines: new Map(), autoPlay: null };
      tables.set(tableId, table);
    }

    currentTableId = tableId;
    currentPlayerId = playerId || `player_${nanoid(6)}`;

    const seat = table.engine.addPlayer(currentPlayerId, playerName || 'You');
    if (seat === -1) {
      socket.emit('error', { message: 'Table is full' });
      return;
    }

    playerSockets.set(currentPlayerId, socket);
    socket.join(tableId);

    socket.emit('joined', {
      playerId: currentPlayerId,
      seatIndex: seat,
      tableId,
      gameState: table.engine.getGameState(currentPlayerId)
    });

    io.to(tableId).emit('game-state', table.engine.getGameState());

    // Auto-start if enough players
    if (table.engine.canStartHand() && table.engine.state === GAME_STATES.WAITING) {
      setTimeout(() => startHand(tableId), 500);
    }
  });

  socket.on('player-action', ({ action }) => {
    if (!currentTableId || !currentPlayerId) return;
    const table = tables.get(currentTableId);
    if (!table) return;

    const currentPlayer = table.engine.getCurrentPlayer();
    if (!currentPlayer || currentPlayer.id !== currentPlayerId) {
      socket.emit('error', { message: 'Not your turn' });
      return;
    }

    // Get coaching analysis before processing
    const preActionState = table.engine.getGameState(currentPlayerId);
    const recommendation = coaching.getRealtimeSuggestion(preActionState, currentPlayerId);

    const result = table.engine.processAction(currentPlayerId, action);

    if (!result.success) {
      socket.emit('error', { message: result.error });
      return;
    }

    // Send coaching feedback
    if (recommendation) {
      const analysis = coaching.analyzeHandAction(action, preActionState, currentPlayerId);
      socket.emit('coaching-feedback', { recommendation: recommendation.recommendation, analysis, tip: recommendation.tip });
    }

    // Broadcast updated state
    broadcastGameState(currentTableId);

    // Emit action to all players
    io.to(currentTableId).emit('player-acted', result.action);

    if (result.handComplete) {
      handleHandComplete(currentTableId, result);
    } else if (result.advanceStreet) {
      io.to(currentTableId).emit('street-advanced', { street: table.engine.state });
      // Process AI actions after street advance
      setTimeout(() => processAIActions(currentTableId), 300);
    } else {
      // Process next AI action if applicable
      setTimeout(() => processAIActions(currentTableId), 200);
    }
  });

  socket.on('get-suggestion', () => {
    if (!currentTableId || !currentPlayerId) return;
    const table = tables.get(currentTableId);
    if (!table) return;

    const gameState = table.engine.getGameState(currentPlayerId);
    const suggestion = coaching.getRealtimeSuggestion(gameState, currentPlayerId);
    socket.emit('suggestion', suggestion);
  });

  socket.on('get-hand-analysis', ({ handIndex }) => {
    if (!currentTableId || !currentPlayerId) return;
    const table = tables.get(currentTableId);
    if (!table) return;

    const history = table.engine.handHistory;
    const hand = handIndex !== undefined ? history[handIndex] : history[history.length - 1];
    if (hand) {
      const analysis = coaching.getPostHandAnalysis(hand, currentPlayerId);
      socket.emit('hand-analysis', analysis);
    }
  });

  socket.on('get-session-summary', () => {
    if (!currentTableId || !currentPlayerId) return;
    const table = tables.get(currentTableId);
    if (!table) return;

    const summary = coaching.getSessionSummary(currentPlayerId, table.engine.handHistory);
    socket.emit('session-summary', summary);
  });

  socket.on('get-leak-report', () => {
    if (!currentPlayerId) return;
    const report = coaching.getLeakReport(currentPlayerId);
    socket.emit('leak-report', report);
  });

  socket.on('get-hand-history', () => {
    if (!currentTableId) return;
    const table = tables.get(currentTableId);
    if (!table) return;
    socket.emit('hand-history', table.engine.handHistory);
  });

  socket.on('start-next-hand', () => {
    if (!currentTableId) return;
    const table = tables.get(currentTableId);
    if (!table) return;
    if (table.engine.state === GAME_STATES.HAND_COMPLETE || table.engine.state === GAME_STATES.WAITING) {
      startHand(currentTableId);
    }
  });

  socket.on('add-ai', ({ aiType }) => {
    if (!currentTableId) return;
    const table = tables.get(currentTableId);
    if (!table) return;

    const profile = AI_PROFILES[aiType];
    if (!profile) return;

    const aiId = `ai_${aiType}_${nanoid(4)}`;
    const seat = table.engine.addPlayer(aiId, profile.name, true, aiType);
    if (seat >= 0) {
      table.aiEngines.set(aiId, new AIEngine(aiType));
      broadcastGameState(currentTableId);
    }
  });

  socket.on('disconnect', () => {
    if (currentPlayerId) {
      playerSockets.delete(currentPlayerId);
      if (currentTableId) {
        const table = tables.get(currentTableId);
        if (table) {
          const player = table.engine.players.get(currentPlayerId);
          if (player) {
            player.connected = false;
            // Don't remove immediately - allow reconnect
            setTimeout(() => {
              const p = table.engine.players.get(currentPlayerId);
              if (p && !p.connected) {
                table.engine.removePlayer(currentPlayerId);
                broadcastGameState(currentTableId);

                // Clean up empty tables
                if (table.engine.getSeatedPlayers().filter(p => !p.isAI).length === 0) {
                  if (table.autoPlay) clearInterval(table.autoPlay);
                  tables.delete(currentTableId);
                }
              }
            }, 60000);
          }
          broadcastGameState(currentTableId);
        }
      }
    }
  });

  socket.on('reconnect-player', ({ tableId, playerId }) => {
    const table = tables.get(tableId);
    if (!table) {
      socket.emit('error', { message: 'Table not found' });
      return;
    }

    const player = table.engine.players.get(playerId);
    if (player) {
      player.connected = true;
      currentTableId = tableId;
      currentPlayerId = playerId;
      playerSockets.set(playerId, socket);
      socket.join(tableId);

      socket.emit('joined', {
        playerId,
        seatIndex: player.seatIndex,
        tableId,
        gameState: table.engine.getGameState(playerId)
      });
    }
  });
});

function broadcastGameState(tableId) {
  const table = tables.get(tableId);
  if (!table) return;

  // Send personalized state to each human player
  for (const [playerId, player] of table.engine.players) {
    if (!player.isAI && playerSockets.has(playerId)) {
      const socket = playerSockets.get(playerId);
      socket.emit('game-state', table.engine.getGameState(playerId));
    }
  }
}

function startHand(tableId) {
  const table = tables.get(tableId);
  if (!table) return;

  const started = table.engine.startHand();
  if (!started) return;

  broadcastGameState(tableId);
  io.to(tableId).emit('hand-started', { handNumber: table.engine.handNumber });

  // Process AI actions if AI goes first
  setTimeout(() => processAIActions(tableId), 300);
}

function processAIActions(tableId) {
  const table = tables.get(tableId);
  if (!table) return;

  const currentPlayer = table.engine.getCurrentPlayer();
  if (!currentPlayer || !currentPlayer.isAI) return;

  const aiEngine = table.aiEngines.get(currentPlayer.id);
  if (!aiEngine) return;

  const gameState = table.engine.getGameState(currentPlayer.id);
  const decision = aiEngine.decide(gameState, currentPlayer.id);

  if (!decision) return;

  const result = table.engine.processAction(currentPlayer.id, decision);

  if (result.success) {
    broadcastGameState(tableId);
    io.to(tableId).emit('player-acted', result.action);

    if (result.handComplete) {
      handleHandComplete(tableId, result);
    } else if (result.advanceStreet) {
      io.to(tableId).emit('street-advanced', { street: table.engine.state });
      setTimeout(() => processAIActions(tableId), 300);
    } else {
      setTimeout(() => processAIActions(tableId), 200);
    }
  }
}

function handleHandComplete(tableId, result) {
  const table = tables.get(tableId);
  if (!table) return;

  broadcastGameState(tableId);

  // Send showdown data
  io.to(tableId).emit('hand-complete', {
    winners: result.winners,
    showdown: result.showdown || false,
    players: table.engine.getSeatedPlayers().map(p => ({
      id: p.id,
      name: p.name,
      holeCards: p.holeCards,
      folded: p.folded
    })),
    communityCards: table.engine.communityCards
  });

  // Do NOT auto-start — let the player review coaching, then click "Deal Next Hand"
  // The 'start-next-hand' socket event handles this.
}

// Serve client in production
if (process.env.NODE_ENV === 'production') {
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'client', 'dist', 'index.html'));
  });
}

const PORT = parseInt(process.env.PORT, 10) || 3000;
server.listen(PORT, () => {
  console.log('\n========================================');
  console.log('   POKER TRAINER - Ready to Play!');
  console.log('========================================');
  console.log(`   Local:   http://localhost:${PORT}`);
  console.log(`   Table:   http://localhost:${PORT}/table/demo`);
  console.log('========================================\n');
});
