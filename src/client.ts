import SockJS from 'sockjs-client'
import { createNanoEvents, Emitter } from 'nanoevents'
import { backOff } from 'exponential-backoff'
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

  const reconnect = async () => {
    const reconnector = () =>
      new Promise(resolve => {
        socket = createWebSocket(url)

        createSocketEventHandler({
          token,
          socket,
          eventEmitter,
          reconnect: () => {
            reconnect()
            resolve()
          },
          onConnect: () => {
            eventEmitter.emit('reconnect')
            resolve()
          },
        })
      })

    await backOff(reconnector)
  }

  let socket = createWebSocket(url)
  createSocketEventHandler({
    token: config.token,
    socket,
    eventEmitter,
    reconnect,
    onConnect: () => {},
  })

  return {
    on: <K extends keyof EventMap>(event: K, cb: EventMap[K]) =>
      eventEmitter.on(event, cb),
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
