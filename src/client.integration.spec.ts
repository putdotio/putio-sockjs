import { createClientFactory } from './client'

describe('createClientFactory', () => {
  it('🏆 connects without exploding 🏆', done => {
    const client = createClientFactory()({ token: 'TOKEN' })
    client.on('connect', () => {
      client.close()
      done()
    })
  })
})
