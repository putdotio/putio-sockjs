import { Emitter } from 'nanoevents'
import { EVENT_TYPE, EventMap, SocketEvent } from './types'
import {
  WEBSOCKET_CLOSEEVENT_CODE,
  WEBSOCKET_ERROREVENT_CODE,
} from './constants'

const HEARTBEAT_INTERVAL_IN_SECONDS = 10
const HEARTBEAT_LATENCY_ASSUMPTION_IN_SECONDS = 2
const HEARTBEAT_TIMER =
  (HEARTBEAT_INTERVAL_IN_SECONDS + HEARTBEAT_LATENCY_ASSUMPTION_IN_SECONDS) *
  1000

const createSocketEventHandler = ({
  token,
  socket,
  eventEmitter,
  reconnect,
  onConnect,
}: {
  token: string
  socket: WebSocket
  eventEmitter: Emitter<EventMap>
  reconnect: () => void
  onConnect: () => void
}) => {
  let pingTimeout: NodeJS.Timeout

  const setPingTimeout = () => {
    clearTimeout(pingTimeout)
    pingTimeout = setTimeout(closeConnectionAndReconnect, HEARTBEAT_TIMER)
  }

  const closeConnectionAndReconnect = () => {
    if (socket.readyState < 2) socket.close()
    clearTimeout(pingTimeout)
    reconnect()
  }

  socket.onopen = () => {
    setPingTimeout()
    socket.send(token)
    eventEmitter.emit(EVENT_TYPE.CONNECT)
    onConnect()
  }

  socket.onclose = event => {
    eventEmitter.emit(EVENT_TYPE.DISCONNECT, event)

    if (
      event.code > 1000 &&
      event.code < 4000 &&
      event.code !== WEBSOCKET_CLOSEEVENT_CODE.NORMAL_CLOSURE
    ) {
      closeConnectionAndReconnect()
    }
  }

  socket.onerror = event => {
    eventEmitter.emit(EVENT_TYPE.ERROR)

    if (
      (event as Record<string, any>).code ===
      WEBSOCKET_ERROREVENT_CODE.CONNECTION_REFUSED
    ) {
      closeConnectionAndReconnect()
    }
  }

  socket.onmessage = e => {
    try {
      const data = JSON.parse(e.data) as SocketEvent
      eventEmitter.emit(data.type, data.value)
    } catch (e) {
      console.warn(`Could not deserialize message payload: `, e)
    }
  }

  socket.addEventListener('heartbeat', () => setPingTimeout())
}

export default createSocketEventHandler
