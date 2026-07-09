import { S3Client, GetObjectCommand, PutObjectCommand, ListObjectsV2Command, DeleteObjectCommand } from '@aws-sdk/client-s3'
import { Upload } from "@aws-sdk/lib-storage"
import { parseFlacFile, convertToWebp } from './useFlacParser.js'
import { createMusicBin } from './useMusicBin.js'

const MUSIC_LIST_KEY = 'music/music_list.json'

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
    try {
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
    } catch (e) {
      console.warn('Bin upload failed:', e)
    }

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
    const existingList = await getMusicList(cfg)
    const currentSongs = await getMusicListFromFiles(cfg)

    const existingKeys = new Set(existingList.map(s => `${s.title}|${s.artist}`))

    // 保留已有歌曲的原有顺序
    const finalList = existingList.filter(s =>
      currentSongs.some(cs => cs.title === s.title && cs.artist === s.artist)
    )

    // 新歌曲追加到末尾
    for (const song of currentSongs) {
      const key = `${song.title}|${song.artist}`
      if (!existingKeys.has(key)) {
        finalList.push({ title: song.title, artist: song.artist })
      }
    }

    await saveMusicList(finalList, cfg)
  }

  return {
    getMusicList,
    getMusicListFromFiles,
    listMusicFiles,
    uploadMusic,
    deleteMusic,
    syncMusicList
  }
}
