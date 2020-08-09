import { Emitter } from 'nanoevents'
import { EVENT_TYPE, EventMap, SocketEvent } from './types'
import {
  WEBSOCKET_CLOSEEVENT_CODE,
  WEBSOCKET_ERROREVENT_CODE,
} from './constants'

type SocketHandlerParams = {
  token: string
  socket: WebSocket
  eventEmitter: Emitter<EventMap>
  reconnect: () => void
}

const createSocketEventHandler = ({
  token,
  socket,
  eventEmitter,
  reconnect,
}: SocketHandlerParams) => {
  socket.onopen = () => {
    socket.send(token)
    eventEmitter.emit(EVENT_TYPE.CONNECT)
  }

  socket.onclose = event => {
    eventEmitter.emit(EVENT_TYPE.DISCONNECT, event)

    if (
      event.code > 1000 &&
      event.code < 4000 &&
      event.code !== WEBSOCKET_CLOSEEVENT_CODE.NORMAL_CLOSURE
    ) {
      reconnect()
    }
  }

  socket.onerror = event => {
    eventEmitter.emit(EVENT_TYPE.ERROR)

    if (
      (event as Record<string, any>).code ===
      WEBSOCKET_ERROREVENT_CODE.CONNECTION_REFUSED
    ) {
      reconnect()
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

  return {
    dispose: () => socket.close(),
  }
}

export default createSocketEventHandler
