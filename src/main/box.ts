import nacl from 'tweetnacl'
import crypto from 'node:crypto'

// E2E 공유용 공개키 암호화 (Curve25519, tweetnacl box).
// 키쌍은 계정 키에서 결정적으로 파생 → 같은 마스터 비번이면 어느 기기에서도 동일.
// 서버에는 공개키만 등록, 개인키는 어디에도 저장하지 않음(매번 파생).

export interface BoxPayload {
  ephPub: string
  nonce: string
  ct: string
}

function b64e(u: Uint8Array): string {
  return Buffer.from(u).toString('base64')
}
function b64d(s: string): Uint8Array {
  return new Uint8Array(Buffer.from(s, 'base64'))
}

export function deriveBoxKeyPair(accountKey: Buffer): nacl.BoxKeyPair {
  const seed = crypto
    .createHash('sha256')
    .update(Buffer.concat([accountKey, Buffer.from('mylogin-box-v1')]))
    .digest()
  return nacl.box.keyPair.fromSecretKey(new Uint8Array(seed))
}

export function boxPublicKeyB64(pair: nacl.BoxKeyPair): string {
  return b64e(pair.publicKey)
}

// 수신자 공개키(base64)로 암호화 (익명 발신 — 임시 키쌍 사용)
export function boxEncryptFor(recipientPubB64: string, plaintext: string): BoxPayload {
  const eph = nacl.box.keyPair()
  const nonce = nacl.randomBytes(nacl.box.nonceLength)
  const msg = new TextEncoder().encode(plaintext)
  const ct = nacl.box(msg, nonce, b64d(recipientPubB64), eph.secretKey)
  return { ephPub: b64e(eph.publicKey), nonce: b64e(nonce), ct: b64e(ct) }
}

export function boxDecrypt(payload: BoxPayload, secretKey: Uint8Array): string | null {
  try {
    const opened = nacl.box.open(b64d(payload.ct), b64d(payload.nonce), b64d(payload.ephPub), secretKey)
    if (!opened) return null
    return new TextDecoder().decode(opened)
  } catch {
    return null
  }
}
