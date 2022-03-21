export const DEFAULT_API_URL = 'https://socket.put.io/socket/sockjs'

export const WEBSOCKET_CLOSEEVENT_CODE = {
  NORMAL_CLOSURE: 1000,
  SERVER_ERROR: 1011,
  UNAUTHORIZED: 4001,
} as const

export const WEBSOCKET_ERROREVENT_CODE = {
  CONNECTION_REFUSED: 'ECONNREFUSED',
} as const
