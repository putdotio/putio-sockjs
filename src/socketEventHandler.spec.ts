import { mock } from 'jest-mock-extended'
import { Emitter } from 'nanoevents'
import { EventMap } from './types'
import createSocketEventHandler from './socketEventHandler'

describe('SocketEventHandler', () => {
  const mockToken = 'TOKEN'
  const mockedWebSocket = mock<WebSocket>()
  const mockedEmitter = mock<Emitter<EventMap>>()
  const mockedReconnect = jest.fn()

  describe('events', () => {
    const handler = createSocketEventHandler({
      token: mockToken,
      socket: mockedWebSocket,
      eventEmitter: mockedEmitter,
      reconnect: mockedReconnect,
    })

    afterEach(jest.clearAllMocks)

    it('handles connect event', () => {
      const event = new Event('open')
      mockedWebSocket.onopen && mockedWebSocket.onopen(event)

      expect(mockedEmitter.emit).toBeCalledWith('connect')
      expect(mockedWebSocket.send).toBeCalledWith(mockToken)
    })

    it('handles message event with valid payload', () => {
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

    it('ignores message event with invalid payload', () => {
      jest.spyOn(console, 'warn').mockImplementation(() => null)

      const event = new MessageEvent('invalid_event', {
        data: JSON.stringify(null),
      })
      mockedWebSocket.onmessage && mockedWebSocket.onmessage(event)

      expect(mockedEmitter.emit).not.toBeCalled()
    })

    it('handles error event', () => {
      const event = new Event('error')
      mockedWebSocket.onerror && mockedWebSocket.onerror(event)
      expect(mockedEmitter.emit).toBeCalledWith('error')
    })

    it('calls socket.close on dispose', () => {
      handler.dispose()
      expect(mockedWebSocket.close).toBeCalledTimes(1)
    })
  })
})
