import { mock } from 'jest-mock-extended'
import { Emitter } from 'nanoevents'
import { EventsMap, Events } from './types'
import {
  PutioSocketClient,
  createPutioSocketClient,
  createPutioSocketClientWithDependencies,
} from './client'

describe('createPutioSocketClient', () => {
  it('🏆 runs without crashing 🏆', () => {
    const createClient = createPutioSocketClient()
    const client = createClient()
    expect(client).toBeTruthy()
  })
})

describe('createPutioSocketClientWithDependencies', () => {
  const MOCK_TOKEN = 'TOKEN'

  const mockedEmitter = mock<Emitter<EventsMap>>()
  const mockedWebSocket = mock<WebSocket>()

  const createMockedEmiter = jest.fn(() => mockedEmitter)
  const createMockedWebSocket = jest.fn((_: string) => mockedWebSocket)

  const createClient = createPutioSocketClientWithDependencies(
    createMockedEmiter,
    createMockedWebSocket,
  )

  afterEach(jest.clearAllMocks)

  describe('creation', () => {
    it('consumes custom options parameter', () => {
      createClient({ url: 'example.com' })
      expect(createMockedWebSocket).toBeCalledWith('example.com')
    })
  })

  describe('commands', () => {
    let client: PutioSocketClient
    beforeEach(() => (client = createClient()))

    it('sends authenticate command', () => {
      mockedWebSocket.onopen(new Event(''))
      client.authenticate(MOCK_TOKEN)
      expect(mockedWebSocket.send).toBeCalledWith(MOCK_TOKEN)
      expect(mockedEmitter.emit).toBeCalledWith('connect')
    })

    it('sends close command', () => {
      client.close()
      expect(mockedWebSocket.close).toBeCalled()

      mockedWebSocket.onclose(new CloseEvent(''))
      expect(mockedEmitter.emit).toBeCalledWith('disconnect')
    })

    it('sends send command', () => {
      const message: Events.Custom = {
        type: 'custom',
        payload: { foo: 'bar' },
      }

      client.send(message)
      expect(mockedWebSocket.send).toBeCalledWith(JSON.stringify(message))
    })
  })

  describe('events', () => {
    let client: PutioSocketClient
    beforeEach(() => (client = createClient()))

    it('handles message event with valid payload', () => {
      const event = new MessageEvent('user_update', {
        data: JSON.stringify({
          type: 'user_update',
          payload: { account_active: false },
        }),
      })

      mockedWebSocket.onmessage(event)
      expect(mockedEmitter.emit).toBeCalledWith('user_update', {
        account_active: false,
      })
    })

    it('handles message event with invalid payload', () => {
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
