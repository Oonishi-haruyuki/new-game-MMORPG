// Real-time WebSocket Client for Aetheria Online MMORPG
import { CharacterClassId, ChatMessage, ChatChannel } from '../types/game';

export interface RemotePlayerState {
  id: string;
  name: string;
  classId: CharacterClassId;
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
}

export type PlayerMovedHandler = (data: {
  id: string;
  x: number;
  y: number;
  z: number;
  rotation: number;
  isMoving: boolean;
  isDashing: boolean;
  state: 'idle' | 'walk' | 'attack' | 'cast';
}) => void;

export type PlayerActionHandler = (data: {
  id: string;
  skillId?: string;
  skillName?: string;
  skillColor?: string;
  targetPos?: { x: number; y: number; z: number };
}) => void;

export type PlayerJoinedHandler = (player: RemotePlayerState) => void;
export type PlayerLeftHandler = (id: string) => void;
export type ChatBroadcastHandler = (chat: ChatMessage) => void;
export type StatusChangeHandler = (status: {
  connected: boolean;
  playerCount: number;
  ping: number;
}) => void;

class MultiplayerClient {
  private ws: WebSocket | null = null;
  private myId: string | null = null;
  private isConnected: boolean = false;
  private ping: number = 0;
  private pingStartTime: number = 0;
  private reconnectTimer: number | null = null;
  private pingInterval: number | null = null;
  private lastMoveSent: number = 0;
  private currentPlayers: Map<string, RemotePlayerState> = new Map();

  // Callbacks
  private onPlayerJoinedCb: PlayerJoinedHandler | null = null;
  private onPlayerMovedCb: PlayerMovedHandler | null = null;
  private onPlayerActionCb: PlayerActionHandler | null = null;
  private onPlayerLeftCb: PlayerLeftHandler | null = null;
  private onChatBroadcastCb: ChatBroadcastHandler | null = null;
  private onStatusChangeCb: StatusChangeHandler | null = null;

  public init() {
    this.connect();
  }

  private connect() {
    if (this.ws && (this.ws.readyState === WebSocket.CONNECTING || this.ws.readyState === WebSocket.OPEN)) {
      return;
    }

    try {
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const wsUrl = `${protocol}//${window.location.host}/ws`;
      this.ws = new WebSocket(wsUrl);

      this.ws.onopen = () => {
        this.isConnected = true;
        this.notifyStatus();
        this.startPing();
      };

      this.ws.onmessage = (event) => {
        try {
          const msg = JSON.parse(event.data);
          this.handleMessage(msg);
        } catch {
          // Ignore
        }
      };

      this.ws.onclose = () => {
        this.isConnected = false;
        this.notifyStatus();
        this.stopPing();
        this.scheduleReconnect();
      };

      this.ws.onerror = () => {
        // Handled by onclose
      };
    } catch {
      this.scheduleReconnect();
    }
  }

  private scheduleReconnect() {
    if (this.reconnectTimer) return;
    this.reconnectTimer = window.setTimeout(() => {
      this.reconnectTimer = null;
      this.connect();
    }, 2500);
  }

  private startPing() {
    this.stopPing();
    this.pingInterval = window.setInterval(() => {
      if (this.ws && this.ws.readyState === WebSocket.OPEN) {
        this.pingStartTime = Date.now();
        this.ws.send(JSON.stringify({ type: 'ping' }));
      }
    }, 5000);
  }

  private stopPing() {
    if (this.pingInterval) {
      clearInterval(this.pingInterval);
      this.pingInterval = null;
    }
  }

