import { useState, ChangeEvent } from 'react'
import { FileDownload, handleGenPkButton } from './Utils'

interface GenPKProps {
  files: {
    model: File | null
    srs: File | null
    circuitSettings: File | null
  }
  handleFileChange: (event: ChangeEvent<HTMLInputElement>) => void
}

export default function GenPK({ files, handleFileChange }: GenPKProps) {
  const [buffer, setBuffer] = useState<Uint8Array | null>(null)
  const [pkResult, setPkResult] = useState<string>('')

  return (
    <div>
      <h1>Generate Proving Key</h1>
      <label htmlFor='model_ser_pk'>Model (.onnx):</label>
      <input
        id='model_ser_pk'
        type='file'
        onChange={handleFileChange}
        placeholder='model_ser_pk'
      />
      <label htmlFor='srs_ser_pk'>SRS:</label>
      <input
        id='srs_ser_pk'
        type='file'
        onChange={handleFileChange}
        placeholder='srs_ser_pk'
      />
      <label htmlFor='circuit_settings_ser_pk'>Circuit settings:</label>
      <input
        id='circuit_settings_ser_pk'
        type='file'
        onChange={handleFileChange}
        placeholder='circuit_settings_ser_pk'
      />
      <button
        id='genPkButton'
        onClick={async () => {
          if (Object.values(files).every((file) => file instanceof File)) {
            const result = await handleGenPkButton(
              files as { [key: string]: File },
            )
            setBuffer(result)
            setPkResult(
              result ? 'Pk Generation Successful' : 'Pk Generation failed',
            )
          }
        }}
        disabled={!Object.values(files).every((file) => file instanceof File)}
      >
        Generate
      </button>
      {buffer && (
        <FileDownload
          fileName='pk.key'
          buffer={buffer}
          handleDownloadCompleted={function (): void {
            setBuffer(null)
          }}
        />
      )}
      <h2>Result:</h2>
      <div>{pkResult}</div>
    </div>
  )
}
