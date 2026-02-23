import { parseWorkbook } from './parse.js'

/**
 * Receives an ArrayBuffer of the xlsx file,
 * parses it off the main thread, and posts back the result.
 */
self.onmessage = (e) => {
  try {
    const data = parseWorkbook(e.data)
    self.postMessage({ ok: true, data })
  } catch (err) {
    self.postMessage({ ok: false, err: err.message })
  }
}
