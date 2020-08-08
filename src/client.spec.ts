import { mock } from 'jest-mock-extended'
import { Emitter } from 'nanoevents'
import { EventMap, SocketEvents } from './types'
import {
  PutioSocketClient,
  createClientFactoryWithDependencies,
} from './client'

describe('PutioSocketClient with mocked dependencies', () => {
  const mockConfig = { url: 'test.io', token: 'TOKEN' }
  const mockedEmitter = mock<Emitter<EventMap>>()
  const mockedWebSocket = mock<WebSocket>()

  const createMockedEmiter = jest.fn(() => mockedEmitter)
  const createMockedWebSocket = jest.fn((_: string) => mockedWebSocket)

  const createClient = createClientFactoryWithDependencies(
    createMockedEmiter,
    createMockedWebSocket,
  )

  afterEach(jest.clearAllMocks)

  describe('commands', () => {
    let client: PutioSocketClient
    beforeEach(() => (client = createClient(mockConfig)))

    it('sends close command', () => {
      client.close()
      expect(mockedWebSocket.close).toBeCalled()

      mockedWebSocket.onclose(new CloseEvent('close'))
      expect(mockedEmitter.emit).toBeCalledWith('disconnect')
    })

    it('sends send command', () => {
      const message: SocketEvents.Custom = {
        type: 'custom',
        value: { foo: 'bar' },
      }

      client.send(message)
      expect(mockedWebSocket.send).toBeCalledWith(JSON.stringify(message))
    })
  })

  describe('events', () => {
    let client: PutioSocketClient
    beforeEach(() => (client = createClient(mockConfig)))

    it('handles connect event', () => {
      mockedWebSocket.onopen(new Event('open'))
      expect(mockedEmitter.emit).toBeCalledWith('connect')
      expect(mockedWebSocket.send).toBeCalledWith(mockConfig.token)
    })

    it('handles message event with valid payload', () => {
      const event = new MessageEvent('user_update', {
        data: JSON.stringify({
          type: 'user_update',
          value: { account_active: false },
        }),
      })

      mockedWebSocket.onmessage(event)
      expect(mockedEmitter.emit).toBeCalledWith('user_update', {
        account_active: false,
      })
    })

    it('ignores message event with invalid payload', () => {
      jest.spyOn(console, 'warn').mockImplementation(() => null)

      const event = new MessageEvent('invalid_event', {
        data: JSON.stringify(null),
      })

      mockedWebSocket.onmessage(event)
      expect(mockedEmitter.emit).not.toBeCalled()
    })

    it('handles error event', () => {
      mockedWebSocket.onerror(new Event('Error'))
      expect(mockedEmitter.emit).toBeCalledWith('error')
    })
  })
})
