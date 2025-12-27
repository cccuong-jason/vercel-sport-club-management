import crypto from 'crypto'

function getKey() {
  const raw = process.env.VOTE_ENC_KEY
  if (!raw) return null
  return crypto.createHash('sha256').update(raw).digest()
}

export function encryptSelections(plain: string) {
  const key = getKey()
  if (!key) throw new Error('VOTE_ENC_KEY not configured')
  const iv = crypto.randomBytes(16)
  const cipher = crypto.createCipheriv('aes-256-cbc', key, iv)
  const enc = Buffer.concat([cipher.update(plain, 'utf8'), cipher.final()])
  return iv.toString('hex') + ':' + enc.toString('hex')
}

export function decryptSelections(enc: string) {
  const key = getKey()
  if (!key) throw new Error('VOTE_ENC_KEY not configured')
  const [ivHex, dataHex] = enc.split(':')
  const iv = Buffer.from(ivHex, 'hex')
  const data = Buffer.from(dataHex, 'hex')
  const decipher = crypto.createDecipheriv('aes-256-cbc', key, iv)
  const dec = Buffer.concat([decipher.update(data), decipher.final()])
  return dec.toString('utf8')
}
