import { useState, ChangeEvent } from 'react'
import { handleGenProofButton, FileDownload } from '../Utils'

interface GenProofProps {
  files: {
    data: File | null
    pk: File | null
    model: File | null
    circuitSettings: File | null
    srs: File | null
  }
  handleFileChange: (event: ChangeEvent<HTMLInputElement>) => void
}

export default function GenProof({ files, handleFileChange }: GenProofProps) {
  const [proofResult, setProofResult] = useState('')
  const [buffer, setBuffer] = useState<Uint8Array | null>(null)
  return (
    <div>
      <h1>Prove</h1>
      <label htmlFor='data_prove'>Input Data:</label>
      <input
        id='data_prove'
        type='file'
        onChange={handleFileChange}
        placeholder='data_prove'
      />
      <label htmlFor='pk_prove'>Proving key:</label>
      <input
        id='pk_prove'
        type='file'
        onChange={handleFileChange}
        placeholder='pk_prove'
      />
      <label htmlFor='model_ser_prove'>Model (.onnx):</label>
      <input
        id='model_ser_prove'
        type='file'
        onChange={handleFileChange}
        placeholder='model_ser'
      />
      <label htmlFor='circuit_settings_ser_prove'>Circuit settings:</label>
      <input
        id='circuit_settings_ser_prove'
        type='file'
        onChange={handleFileChange}
        placeholder='circuit_settings_ser_prove'
      />
      <label htmlFor='srs_ser_prove'>SRS:</label>
      <input
        id='srs_ser_prove'
        type='file'
        onChange={handleFileChange}
        placeholder='srs_ser_prove'
      />
      <button
        id='genProofButton'
        onClick={async () => {
          if (Object.values(files).every((file) => file instanceof File)) {
            const result = await handleGenProofButton(
              files as { [key: string]: File },
            )
            setBuffer(result)
            setProofResult(
              result
                ? 'Proof generation successful'
                : 'Proof generation failed',
            )
          }
        }}
        disabled={!Object.values(files).every((file) => file instanceof File)}
      >
        Prove
      </button>
      {buffer && (
        <FileDownload
          fileName='proof.proof'
          buffer={buffer}
          handleDownloadCompleted={function (): void {
            setBuffer(null)
          }}
        />
      )}
      <h2>Result:</h2>
      <div>{proofResult}</div>
    </div>
  )
}
