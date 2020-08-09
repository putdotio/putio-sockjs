import SockJS from 'sockjs-client'
import { createNanoEvents, Emitter } from 'nanoevents'
import { EventMap, SocketEvent } from './types'
import { DEFAULT_API_URL } from './constants'
import createSocketEventHandler from './socketEventHandler'

export type PutioSocketClientConfig = { url?: string; token: string }

export const createClientFactoryWithDependencies = (
  createEventEmitter: () => Emitter<EventMap>,
  createWebSocket: (url: string) => WebSocket,
) => (config: PutioSocketClientConfig) => {
  const { token } = config
  const url = config.url || DEFAULT_API_URL
  const eventEmitter = createEventEmitter()

  const reconnect = () =>
    new Promise(resolve => {
      const newSocket = createWebSocket(url)
      newSocket.onopen = () => {
        socket = newSocket
        socketHandler.dispose()
        socketHandler = createSocketEventHandler({
          token,
          socket,
          eventEmitter,
          reconnect,
        })
      }
      resolve()
    })

  let socket = createWebSocket(url)
  let socketHandler = createSocketEventHandler({
    token: config.token,
    socket,
    eventEmitter,
    reconnect,
  })

  return {
    on: <K extends keyof EventMap>(event: K, cb: EventMap[K]) => {
      return eventEmitter.on(event, cb)
    },
    send: (payload: SocketEvent) => socket.send(JSON.stringify(payload)),
    close: () => socket.close(),
  }
}

const createClientFactory = () => {
  const createEventEmitter = () => createNanoEvents<EventMap>()
  const createWebSocket = (url: string) => new SockJS(url)
  return createClientFactoryWithDependencies(
    createEventEmitter,
    createWebSocket,
  )
}

export const createPutioSocketClient = createClientFactory()

export type PutioSocketClient = ReturnType<typeof createPutioSocketClient>
