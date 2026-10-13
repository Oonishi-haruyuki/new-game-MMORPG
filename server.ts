import express from 'express';
import http from 'http';
import { WebSocketServer, WebSocket } from 'ws';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const isProduction = process.env.NODE_ENV === 'production';
const PORT = Number(process.env.PORT) || 3000;

const app = express();
const server = http.createServer(app);
const wss = new WebSocketServer({ noServer: true });

server.on('upgrade', (request, socket, head) => {
  const url = request.url || '';
  if (url.startsWith('/ws')) {
    wss.handleUpgrade(request, socket, head, (ws) => {
      wss.emit('connection', ws, request);
    });
  } else {
    socket.destroy();
  }
});

interface RemotePlayer {
  id: string;
  name: string;
  classId: string;
  level: number;
  x: number;
  y: number;
  z: number;
  rotation: number;
  hp: number;
  maxHp: number;
  state: 'idle' | 'walk' | 'attack' | 'cast';
  isMoving: boolean;
  isDashing: boolean;
  guild: string;
  title: string;
  lastSeen: number;
}

const players = new Map<string, { ws: WebSocket; data: RemotePlayer }>();

wss.on('connection', (ws: WebSocket) => {
  const playerId = 'player_' + Math.random().toString(36).substring(2, 9);

  // Send init packet with existing players
  const playerList: RemotePlayer[] = Array.from(players.values()).map((p) => p.data);
  ws.send(
    JSON.stringify({
      type: 'init',
      yourId: playerId,
      players: playerList,
      serverTime: Date.now()
    })
  );

  ws.on('message', (raw: string) => {
    try {
      const msg = JSON.parse(raw.toString());
      if (msg.type === 'join') {
        const pData: RemotePlayer = {
          id: playerId,
          name: msg.name || '冒険者_' + playerId.slice(-4),
          classId: msg.classId || 'paladin',
          level: msg.level || 1,
          x: msg.x || 0,
          y: msg.y || 0,
          z: msg.z || 0,
          rotation: msg.rotation || 0,
          hp: msg.hp || 500,
          maxHp: msg.maxHp || 500,
          state: 'idle',
          isMoving: false,
          isDashing: false,
          guild: msg.guild || '<光の聖約>',
          title: msg.title || '駆け出しの冒険者',
          lastSeen: Date.now()
        };
        players.set(playerId, { ws, data: pData });

        // Broadcast to all other players
        const joinMsg = JSON.stringify({ type: 'player_joined', player: pData });
        players.forEach((p, id) => {
          if (id !== playerId && p.ws.readyState === WebSocket.OPEN) {
            p.ws.send(joinMsg);
          }
        });
      } else if (msg.type === 'move') {
        const session = players.get(playerId);
        if (session) {
          session.data.x = msg.x;
          session.data.y = msg.y;
          session.data.z = msg.z;
          session.data.rotation = msg.rotation;
          session.data.isMoving = !!msg.isMoving;
          session.data.isDashing = !!msg.isDashing;
          session.data.state = msg.isMoving ? 'walk' : 'idle';
          session.data.lastSeen = Date.now();

          // Broadcast movement to all other players
          const moveMsg = JSON.stringify({
            type: 'player_moved',
            id: playerId,
            x: msg.x,
            y: msg.y,
            z: msg.z,
            rotation: msg.rotation,
            isMoving: !!msg.isMoving,
            isDashing: !!msg.isDashing,
            state: session.data.state
          });
          players.forEach((p, id) => {
            if (id !== playerId && p.ws.readyState === WebSocket.OPEN) {
              p.ws.send(moveMsg);
            }
          });
        }
      } else if (msg.type === 'action') {
        const session = players.get(playerId);
        if (session) {
          session.data.state = 'attack';
          session.data.lastSeen = Date.now();
        }
        const actionMsg = JSON.stringify({
          type: 'player_action',
          id: playerId,
          skillId: msg.skillId,
          skillName: msg.skillName,
          skillColor: msg.skillColor,
          targetPos: msg.targetPos
        });
        players.forEach((p, id) => {
          if (id !== playerId && p.ws.readyState === WebSocket.OPEN) {
            p.ws.send(actionMsg);
          }
        });
      } else if (msg.type === 'chat') {
        const session = players.get(playerId);
        const senderName = session ? session.data.name : msg.name || '冒険者';
        const chatMsg = JSON.stringify({
          type: 'chat_broadcast',
          id: 'chat_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
          sender: senderName,
          text: msg.text,
          channel: msg.channel || 'world',
          timestamp: new Date().toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' })
        });
        players.forEach((p) => {
          if (p.ws.readyState === WebSocket.OPEN) {
            p.ws.send(chatMsg);
          }
        });
      } else if (msg.type === 'ping') {
        ws.send(JSON.stringify({ type: 'pong', timestamp: Date.now() }));
      }
    } catch {
      // Ignore malformed message
    }
  });

  ws.on('close', () => {
    players.delete(playerId);
    const leaveMsg = JSON.stringify({ type: 'player_left', id: playerId });
    players.forEach((p) => {
      if (p.ws.readyState === WebSocket.OPEN) {
        p.ws.send(leaveMsg);
      }
    });
  });
});

// Periodic stale client cleanup
setInterval(() => {
  const now = Date.now();
  players.forEach((p, id) => {
    if (now - p.data.lastSeen > 45000) {
      try {
        p.ws.close();
      } catch {
        // ignore
      }
      players.delete(id);
    }
  });
}, 15000);

async function startServer() {
  if (!isProduction) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        hmr: false
      },
      appType: 'spa'
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  server.listen(PORT, '0.0.0.0', () => {
    console.log(`MMORPG Game & WebSocket server running on port ${PORT}`);
  });
}

startServer();
