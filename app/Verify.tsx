import { useState, ChangeEvent } from 'react'
import { handleVerifyButton } from './Utils'

interface VerifyProps {
  files: {
    proof: File | null
    vk: File | null
    circuitSettings: File | null
    srs: File | null
  }
  handleFileChange: (event: ChangeEvent<HTMLInputElement>) => void
}

export default function Verify({ files, handleFileChange }: VerifyProps) {
  const [verifyResult, setVerifyResult] = useState('')

  return (
    <div>
      <h1>Verify</h1>
      <label htmlFor='proof_js'>Proof:</label>
      <input
        id='proof_js'
        type='file'
        onChange={handleFileChange}
        placeholder='proof_js'
      />
      <label htmlFor='vk'>Verification key:</label>
      <input id='vk' type='file' onChange={handleFileChange} placeholder='vk' />
      <label htmlFor='circuit_settings_ser_verify'>Circuit settings:</label>
      <input
        id='circuit_settings_ser_verify'
        type='file'
        onChange={handleFileChange}
        placeholder='circuit_settings_ser_verify'
      />
      <label htmlFor='srs_ser_verify'>SRS:</label>
      <input
        id='srs_ser_verify'
        type='file'
        onChange={handleFileChange}
        placeholder='srs_ser_verify'
      />
      <button
        id='verifyButton'
        onClick={async () => {
          if (Object.values(files).every((file) => file instanceof File)) {
            const result = await handleVerifyButton(
              files as { [key: string]: File },
            )
            setVerifyResult(result ? 'True' : 'False')
          }
        }}
        disabled={!Object.values(files).every((file) => file instanceof File)}
      >
        Verify
      </button>
      <h2>Result:</h2>
      <div>{verifyResult}</div>
    </div>
  )
}
