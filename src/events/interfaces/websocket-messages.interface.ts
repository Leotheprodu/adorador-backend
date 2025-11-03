// Interfaces optimizadas para mensajes WebSocket
// Diseñadas para mínimo payload y máxima velocidad

export interface OptimizedLyricMessage {
  p: number; // position (más corto que "position")
  a: 'f' | 'b'; // action: 'f' = forward, 'b' = backward
}

export interface OptimizedEventSongMessage {
  s: number; // song id (más corto que "songId")
}

export interface OptimizedLiveMessage {
  t: string; // text content
}

// Estructura base para todos los mensajes WebSocket
export interface BaseWebSocketMessage<T = any> {
  e: string; // event id
  m: T; // message data
  u: string; // user name (admin)
  ts: number; // timestamp
}

// Tipos específicos de mensajes
export type LyricWebSocketMessage = BaseWebSocketMessage<OptimizedLyricMessage>;
export type EventSongWebSocketMessage =
  BaseWebSocketMessage<OptimizedEventSongMessage>;
export type LiveWebSocketMessage = BaseWebSocketMessage<OptimizedLiveMessage>;

// Union type para todos los mensajes
export type WebSocketMessage =
  | LyricWebSocketMessage
  | EventSongWebSocketMessage
  | LiveWebSocketMessage;

// Funciones de conversión para mantener compatibilidad
export const toLegacyLyricFormat = (msg: OptimizedLyricMessage) => ({
  position: msg.p,
  action: msg.a === 'f' ? 'forward' : 'backward',
});

export const fromLegacyLyricFormat = (legacy: {
  position: number;
  action: 'forward' | 'backward';
}): OptimizedLyricMessage => ({
  p: legacy.position,
  a: legacy.action === 'forward' ? 'f' : 'b',
});

export const toLegacyEventSongFormat = (msg: OptimizedEventSongMessage) =>
  msg.s;
export const fromLegacyEventSongFormat = (
  songId: number,
): OptimizedEventSongMessage => ({ s: songId });

export const toLegacyLiveMessageFormat = (msg: OptimizedLiveMessage) => msg.t;
export const fromLegacyLiveMessageFormat = (
  text: string,
): OptimizedLiveMessage => ({ t: text });

// Utilidades para comprimir/descomprimir mensajes
export const compressMessage = <T>(
  eventId: string,
  message: T,
  userName: string,
): BaseWebSocketMessage<T> => ({
  e: eventId,
  m: message,
  u: userName,
  ts: Date.now(),
});

export const decompressMessage = <T>(compressed: BaseWebSocketMessage<T>) => ({
  eventId: compressed.e,
  message: compressed.m,
  userName: compressed.u,
  timestamp: compressed.ts,
});

// Validadores rápidos
export const isValidLyricMessage = (msg: any): msg is OptimizedLyricMessage => {
  return typeof msg.p === 'number' && (msg.a === 'f' || msg.a === 'b');
};

export const isValidEventSongMessage = (
  msg: any,
): msg is OptimizedEventSongMessage => {
  return typeof msg.s === 'number';
};

export const isValidLiveMessage = (msg: any): msg is OptimizedLiveMessage => {
  return typeof msg.t === 'string';
};
