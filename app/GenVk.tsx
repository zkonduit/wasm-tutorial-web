import { useState, ChangeEvent } from 'react'
import { handleGenVkButton, FileDownload } from './Utils'

interface GenVKProps {
  files: {
    pk: File | null
    circuitSettings: File | null
  }
  handleFileChange: (event: ChangeEvent<HTMLInputElement>) => void
}

export default function GenVk({ files, handleFileChange }: GenVKProps) {
  const [vkResult, setVkResult] = useState('')
  const [buffer, setBuffer] = useState<Uint8Array | null>(null)
  return (
    <div>
      <h1>Generate Verification Key</h1>
      <label htmlFor='pk_ser_vk'>Proving key:</label>
      <input
        id='pk_ser_vk'
        type='file'
        onChange={handleFileChange}
        placeholder='pk_ser_vk'
      />
      <label htmlFor='circuit_settings_ser_vk'>Circuit settings:</label>
      <input
        id='circuit_settings_ser_vk'
        type='file'
        onChange={handleFileChange}
        placeholder='circuit_settings_ser_vk'
      />
      <button
        id='genVkButton'
        onClick={async () => {
          if (Object.values(files).every((file) => file instanceof File)) {
            const result = await handleGenVkButton(
              files as { [key: string]: File },
            )
            setBuffer(result)
            setVkResult(
              result ? 'Vk Generation successful' : 'Vk Generation failed',
            )
          }
        }}
        disabled={!Object.values(files).every((file) => file instanceof File)}
      >
        Generate
      </button>
      {buffer && (
        <FileDownload
          fileName='vk.key'
          buffer={buffer}
          handleDownloadCompleted={function (): void {
            setBuffer(null)
          }}
        />
      )}
      <h2>Result:</h2>
      <div>{vkResult}</div>
    </div>
  )
}
