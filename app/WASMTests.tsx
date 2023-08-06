import { useState, useEffect, FC } from 'react'
import init from '../pkg/ezkl'
import {
  handleGenREVButton,
  handleGenElgamalEncryptionButton,
  handleGenElgamalDecryptionButton,
  handleGenProofButton,
  handleVerifyButton,
  handleGenHashButton,
} from './Utils'
import JSONBig from 'json-bigint'

const filesNames = [
  'test.onnx',
  'kzg',
  'settings.json',
  'test.provekey',
  'test.witness.json',
  'test.proof',
  'test.key',
  'message',
]

interface IFiles {
  [key: string]: File
}

interface IResults {
  [key: string]: string
}

const TestScript: FC = () => {
  const [files, setFiles] = useState<IFiles>({})
  const [results, setResults] = useState<IResults>({})

  useEffect(() => {
    async function run() {
      // Initialize the WASM module
      await init()

      // Load files
      filesNames.forEach((fileName) => {
        fetch(`/data/${fileName}`)
          .then((res) => res.blob())
          .then((blob) =>
            setFiles((prevFiles) => ({
              ...prevFiles,
              [fileName]: new File([blob], fileName),
            })),
          )
      })
    }
    run()
  }, [])

  useEffect(() => {
    async function runEncryptionDecryptionTests() {
      try {
        // Generate a random Elgamal variable
        const revArrayBuffer = handleGenREVButton()
        const revResultString = new TextDecoder().decode(revArrayBuffer)
        const revResult = JSONBig.parse(revResultString)
        
        // Create Blob and then File objects from the keys
        const pkBlob = new Blob([revResult.pk], { type: "text/plain" });
        const rBlob = new Blob([revResult.r], { type: "text/plain" });
        const skBlob = new Blob([revResult.sk], { type: "text/plain" });
        
        const pkFile = new File([pkBlob], "pk.txt");
        const rFile = new File([rBlob], "r.txt");
        const skFile = new File([skBlob], "sk.txt");
  
        // Encrypt the message
        const encryptedMessageArrayBuffer = await handleGenElgamalEncryptionButton({
          pk: pkFile,
          message: files['message'],
          r: rFile,
        })
  
        // Convert Uint8Array to Blob then to File for decryption
        const encryptedMessageBlob = new Blob([encryptedMessageArrayBuffer], { type: "text/plain" });
        const encryptedMessageFile = new File([encryptedMessageBlob], "encrypted.txt");
  
        // Decrypt the message
        const decryptedMessage = await handleGenElgamalDecryptionButton({
          cipher: encryptedMessageFile,
          sk: skFile,
        })
  
        // Verify that the decrypted message matches the original message
        const isDecryptionSuccessful = decryptedMessage.toString() === files['message'].toString()
  
        setResults((prevResults) => ({
          ...prevResults,
          elgamalEncryptionResult: isDecryptionSuccessful ? 'Test passed, encryption successful' : 'Test failed, encryption unsuccessful',
          elgamalDecryptionResult: isDecryptionSuccessful ? 'Test passed, decryption successful' : 'Test failed, decryption unsuccessful',
        }))
      } catch (error) {
        console.error(error)
        setResults((prevResults) => ({
          ...prevResults,
          elgamalEncryptionResult: 'GenElgamalEncryption test failed',
          elgamalDecryptionResult: 'GenElgamalDecryption test failed',
        }))
      }
    }
  
    runEncryptionDecryptionTests()
  }, [files])
  useEffect(() => {
    if (
      files['test.witness.json'] &&
      files['test.provekey'] &&
      files['test.onnx'] &&
      files['settings.json'] &&
      files['kzg']
    ) {
      try {
        const result = handleGenProofButton({
          dataFile: files['test.witness.json'],
          pkFile: files['test.provekey'],
          modelFile: files['test.onnx'],
          circuitSettingsFile: files['settings.json'],
          srsFile: files['kzg'],
        })
        setResults((prevResults) => ({
          ...prevResults,
          proofResult: `Test passed, ${result}`,
        }))
      } catch (error) {
        console.error(error)
        setResults((prevResults) => ({
          ...prevResults,
          proofResult: 'GenProof test failed',
        }))
      }
    }
  }, [files])

  useEffect(() => {
    if (
      files['test.proof'] &&
      files['test.key'] &&
      files['settings.json'] &&
      files['kzg']
    ) {
      try {
        const result = handleVerifyButton({
          proofFile: files['test.proof'],
          vkFile: files['test.key'],
          circuitSettingsFile: files['settings.json'],
          srsFile: files['kzg'],
        })
        setResults((prevResults) => ({
          ...prevResults,
          verifyResult: `Test passed, ${result}`,
        }))
      } catch (error) {
        console.error(error)
        setResults((prevResults) => ({
          ...prevResults,
          verifyResult: 'Verify test failed',
        }))
      }
    }
  }, [files])

  useEffect(() => {
    if (files['message']) {
      try {
        const result = handleGenHashButton(files['message'])
        setResults((prevResults) => ({
          ...prevResults,
          hashResult: `Test passed, ${result}`,
        }))
      } catch (error) {
        console.error(error)
        setResults((prevResults) => ({
          ...prevResults,
          hashResult: 'GenHash test failed',
        }))
      }
    }
  }, [files])

  return (
    <div>
      <h1>Test script</h1>
      <h2>GenProof Test result:</h2>
      <div>{results.proofResult}</div>
      <h2>Verify Test result:</h2>
      <div id='verifyResult'>{results.verifyResult}</div>
      <h2>Hash Test result:</h2>
      <div id='hashResult'>{results.hashResult}</div>
    </div>
  )
}

export default TestScript
