// Lazy-initialized so missing env vars don't crash the module at import time
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { PayOS } = require('@payos/node')

let _instance: InstanceType<typeof PayOS> | null = null

export function getPayOS() {
  if (!_instance) {
    if (!process.env.PAYOS_CLIENT_ID || !process.env.PAYOS_API_KEY || !process.env.PAYOS_CHECKSUM_KEY) {
      throw new Error('PayOS environment variables are not configured')
    }
    _instance = new PayOS(
      process.env.PAYOS_CLIENT_ID,
      process.env.PAYOS_API_KEY,
      process.env.PAYOS_CHECKSUM_KEY
    )
  }
  return _instance
}
