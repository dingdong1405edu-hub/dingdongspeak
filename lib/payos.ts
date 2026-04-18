// @payos/node v2 — reads PAYOS_CLIENT_ID, PAYOS_API_KEY, PAYOS_CHECKSUM_KEY from env
// Lazy init so missing env vars during build don't crash module import
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { PayOS } = require('@payos/node')

let _instance: any = null

export function getPayOS() {
  if (!_instance) {
    _instance = new PayOS()
  }
  return _instance
}
