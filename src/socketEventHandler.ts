import { Emitter } from 'nanoevents'
import { EVENT_TYPE, EventMap, SocketEvent } from './types'
import {
  HEARTBEAT_TIMER,
  WEBSOCKET_CLOSEEVENT_CODE,
  WEBSOCKET_ERROREVENT_CODE,
} from './constants'

const createSocketEventHandler = ({
  socket,
  token,
  eventEmitter,
  reconnect,
}: {
  socket: WebSocket
  token: string
  eventEmitter: Emitter<EventMap>
  reconnect: () => Promise<void>
}) => {
  let pingTimeout: NodeJS.Timeout

  const closeConnectionAndReconnect = () => {
    if (socket.readyState < 2) {
      socket.close()
    }

    reconnect()
  }

  const setPingTimeout = () => {
    clearTimeout(pingTimeout)
    pingTimeout = setTimeout(closeConnectionAndReconnect, HEARTBEAT_TIMER)
  }

  socket.onopen = () => {
    setPingTimeout()
    socket.send(token)
    eventEmitter.emit(EVENT_TYPE.CONNECT)
  }

  socket.onclose = event => {
    eventEmitter.emit(EVENT_TYPE.DISCONNECT, event)

    if (
      event.code > WEBSOCKET_CLOSEEVENT_CODE.NORMAL_CLOSURE &&
      event.code < 4000 &&
      event.code !== WEBSOCKET_CLOSEEVENT_CODE.SERVER_ERROR
    ) {
      closeConnectionAndReconnect()
    }
  }

  socket.onerror = event => {
    eventEmitter.emit(EVENT_TYPE.ERROR, event)

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

  socket.addEventListener('heartbeat', setPingTimeout)

  return socket
}

export default createSocketEventHandler
