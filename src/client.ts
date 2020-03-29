import SockJS from 'sockjs-client'
import { createNanoEvents, Emitter } from 'nanoevents'
import { Event, EventsMap } from './types'

export const DEFAULT_OPTIONS = {
  url: 'https://socket.put.io/socket/sockjs',
}

export const createPutioSocketClientWithDependencies = (
  createEmitter: () => Emitter<EventsMap>,
  createWebSocket: (url: string) => WebSocket,
) => (options = DEFAULT_OPTIONS) => {
  const emitter = createEmitter()
  const socket = createWebSocket(options.url)

  socket.onopen = () => emitter.emit('connect')
  socket.onclose = () => emitter.emit('disconnect')
  socket.onerror = () => emitter.emit('error')

  const authenticate = (token: string) => {
    socket.send(token)

    socket.onmessage = e => {
      try {
        const data = JSON.parse(e.data) as Event
        emitter.emit(data.type, data.payload)
      } catch (e) {
        console.warn(e)
      }
    }
  }

  return {
    authenticate,
    close: socket.close,
    on: emitter.on,
    send: (payload: Event) => socket.send(JSON.stringify(payload)),
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
