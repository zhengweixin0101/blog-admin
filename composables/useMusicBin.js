export function createMusicBin(lyrics, coverWebpData) {
  const encoder = new TextEncoder()
  const lyricsBytes = encoder.encode(lyrics || '')
  const coverBytes = coverWebpData ? new Uint8Array(coverWebpData) : new Uint8Array(0)

  const binData = new Uint8Array(4 + lyricsBytes.length + coverBytes.length)
  const view = new DataView(binData.buffer)

  view.setUint32(0, lyricsBytes.length, true)
  binData.set(lyricsBytes, 4)
  binData.set(coverBytes, 4 + lyricsBytes.length)

  return new Blob([binData], { type: 'application/octet-stream' })
}

export function parseMusicBin(arrayBuffer) {
  const view = new DataView(arrayBuffer)
  const decoder = new TextDecoder('utf-8')

  const lyricsLength = view.getUint32(0, true)
  const lyrics = decoder.decode(new Uint8Array(arrayBuffer, 4, lyricsLength))

  const coverStart = 4 + lyricsLength
  const coverData = arrayBuffer.slice(coverStart)
  const hasCover = coverData.byteLength > 0

  return { lyrics, coverData: hasCover ? coverData : null }
}
