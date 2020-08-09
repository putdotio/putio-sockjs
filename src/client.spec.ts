import { mock } from 'jest-mock-extended'
import { Emitter } from 'nanoevents'
import { EventMap, SocketEvents } from './types'
import {
  createClientFactoryWithDependencies,
  PutioSocketClient,
} from './client'

jest.useFakeTimers()

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
  let client: PutioSocketClient

  describe('commands', () => {
    beforeEach(() => (client = createClient(mockConfig)))
    afterEach(jest.clearAllMocks)

    it('handles send command', () => {
      const message: SocketEvents.Custom = {
        type: 'custom',
        value: { foo: 'bar' },
      }

      client.send(message)
      expect(mockedWebSocket.send).toBeCalledWith(JSON.stringify(message))
    })

    it('handles close command', () => {
      client.close()
      expect(mockedWebSocket.close).toBeCalled()

      const event = new CloseEvent('close')
      mockedWebSocket.onclose && mockedWebSocket.onclose(event)

      expect(mockedEmitter.emit).toBeCalledWith('disconnect', event)
    })
  })

  describe('reconnect flow', () => {
    beforeEach(() => (client = createClient(mockConfig)))
    afterEach(jest.clearAllMocks)

    it('tries to reconnect after close and error: connection refused events', async () => {
      const flushPromises = () => new Promise(setImmediate)

      expect(createMockedWebSocket).toHaveBeenCalledTimes(1)

      mockedWebSocket.onopen && mockedWebSocket.onopen(new Event('Connected'))
      expect(mockedEmitter.emit).toBeCalledWith('connect')

      mockedWebSocket.onclose &&
        mockedWebSocket.onclose({ code: 1001 } as CloseEvent)

      jest.runAllTimers()
      await flushPromises()
      expect(createMockedWebSocket).toHaveBeenCalledTimes(2)

      mockedWebSocket.onerror &&
        mockedWebSocket.onerror({ code: 'ECONNREFUSED' } as any)

      jest.runAllTimers()
      await flushPromises()
      expect(createMockedWebSocket).toHaveBeenCalledTimes(3)

      mockedWebSocket.onopen && mockedWebSocket.onopen(new Event('Reconnected'))
      expect(mockedEmitter.emit).toBeCalledWith('connect')
      expect(mockedEmitter.emit).toBeCalledWith('reconnect')

      expect(createMockedWebSocket).toHaveBeenCalledTimes(3)
    })
  })
})
