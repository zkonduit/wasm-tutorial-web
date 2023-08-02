import { useState, useEffect, FC } from 'react'
import init from '../pkg/ezkl'
import {
  handleGenPkButton,
  handleGenVkButton,
  handleGenProofButton,
  handleVerifyButton,
  handleGenHashButton,
} from './Utils'

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
    if (files['test.onnx'] && files['kzg'] && files['settings.json']) {
      try {
        const result = handleGenPkButton({
          modelFile: files['test.onnx'],
          srsFile: files['kzg'],
          circuitSettingsFile: files['settings.json'],
        })
        setResults((prevResults) => ({
          ...prevResults,
          pkResult: `Test passed, ${result}`,
        }))
      } catch (error) {
        console.error(error)
        setResults((prevResults) => ({
          ...prevResults,
          pkResult: 'GenPk test failed',
        }))
      }
    }
  }, [files])

  useEffect(() => {
    if (files['test.provekey'] && files['settings.json']) {
      try {
        const result = handleGenVkButton({
          pkFile: files['test.provekey'],
          circuitSettingsFile: files['settings.json'],
        })
        setResults((prevResults) => ({
          ...prevResults,
          vkResult: `Test passed, ${result}`,
        }))
      } catch (error) {
        console.error(error)
        setResults((prevResults) => ({
          ...prevResults,
          vkResult: 'GenProof test failed',
        }))
      }
    }
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
      <h2>GenPK Test result:</h2>
      <div>{results.pkResult}</div>
      <h2>GenVK Test result:</h2>
      <div>{results.vkResult}</div>
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
