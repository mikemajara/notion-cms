// import imageSize from "image-size"
import { NotionCMSConfig } from "../config"

export interface FileInfo {
  name: string
  url: string
  type?: "external" | "file"
  expiry_time?: string
}

export interface FileStrategy {
  processFileUrl(url: string, fileName: string): Promise<string>
}

export class DirectStrategy implements FileStrategy {
  async processFileUrl(url: string, _fileName: string): Promise<string> {
    return url
  }
}

export class LocalStrategy implements FileStrategy {
  private config: NotionCMSConfig["files"]

  constructor(config: NotionCMSConfig["files"]) {
    this.config = config
  }

  async processFileUrl(url: string, fileName: string): Promise<string> {
    try {
      const fileId = generateFileId(url)
      const extension = getFileExtension(fileName)
      const stableFileName = `${fileId}${extension}`

      const storage = await this.createStorage()

      if (await storage.exists(stableFileName)) {
        return storage.getPublicUrl(stableFileName)
      }

      const { downloadFile } = await import("../utils/file-utils")
      const fileData = await downloadFile(url)
      // TODO: Add dimensions to the file info
      // const dimensions = imageSize(fileData)

      await storage.store(stableFileName, fileData)

      return storage.getPublicUrl(stableFileName)
    } catch (error) {
      console.warn(`Failed to cache file locally: ${fileName} from ${url}`, {
        fileName,
        url,
        error: error instanceof Error ? error.message : String(error)
      })
      return url
    }
  }

  private async createStorage(): Promise<any> {
    const { LocalStorage } = await import("../storage/s3-storage")
    const storagePath =
      this.config?.storage?.path || "./public/assets/notion-files"
    return new LocalStorage(storagePath)
  }
}

export class RemoteStrategy implements FileStrategy {
  private config: NotionCMSConfig["files"]

  constructor(config: NotionCMSConfig["files"]) {
    this.config = config
  }

  async processFileUrl(url: string, fileName: string): Promise<string> {
    if (!this.config?.storage) {
      return url
    }

    try {
      const fileId = generateFileId(url)
      const extension = getFileExtension(fileName)
      const bucketPath = this.config.storage.path || ""
      const stableFileName = bucketPath
        ? `${bucketPath}${fileId}${extension}`
        : `${fileId}${extension}`

      const storage = await this.createStorage()

      if (await storage.exists(stableFileName)) {
        return storage.getPublicUrl(stableFileName)
      }

      const { downloadFile } = await import("../utils/file-utils")
      const fileData = await downloadFile(url)
      await storage.store(stableFileName, fileData)

      return storage.getPublicUrl(stableFileName)
    } catch (error) {
      console.warn(`Failed to store file remotely: ${fileName} from ${url}`, {
        fileName,
        url,
        error: error instanceof Error ? error.message : String(error)
      })
      return url
    }
  }

  private async createStorage(): Promise<any> {
    if (!this.config?.storage) {
      throw new Error(
        "S3 storage configuration is required for remote strategy"
      )
    }

    const { S3Storage } = await import("../storage/s3-storage")
    return new S3Storage({
      endpoint: this.config.storage.endpoint,
      bucket: this.config.storage.bucket || "default-bucket",
      accessKey: this.config.storage.accessKey,
      secretKey: this.config.storage.secretKey,
      region: this.config.storage.region
    })
  }
}

export class FileManager {
  private strategy: FileStrategy

  constructor(config: NotionCMSConfig) {
    const fileConfig = config.files

    switch (fileConfig?.strategy) {
      case "local":
        this.strategy = new LocalStrategy(fileConfig)
        break
      case "remote":
        this.strategy = new RemoteStrategy(fileConfig)
        break
      case "direct":
      default:
        this.strategy = new DirectStrategy()
        break
    }
  }

  isCacheEnabled(): boolean {
    return (
      this.strategy instanceof LocalStrategy ||
      this.strategy instanceof RemoteStrategy
    )
  }

  async processFileUrl(url: string, fileName: string): Promise<string> {
    return this.strategy.processFileUrl(url, fileName)
  }

  async processFileInfoArray(files: FileInfo[]): Promise<FileInfo[]> {
    return Promise.all(
      files.map(async (file) => {
        const processedUrl = await this.processFileUrl(file.url, file.name)
        return {
          ...file,
          url: processedUrl
        }
      })
    )
  }

  extractFileUrl(file: any): string {
    if (file.type === "external") {
      return file.external.url
    } else if (file.type === "file") {
      return file.file.url
    }
    return ""
  }

  createFileInfo(file: any): FileInfo {
    return {
      name: file.name,
      url: this.extractFileUrl(file),
      type: file.type,
      ...(file.type === "file" && { expiry_time: file.file.expiry_time })
    }
  }
}

export function generateFileId(notionUrl: string): string {
  const matches = notionUrl.match(/([a-f0-9-]{36})/g)

  if (matches && matches.length >= 2) {
    const fileId = matches[1].replace(/-/g, "")
    return fileId
  } else if (matches && matches.length === 1) {
    const fileId = matches[0].replace(/-/g, "")
    return fileId
  }

  let hash = 0
  for (let i = 0; i < notionUrl.length; i++) {
    const char = notionUrl.charCodeAt(i)
    hash = (hash << 5) - hash + char
    hash = hash & hash
  }
  return Math.abs(hash).toString(16)
}

export function getFileExtension(fileNameOrUrl: string): string {
  const match = fileNameOrUrl.match(/\.([a-zA-Z0-9]+)(?:\?|$)/)
  return match ? `.${match[1]}` : ""
}

export function detectFileType(fileName: string): string {
  const extension = getFileExtension(fileName).toLowerCase()

  const imageTypes = [".jpg", ".jpeg", ".png", ".gif", ".webp", ".svg"]
  const documentTypes = [".pdf", ".doc", ".docx", ".txt", ".md"]
  const videoTypes = [".mp4", ".mov", ".avi", ".mkv"]
  const audioTypes = [".mp3", ".wav", ".m4a", ".aac"]

  if (imageTypes.includes(extension)) return "image"
  if (documentTypes.includes(extension)) return "document"
  if (videoTypes.includes(extension)) return "video"
  if (audioTypes.includes(extension)) return "audio"

  return "file"
}