  private handleMessage(msg: any) {
    if (msg.type === 'init') {
      this.myId = msg.yourId;
      if (Array.isArray(msg.players)) {
        this.currentPlayers.clear();
        msg.players.forEach((p: RemotePlayerState) => {
          if (p.id !== this.myId) {
            this.currentPlayers.set(p.id, p);
            if (this.onPlayerJoinedCb) this.onPlayerJoinedCb(p);
          }
        });
      }
      this.notifyStatus();
    } else if (msg.type === 'player_joined') {
      if (msg.player && msg.player.id !== this.myId) {
        this.currentPlayers.set(msg.player.id, msg.player);
        if (this.onPlayerJoinedCb) this.onPlayerJoinedCb(msg.player);
        this.notifyStatus();
      }
    } else if (msg.type === 'player_moved') {
      if (msg.id !== this.myId) {
        const p = this.currentPlayers.get(msg.id);
        if (p) {
          p.x = msg.x;
          p.y = msg.y;
          p.z = msg.z;
          p.rotation = msg.rotation;
          p.isMoving = msg.isMoving;
          p.isDashing = msg.isDashing;
          p.state = msg.state;
        }
        if (this.onPlayerMovedCb) {
          this.onPlayerMovedCb(msg);
        }
      }
    } else if (msg.type === 'player_action') {
      if (msg.id !== this.myId && this.onPlayerActionCb) {
        this.onPlayerActionCb(msg);
      }
    } else if (msg.type === 'player_left') {
      this.currentPlayers.delete(msg.id);
      if (this.onPlayerLeftCb) this.onPlayerLeftCb(msg.id);
      this.notifyStatus();
    } else if (msg.type === 'chat_broadcast') {
      if (this.onChatBroadcastCb) {
        this.onChatBroadcastCb({
          id: msg.id,
          sender: msg.sender,
          text: msg.text,
          channel: msg.channel,
          timestamp: msg.timestamp
        });
      }
    } else if (msg.type === 'pong') {
      this.ping = Math.max(1, Date.now() - this.pingStartTime);
      this.notifyStatus();
    }
  }

  private notifyStatus() {
    if (this.onStatusChangeCb) {
      this.onStatusChangeCb({
        connected: this.isConnected,
        playerCount: this.currentPlayers.size + (this.isConnected ? 1 : 0),
        ping: this.ping
      });
    }
  }

  public join(info: {
    name: string;
    classId: CharacterClassId;
    level: number;
    x: number;
    y: number;
    z: number;
    rotation: number;
    hp: number;
    maxHp: number;
  }) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({ type: 'join', ...info }));
    }
  }

  public sendMove(x: number, y: number, z: number, rotation: number, isMoving: boolean, isDashing: boolean) {
    const now = Date.now();
    // Throttle to 50ms (~20 updates/sec) unless movement stopped
    if (!isMoving && this.lastMoveSent !== 0) {
      // Force send stopped
      this.lastMoveSent = 0;
    } else if (now - this.lastMoveSent < 50) {
      return;
    }

    this.lastMoveSent = now;
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(
        JSON.stringify({
          type: 'move',
          x: Math.round(x * 100) / 100,
          y: Math.round(y * 100) / 100,
          z: Math.round(z * 100) / 100,
          rotation: Math.round(rotation * 100) / 100,
          isMoving,
          isDashing
        })
      );
    }
  }

  public sendAction(skillId: string, skillName: string, skillColor: string, targetPos?: { x: number; y: number; z: number }) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(
        JSON.stringify({
          type: 'action',
          skillId,
          skillName,
          skillColor,
          targetPos
        })
      );
    }
  }

  public sendChat(text: string, channel: ChatChannel, name?: string) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({ type: 'chat', text, channel, name }));
    }
  }

  public onPlayerJoined(cb: PlayerJoinedHandler) {
    this.onPlayerJoinedCb = cb;
  }
  public onPlayerMoved(cb: PlayerMovedHandler) {
    this.onPlayerMovedCb = cb;
  }
  public onPlayerAction(cb: PlayerActionHandler) {
    this.onPlayerActionCb = cb;
  }
  public onPlayerLeft(cb: PlayerLeftHandler) {
    this.onPlayerLeftCb = cb;
  }
  public onChatBroadcast(cb: ChatBroadcastHandler) {
    this.onChatBroadcastCb = cb;
  }
  public onStatusChange(cb: StatusChangeHandler) {
    this.onStatusChangeCb = cb;
  }

  public getMyId(): string | null {
    return this.myId;
  }
  public getIsConnected(): boolean {
    return this.isConnected;
  }
  public getOnlineCount(): number {
    return this.currentPlayers.size + (this.isConnected ? 1 : 0);
  }
}

export const multiplayer = new MultiplayerClient();
