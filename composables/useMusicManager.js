import { S3Client, GetObjectCommand, PutObjectCommand, ListObjectsV2Command, DeleteObjectCommand } from '@aws-sdk/client-s3'
import { Upload } from "@aws-sdk/lib-storage"
import { parseFlacFile, convertToWebp } from './useFlacParser.js'
import { createMusicBin } from './useMusicBin.js'

const MUSIC_LIST_KEY = 'music/music_list.json'
const OLD_CDN_BASE = 'https://raw.githubusercontent.com/zhengweixin0101/CDN/refs/heads/music'

function safeName(s) {
  return s.replace(/\//g, '_').replace(/\\/g, '_').trim()
}

function parseKey(key) {
  const lastDash = key.lastIndexOf('-')
  if (lastDash === -1) return { title: key, artist: '' }
  return {
    title: key.substring(0, lastDash),
    artist: key.substring(lastDash + 1)
  }
}

export function useMusicManager() {
  function getS3Client(cfg) {
    return new S3Client({
      region: cfg.region,
      endpoint: cfg.endpoint,
      credentials: {
        accessKeyId: cfg.accessKeyId,
        secretAccessKey: cfg.secretAccessKey
      }
    })
  }

  async function getMusicList(cfg) {
    try {
      const client = getS3Client(cfg)
      const res = await client.send(new GetObjectCommand({
        Bucket: cfg.bucket,
        Key: MUSIC_LIST_KEY
      }))
      const text = await res.Body.transformToString()
      return JSON.parse(text)
    } catch (e) {
      if (e.name === 'NoSuchKey' || e.$metadata?.httpStatusCode === 404) {
        return []
      }
      throw e
    }
  }

  async function getMusicListFromFiles(cfg) {
    const files = await listMusicFiles(cfg)
    const flacFiles = files.filter(f => f.key.endsWith('.flac'))
    const sizeMap = {}
    for (const f of files) {
      const name = f.key.split('/').pop()
      const match = name.match(/^(.+)\.(flac|bin)$/)
      if (match) {
        const songKey = match[1]
        if (!sizeMap[songKey]) sizeMap[songKey] = 0
        sizeMap[songKey] += f.size || 0
      }
    }
    return flacFiles.map(f => {
      const name = f.key.split('/').pop().replace(/\.flac$/i, '')
      const { title, artist } = parseKey(name)
      return {
        title,
        artist,
        key: name,
        size: sizeMap[name] || 0
      }
    }).sort((a, b) => a.title.localeCompare(b.title, 'zh-CN'))
  }

  async function saveMusicList(list, cfg) {
    const client = getS3Client(cfg)
    await client.send(new PutObjectCommand({
      Bucket: cfg.bucket,
      Key: MUSIC_LIST_KEY,
      Body: JSON.stringify(list, null, 2),
      ContentType: 'application/json'
    }))
  }

  async function listMusicFiles(cfg) {
    const client = getS3Client(cfg)
    const allFiles = []
    let continuationToken = undefined

    do {
      const params = { Bucket: cfg.bucket, Prefix: 'music/' }
      if (continuationToken) params.ContinuationToken = continuationToken

      const res = await client.send(new ListObjectsV2Command(params))
      for (const f of (res.Contents || [])) {
        allFiles.push({
          key: f.Key,
          size: f.Size,
          lastModified: f.LastModified
        })
      }
      continuationToken = res.IsTruncated ? res.NextContinuationToken : undefined
    } while (continuationToken)

    return allFiles
  }

  async function deleteMusicFile(key, cfg) {
    const client = getS3Client(cfg)
    await client.send(new DeleteObjectCommand({
      Bucket: cfg.bucket,
      Key: key
    }))
  }

  async function processFlacFile(file, cfg, onProgress) {
    const metadata = await parseFlacFile(file)

    const title = metadata.title || file.name.replace(/\.flac$/i, '')
    const artist = metadata.artist || 'Unknown Artist'
    const key = safeName(`${title}-${artist}`)

    let coverWebpData = null
    if (metadata.coverData) {
      try {
        coverWebpData = await convertToWebp(metadata.coverData, metadata.coverMime, 80)
      } catch (e) {
        console.warn('Cover conversion failed:', e)
      }
    }

    const binBlob = createMusicBin(metadata.lyrics, coverWebpData)

    const client = getS3Client(cfg)

    const flacKey = `music/music/${key}.flac`
    onProgress && onProgress('flac', 0)
    const flacUpload = new Upload({
      client,
      params: {
        Bucket: cfg.bucket,
        Key: flacKey,
        Body: file,
        ContentType: 'audio/flac'
      }
    })
    flacUpload.on('httpUploadProgress', (progress) => {
      const percent = Math.round((progress.loaded / progress.total) * 100)
      onProgress && onProgress('flac', percent)
    })
    await flacUpload.done()

    const binKey = `music/meta/${key}.bin`
    onProgress && onProgress('bin', 0)
    const binUpload = new Upload({
      client,
      params: {
        Bucket: cfg.bucket,
        Key: binKey,
        Body: binBlob,
        ContentType: 'application/octet-stream'
      }
    })
    binUpload.on('httpUploadProgress', (progress) => {
      const percent = Math.round((progress.loaded / progress.total) * 100)
      onProgress && onProgress('bin', percent)
    })
    await binUpload.done()

    return { title, artist, key }
  }

  async function uploadMusic(files, cfg, onProgress) {
    const results = []

    for (const file of files) {
      const result = await processFlacFile(file, cfg, onProgress)
      results.push(result)
    }

    await syncMusicList(cfg)
    return results
  }

  async function deleteMusic(item, cfg) {
    const key = safeName(`${item.title}-${item.artist}`)
    await deleteMusicFile(`music/music/${key}.flac`, cfg)
    await deleteMusicFile(`music/meta/${key}.bin`, cfg)
    await syncMusicList(cfg)
  }

  async function syncMusicList(cfg) {
    const songs = await getMusicListFromFiles(cfg)
    const list = songs.map(s => ({ title: s.title, artist: s.artist }))
    await saveMusicList(list, cfg)
  }

  async function checkAndCreateMissingBins(cfg, customDomain, onProgress) {
    const list = await getMusicListFromFiles(cfg)
    const results = { total: list.length, created: 0, skipped: 0, failed: 0, details: [] }

    const baseUrl = customDomain
      ? `${customDomain}music/meta/`
      : `${cfg.endpoint || ''}/${cfg.bucket || ''}/music/meta/`

    for (let i = 0; i < list.length; i++) {
      const item = list[i]
      const key = safeName(`${item.title}-${item.artist}`)
      const binUrl = `${baseUrl}${key}.bin`

      onProgress && onProgress(i + 1, list.length, item.title)

      try {
        const res = await fetch(binUrl, { method: 'HEAD' })
        if (res.ok) {
          results.skipped++
          continue
        }
      } catch {
      }

      try {
        let lyrics = ''
        let coverData = null

        try {
          const lyricsUrl = `${OLD_CDN_BASE}/meta/${key}/lyrics.lrc`
          const lyricsRes = await fetch(lyricsUrl)
          if (lyricsRes.ok) {
            lyrics = await lyricsRes.text()
          }
        } catch {
        }

        try {
          const coverUrl = `${OLD_CDN_BASE}/meta/${key}/cover.webp`
          const coverRes = await fetch(coverUrl)
          if (coverRes.ok) {
            const ab = await coverRes.arrayBuffer()
            coverData = new Uint8Array(ab)
          }
        } catch {
        }

        const binBlob = createMusicBin(lyrics, coverData)
        const client = getS3Client(cfg)
        const binKey = `music/meta/${key}.bin`

        const upload = new Upload({
          client,
          params: {
            Bucket: cfg.bucket,
            Key: binKey,
            Body: binBlob,
            ContentType: 'application/octet-stream'
          }
        })
        await upload.done()

        results.created++
        results.details.push({ title: item.title, artist: item.artist, status: 'created' })
      } catch (e) {
        results.failed++
        results.details.push({ title: item.title, artist: item.artist, status: 'failed', error: e.message })
      }
    }

    return results
  }

  return {
    getMusicList,
    getMusicListFromFiles,
    listMusicFiles,
    uploadMusic,
    deleteMusic,
    syncMusicList,
    checkAndCreateMissingBins
  }
}
