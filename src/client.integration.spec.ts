import { createClientFactory } from './client'

describe('createClientFactory', () => {
  it('🏆 runs without crashing 🏆', done => {
    const client = createClientFactory()({ token: 'TOKEN' })
    client.on('connect', () => {
      client.close()
      done()
    })
  })
})
