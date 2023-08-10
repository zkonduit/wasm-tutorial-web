import { useState, ChangeEvent } from 'react'
import { handleGenElgamalDecryptionButton, FileDownload } from '../Utils'

interface ElgamalDecryptionProps {
  files: {
    cipher: File | null,
    sk: File | null
  }
  handleFileChange: (event: ChangeEvent<HTMLInputElement>) => void
}

export default function ElgamalDecryption({ files, handleFileChange }: ElgamalDecryptionProps) {
  const [buffer, setBuffer] = useState<Uint8Array | null>(null)
  const [decryptionResult, setDecryptionResult] = useState<string | null>(null)

  return (
    <div>
      <h1>Generate Elgamal Decryption</h1>
      <label htmlFor='elgamal_cipher'>Cipher:</label>
      <input
        id='elgamal_cipher'
        type='file'
        onChange={handleFileChange}
        placeholder='elgamal_cipher'
      />
      <label htmlFor='elgamal_sk'>Secret Key:</label>
      <input
        id='elgamal_sk'
        type='file'
        onChange={handleFileChange}
        placeholder='elgamal_sk'
      />
      <button
        id='genDecryptionButton'
        onClick={async () => {
          if (Object.values(files).every((file) => file instanceof File)) {
            const result = await handleGenElgamalDecryptionButton(
              files as { [key: string]: File },
            )
            setBuffer(result)
            setDecryptionResult(
              result
                ? 'Cipher decryption successful'
                : 'Cipher decryption failed',
            )
          }
        }}
        disabled={!Object.values(files).every((file) => file instanceof File)}
      >
        Generate
      </button>
      {buffer && (
        <FileDownload
          fileName='decrypted_cipher.txt'
          buffer={buffer}
          handleDownloadCompleted={function (): void {
            setBuffer(null)
          }}
        />
      )}
      <h2>Result:</h2>
      <div>{decryptionResult}</div>
    </div>
  )
}
