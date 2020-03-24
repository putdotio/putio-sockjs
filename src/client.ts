import SockJS from 'sockjs-client'
import { createNanoEvents, Emitter } from 'nanoevents'
import { ServerEvent, EventsMap } from './types'

export const DEFAULT_OPTIONS = {
  url: 'https://socket.put.io/socket/sockjs',
}

export const createPutioSocketClientWithDependencies = (
  createEmitter: () => Emitter<EventsMap>,
  createWebSocket: (url: string) => WebSocket,
) => (options = DEFAULT_OPTIONS) => {
  const emitter = createEmitter()
  let socket: WebSocket

  const connect = (token: string) => {
    socket = socket || createWebSocket(options.url)

    socket.onopen = () => {
      socket.send(token)
      emitter.emit('connect')
    }

    socket.onmessage = e => {
      try {
        const data = JSON.parse(e.data) as ServerEvent
        emitter.emit(data.type, data.payload)
      } catch (e) {
        console.warn(e)
      }
    }

    socket.onclose = () => emitter.emit('disconnect')
  }

  const disconnect = () => socket && socket.close()

  return {
    connect,
    disconnect,
    on: emitter.on,
  }
}

export const createPutioSocketClient = () => {
  const createEmitter = () => createNanoEvents<EventsMap>()
  const createWebSocket = (url: string) => new SockJS(url)
  return createPutioSocketClientWithDependencies(createEmitter, createWebSocket)
}

export type PutioSocketClient = ReturnType<
  ReturnType<typeof createPutioSocketClient>
>
