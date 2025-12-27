import { encryptSelections, decryptSelections } from '@/lib/crypto'

beforeAll(() => {
  process.env.VOTE_ENC_KEY = 'test-key'
})

test('encrypt/decrypt roundtrip', () => {
  const plain = JSON.stringify({ first: 'u1', second: 'u2', third: 'u3' })
  const enc = encryptSelections(plain)
  const dec = decryptSelections(enc)
  expect(dec).toBe(plain)
})

