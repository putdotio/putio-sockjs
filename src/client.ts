import SockJS from 'sockjs-client'
import { createNanoEvents, Emitter } from 'nanoevents'
// import { backOff } from 'exponential-backoff'
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

  const handleReconnect = () =>
    new Promise<void>(resolve => {
      console.log('now here')
      const newEventEmitter = createEventEmitter()

      const newSocket = createSocketEventHandler({
        token,
        socket: (() => {
          console.log('ho')
          return createWebSocket(url)
        })(),
        eventEmitter,
        reconnect,
      })

      newEventEmitter.on('connect', () => {
        resolve()
        eventEmitter = newEventEmitter
        socket = newSocket
      })
    })

  const reconnect = async () => {
    console.log('im here')
    await handleReconnect()
  }

  let eventEmitter = createEventEmitter()
  let socket = createSocketEventHandler({
    token,
    socket: createWebSocket(url),
    eventEmitter,
    reconnect,
  })

  return {
    on: <K extends keyof EventMap>(event: K, cb: EventMap[K]) =>
      eventEmitter.on(event, cb),
    send: (payload: SocketEvent) => socket.send(JSON.stringify(payload)),
    close: () => socket.close(),
  }
}

const createClientFactory = () =>
  createClientFactoryWithDependencies(
    () => createNanoEvents<EventMap>(),
    (url: string) => new SockJS(url),
  )

export const createPutioSocketClient = createClientFactory()

export type PutioSocketClient = ReturnType<typeof createPutioSocketClient>
