import { useState } from 'react'
import { handleGenREVButton, ElgamalZipFileDownload } from '../Utils'


export default function ElgamalRandomVar() {
  const [buffer, setBuffer] = useState<Uint8Array | null>(null)
  const [revResult, setREVResult] = useState<string | null>(null)

  return (
    <div>
      <h1>Generate Elgamal Variable</h1>
      <button
        id='genREVButton'
        onClick={() => {
          const result = handleGenREVButton() 
          setBuffer(result)
          setREVResult(result ? 'Random Elgamal Variable Generation Successful' : 'Random Elgamal Variable Generation Failed')
        }}
      >
        Generate
      </button>
      {buffer && (
        <ElgamalZipFileDownload
          fileName='elgamal_var.zip'
          buffer={buffer}
          handleDownloadCompleted={function (): void {
            setBuffer(null)
          }}
        />
      )}
      <h2>Result:</h2>
      <div>{revResult}</div>
    </div>
  )
}
