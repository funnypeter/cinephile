import crypto from 'crypto'

const ALGORITHM = 'aes-256-gcm'

function getKey() {
  const secret = process.env.TRAKT_COOKIE_SECRET ?? ''
  return crypto.createHash('sha256').update(secret).digest()
}

export function encrypt(data: string): string {
  const key = getKey()
  const iv = crypto.randomBytes(12)
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv)
  const encrypted = Buffer.concat([cipher.update(data, 'utf8'), cipher.final()])
  const tag = cipher.getAuthTag()
  return [iv.toString('base64'), encrypted.toString('base64'), tag.toString('base64')].join('.')
}

export function decrypt(data: string): string | null {
  try {
    const key = getKey()
    const [ivB64, encB64, tagB64] = data.split('.')
    const decipher = crypto.createDecipheriv(ALGORITHM, key, Buffer.from(ivB64, 'base64'))
    decipher.setAuthTag(Buffer.from(tagB64, 'base64'))
    return decipher.update(Buffer.from(encB64, 'base64')) + decipher.final('utf8')
  } catch {
    return null
  }
}
