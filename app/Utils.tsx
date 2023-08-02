import { useEffect, useRef } from 'react'
import { genPk, genVk, prove, poseidonHash, verify } from '../pkg/ezkl.js'

export function readUploadedFileAsText(file: File) {
  return new Promise<Uint8ClampedArray>((resolve, reject) => {
    const reader = new FileReader()

    reader.onload = (event) => {
      if (event.target && event.target.result instanceof ArrayBuffer) {
        resolve(new Uint8ClampedArray(event.target.result))
      } else {
        reject(new Error('Failed to read file'))
      }
    }

    reader.onerror = (error) => {
      reject(new Error('File could not be read: ' + error))
    }

    reader.readAsArrayBuffer(file)
  })
}

interface FileDownloadProps {
  fileName: string
  buffer: Uint8Array | null
  handleDownloadCompleted: () => void
}

export function FileDownload({
  fileName,
  buffer,
  handleDownloadCompleted,
}: FileDownloadProps) {
  const linkRef = useRef<HTMLAnchorElement | null>(null)

  useEffect(() => {
    if (!buffer) {
      return
    }

    const blob = new Blob([buffer], { type: 'application/octet-stream' })
    const reader = new FileReader()

    // Convert the Blob to a Data URL
    reader.readAsDataURL(blob)

    reader.onloadend = () => {
      const base64data = reader.result

      // Use the fetch API to download the file
      fetch(base64data as string)
        .then((res) => res.blob())
        .then((blob) => {
          const url = URL.createObjectURL(blob)

          if (linkRef.current) {
            linkRef.current.href = url
            linkRef.current.download = fileName
            linkRef.current.click()

            // Cleanup
            URL.revokeObjectURL(url)

            // Notify the parent component that the download operation is complete
            handleDownloadCompleted()
          }
        })
    }
  }, [buffer, fileName, handleDownloadCompleted])

  return <a ref={linkRef} style={{ display: 'none' }} />
}

type FileMapping = {
  [key: string]: File
}

type FileSerMapping = {
  [key: string]: Uint8ClampedArray
}

async function convertFilesToFilesSer<T extends FileMapping>(
  files: T,
): Promise<FileSerMapping> {
  const fileReadPromises = Object.entries(files).map(async ([key, file]) => {
    const fileContent = await readUploadedFileAsText(file)
    return { key, fileContent }
  })

  const fileContents = await Promise.all(fileReadPromises)

  const filesSer: FileSerMapping = {}
  for (const { key, fileContent } of fileContents) {
    filesSer[key] = fileContent
  }

  return filesSer
}

export async function handleGenPkButton<T extends FileMapping>(
  files: T,
): Promise<Uint8Array> {
  const result = await convertFilesToFilesSer(files)
  return genPk(result['model'], result['srs'], result['circuitSettings'])
}

export async function handleGenProofButton<T extends FileMapping>(
  files: T,
): Promise<Uint8Array> {
  const result = await convertFilesToFilesSer(files)
  return prove(
    result['data'],
    result['pk'],
    result['model'],
    result['circuitSettings'],
    result['srs'],
  )
}

export async function handleGenVkButton<T extends FileMapping>(
  files: T,
): Promise<Uint8Array> {
  const result = await convertFilesToFilesSer(files)
  return genVk(result['pk'], result['circuitSettings'])
}

export async function handleGenHashButton(message: File): Promise<Uint8Array> {
  const message_hash = await readUploadedFileAsText(message)
  return poseidonHash(message_hash)
}

export async function handleVerifyButton<T extends FileMapping>(
  files: T,
): Promise<boolean> {
  const result = await convertFilesToFilesSer(files)
  return verify(
    result['proof'],
    result['vk'],
    result['circuitSettings'],
    result['srs'],
  )
}
