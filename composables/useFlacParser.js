const CHUNK_SIZE = 256 * 1024

export async function parseFlacFile(file) {
  const decoder = new TextDecoder('utf-8')
  let loaded = 0
  let buffer = new Uint8Array(0)

  async function ensureBytes(need) {
    while (buffer.length < need) {
      if (loaded >= file.size) return false
      const chunk = await file.slice(loaded, loaded + CHUNK_SIZE).arrayBuffer()
      const next = new Uint8Array(buffer.length + chunk.byteLength)
      next.set(buffer)
      next.set(new Uint8Array(chunk), buffer.length)
      buffer = next
      loaded += chunk.byteLength
    }
    return true
  }

  if (!(await ensureBytes(4))) throw new Error('File too small')
  if (new DataView(buffer.buffer).getUint32(0, false) !== 0x664C6143) throw new Error('Not a FLAC file')

  let pos = 4
  let title = '', artist = '', lyrics = '', coverData = null, coverMime = ''

  while (true) {
    if (!(await ensureBytes(pos + 4))) break

    const headerByte = buffer[pos]
    const isLast = (headerByte & 0x80) !== 0
    const blockType = headerByte & 0x7F
    const blockLength = (buffer[pos + 1] << 16) | (buffer[pos + 2] << 8) | buffer[pos + 3]
    pos += 4

    if (!(await ensureBytes(pos + blockLength))) break

    const view = new DataView(buffer.buffer)
    if (blockType === 4) {
      const result = parseVorbisComment(buffer.buffer, pos, view, decoder)
      if (result.title) title = result.title
      if (result.artist) artist = result.artist
      if (result.lyrics) lyrics = result.lyrics
    } else if (blockType === 6) {
      const result = parsePictureBlock(buffer.buffer, pos, view, decoder)
      if (result.pictureType === 3 && !coverData) {
        coverData = result.data
        coverMime = result.mimeType
      }
    }

    pos += blockLength
    if (isLast) break
    if (lyrics && coverData) break
  }

  return { title, artist, lyrics, coverData, coverMime }
}

function parseVorbisComment(ab, offset, view, decoder) {
  let pos = offset
  const vendorLength = view.getUint32(pos, true)
  pos += 4 + vendorLength

  const commentCount = view.getUint32(pos, true)
  pos += 4

  let title = '', artist = '', lyrics = ''

  for (let i = 0; i < commentCount; i++) {
    if (pos + 4 > ab.byteLength) break
    const commentLength = view.getUint32(pos, true)
    if (pos + 4 + commentLength > ab.byteLength) break
    const comment = decoder.decode(new Uint8Array(ab, pos + 4, commentLength))
    pos += 4 + commentLength

    const eqIdx = comment.indexOf('=')
    if (eqIdx > 0) {
      const key = comment.slice(0, eqIdx).toUpperCase()
      const value = comment.slice(eqIdx + 1)
      if (key === 'TITLE') title = value
      else if (key === 'ARTIST') artist = value
      else if (key === 'LYRICS' || key === 'UNSYNCED LYRICS') {
        if (!lyrics) lyrics = value
      }
    }
  }

  return { title, artist, lyrics }
}

function parsePictureBlock(ab, offset, view, decoder) {
  let pos = offset
  const pictureType = view.getUint32(pos, false)
  pos += 4

  const mimeLength = view.getUint32(pos, false)
  const mimeType = decoder.decode(new Uint8Array(ab, pos + 4, mimeLength))
  pos += 4 + mimeLength

  const descLength = view.getUint32(pos, false)
  pos += 4 + descLength

  pos += 16

  const dataLength = view.getUint32(pos, false)
  pos += 4

  if (pos + dataLength > ab.byteLength) {
    return { pictureType: 0, mimeType: '', data: null }
  }

  const data = new Uint8Array(ab, pos, dataLength).slice()
  return { pictureType, mimeType, data }
}

export async function convertToWebp(imageData, mimeType, quality = 80) {
  return new Promise((resolve, reject) => {
    const blob = new Blob([imageData], { type: mimeType })
    const url = URL.createObjectURL(blob)
    const img = new Image()

    img.onload = () => {
      const canvas = document.createElement('canvas')
      canvas.width = img.width
      canvas.height = img.height
      const ctx = canvas.getContext('2d')

      if (mimeType === 'image/png' || mimeType === 'image/gif') {
        ctx.fillStyle = '#ffffff'
        ctx.fillRect(0, 0, canvas.width, canvas.height)
      }
      ctx.drawImage(img, 0, 0)

      canvas.toBlob((webpBlob) => {
        URL.revokeObjectURL(url)
        if (!webpBlob) {
          reject(new Error('WebP conversion failed'))
          return
        }
        webpBlob.arrayBuffer().then(resolve).catch(reject)
      }, 'image/webp', quality / 100)
    }

    img.onerror = () => {
      URL.revokeObjectURL(url)
      reject(new Error('Image load failed'))
    }

    img.src = url
  })
}
