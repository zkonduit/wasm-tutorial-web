import { useState, ChangeEvent } from 'react'
import { handleGenHashButton, FileDownload } from '../Utils'

interface HashProps {
  message: File | null
  handleFileChange: (event: ChangeEvent<HTMLInputElement>) => void
}

export default function Hash({ message, handleFileChange }: HashProps) {
  const [buffer, setBuffer] = useState<Uint8Array | null>(null)
  const [hashResult, setHashResult] = useState<string | null>(null)

  return (
    <div>
      <h1>Generate Hash</h1>
      <label htmlFor='message_hash'>Message:</label>
      <input
        id='message_hash'
        type='file'
        onChange={handleFileChange}
        placeholder='Message'
      />
      <button
        id='genHashButton'
        onClick={async () => {
          const result = await handleGenHashButton(message as File) // 'as' cast should be safe b/c of disabled button
          setBuffer(result)
          setHashResult(result ? `Hash: ${result}` : 'Hash Generation failed')
        }}
        disabled={!message}
      >
        Generate
      </button>
      {buffer && (
        <FileDownload
          fileName='hash.txt'
          buffer={buffer}
          handleDownloadCompleted={function (): void {
            setBuffer(null)
          }}
        />
      )}
      <h2>Result:</h2>
      <div>{hashResult}</div>
    </div>
  )
}
