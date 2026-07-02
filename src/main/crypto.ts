import crypto from 'node:crypto'

// ── 암호화 사양 ─────────────────────────────────────────────
// KDF:   scrypt (N=2^15, r=8, p=1) → 32바이트 키
// 암호:  AES-256-GCM (인증 암호화, 변조 감지)
// 마스터 비밀번호 자체는 절대 디스크에 저장하지 않는다.
// 잘못된 비밀번호는 GCM 인증 태그 검증 실패로 자동 거부된다.
// ────────────────────────────────────────────────────────────

const KDF_N = 1 << 15 // 32768
const KDF_r = 8
const KDF_p = 1
const KEY_LEN = 32 // AES-256
const SALT_LEN = 16
const IV_LEN = 12 // GCM 권장 12바이트

export interface KdfParams {
  salt: string // base64
  N: number
  r: number
  p: number
}

export interface EncryptedBlob {
  iv: string // base64
  authTag: string // base64
  ciphertext: string // base64
}

export interface VaultFile {
  version: 1
  kdf: KdfParams
  // 비밀번호 검증용 (키가 맞는지 빠르게 확인). 실제 데이터와 동일 키 사용.
  verifier: EncryptedBlob
  data: EncryptedBlob
  updatedAt: string
}

const VERIFIER_PLAINTEXT = 'mylogin-vault-verifier-v1'

export function generateSalt(): string {
  return crypto.randomBytes(SALT_LEN).toString('base64')
}

export function deriveKey(masterPassword: string, kdf: KdfParams): Buffer {
  const salt = Buffer.from(kdf.salt, 'base64')
  return crypto.scryptSync(masterPassword.normalize('NFKC'), salt, KEY_LEN, {
    N: kdf.N,
    r: kdf.r,
    p: kdf.p,
    // scrypt 메모리 한도: N*r*128*p 보다 넉넉히
    maxmem: 256 * 1024 * 1024
  })
}

export function defaultKdf(): KdfParams {
  return { salt: generateSalt(), N: KDF_N, r: KDF_r, p: KDF_p }
}

export function encrypt(key: Buffer, plaintext: string): EncryptedBlob {
  const iv = crypto.randomBytes(IV_LEN)
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv)
  const ciphertext = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()])
  const authTag = cipher.getAuthTag()
  return {
    iv: iv.toString('base64'),
    authTag: authTag.toString('base64'),
    ciphertext: ciphertext.toString('base64')
  }
}

export function decrypt(key: Buffer, blob: EncryptedBlob): string {
  const iv = Buffer.from(blob.iv, 'base64')
  const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv)
  decipher.setAuthTag(Buffer.from(blob.authTag, 'base64'))
  const plaintext = Buffer.concat([
    decipher.update(Buffer.from(blob.ciphertext, 'base64')),
    decipher.final()
  ])
  return plaintext.toString('utf8')
}

export function makeVerifier(key: Buffer): EncryptedBlob {
  return encrypt(key, VERIFIER_PLAINTEXT)
}

export function verifyKey(key: Buffer, verifier: EncryptedBlob): boolean {
  try {
    return decrypt(key, verifier) === VERIFIER_PLAINTEXT
  } catch {
    return false
  }
}
