import SockJS from 'sockjs-client'
import { createNanoEvents, Emitter } from 'nanoevents'
import { SocketEvent, EventMap } from './types'

const DEFAULT_URL = 'https://socket.put.io/socket/sockjs'
export type PutioSocketClientConfig = { url?: string; token: string }

export const createClientFactoryWithDependencies = (
  createEmitter: () => Emitter<EventMap>,
  createWebSocket: (url: string) => WebSocket,
) => (config: PutioSocketClientConfig) => {
  const url = config.url || DEFAULT_URL
  const emitter = createEmitter()
  const socket = createWebSocket(url)

  socket.onopen = () => {
    socket.send(config.token)
    emitter.emit('connect')
  }

  socket.onclose = () => {
    emitter.emit('disconnect')
  }

  socket.onerror = () => {
    emitter.emit('error')
  }

  socket.onmessage = e => {
    emitter.emit('message', e.data)

    try {
      const data = JSON.parse(e.data) as SocketEvent
      emitter.emit(data.type, data.payload)
    } catch (e) {
      console.warn(e)
    }
  }

  return {
    on: <K extends keyof EventMap>(event: K, cb: EventMap[K]) =>
      emitter.on(event, cb),
    close: () => socket.close(),
    send: (payload: SocketEvent) => socket.send(JSON.stringify(payload)),
  }
}

export const createClientFactory = () => {
  const createEmitter = () => createNanoEvents<EventMap>()
  const createWebSocket = (url: string) => new SockJS(url)
  return createClientFactoryWithDependencies(createEmitter, createWebSocket)
}

export type PutioSocketClient = ReturnType<
  ReturnType<typeof createClientFactory>
>
