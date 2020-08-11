import { mock } from 'jest-mock-extended'
import { Emitter } from 'nanoevents'
import { EventMap } from './types'
import createSocketEventHandler from './socketEventHandler'

describe('SocketEventHandler', () => {
  const mockToken = 'TOKEN'
  const mockedWebSocket = mock<WebSocket>({ readyState: 1 })
  let webSocketEventMap: Record<string, () => void> = {}
  const mockedEmitter = mock<Emitter<EventMap>>()
  const mockedReconnect = jest.fn()
  const mockedOnConnect = jest.fn()

  beforeAll(jest.useFakeTimers)

  beforeEach(() => {
    webSocketEventMap = {}

    mockedWebSocket.addEventListener = jest.fn((event, callback) => {
      webSocketEventMap[event] = callback
    }) as any

    createSocketEventHandler({
      token: mockToken,
      socket: mockedWebSocket,
      eventEmitter: mockedEmitter,
      reconnect: mockedReconnect,
      onConnect: mockedOnConnect,
    })
  })

  afterEach(jest.clearAllMocks)

  it('handles connect event', () => {
    const event = new Event('open')
    mockedWebSocket.onopen && mockedWebSocket.onopen(event)

    expect(mockedEmitter.emit).toBeCalledWith('connect')
    expect(mockedWebSocket.send).toBeCalledWith(mockToken)
  })

  describe('message event', () => {
    it('with valid payload', () => {
      const event = new MessageEvent('user_update', {
        data: JSON.stringify({
          type: 'user_update',
          value: { account_active: false },
        }),
      })

      mockedWebSocket.onmessage && mockedWebSocket.onmessage(event)

      expect(mockedEmitter.emit).toBeCalledWith('user_update', {
        account_active: false,
      })
    })

    it('with invalid payload', () => {
      jest.spyOn(console, 'warn').mockImplementation(() => null)

      const event = new MessageEvent('invalid_event', {
        data: JSON.stringify(null),
      })

      mockedWebSocket.onmessage && mockedWebSocket.onmessage(event)

      expect(mockedEmitter.emit).not.toBeCalled()
    })
  })

  it('handles error event', () => {
    const event = new Event('error')
    mockedWebSocket.onerror && mockedWebSocket.onerror(event)
    expect(mockedEmitter.emit).toBeCalledWith('error')
  })

  describe('heartbeat -> close + reconnect flow', () => {
    beforeEach(() => {
      const event = new Event('open')
      mockedWebSocket.onopen && mockedWebSocket.onopen(event)
    })

    it('assumes connection is problemmatic based on heartbeat event', () => {
      jest.advanceTimersByTime(12000)
      expect(mockedWebSocket.close).toBeCalled()
      expect(mockedReconnect).toBeCalled()
    })

    it('does not try to close websocket connection if it is already closing', () => {
      ;(mockedWebSocket as any).readyState = 2
      jest.advanceTimersByTime(12000)
      expect(mockedWebSocket.close).not.toBeCalled()
      expect(mockedReconnect).toBeCalled()
    })
  })
})