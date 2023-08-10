'use client'
import React, { useEffect, useState } from 'react'

import init from '../pkg/ezkl'

import ElgamalRandomVar from './components/ElgamalRandomVar'
import ElgamalEncrypt from './components/ElgamalEncrypt'
import ElgamalDecrypt from './components/ElgamalDecrypt'
import GenProof from './components/GenProof'
import Verify from './components/Verify'
import Hash from './components/Hash'

interface Files {
  [key: string]: File | null
}

export default function Home() {
  const [files, setFiles] = useState<Files>({})

  useEffect(() => {
    async function run() {
      // Initialize the WASM module
      await init()
    }
    run()
  })

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const id = event.target.id
    const file = event.target.files?.item(0) || null
    setFiles((prevFiles) => ({ ...prevFiles, [id]: file }))
  }

  return (
    <div className='App'>
      <ElgamalRandomVar/>  

      <ElgamalEncrypt
        files={{
          pk: files['elgamal_pk'],
          message: files['elgamal_message'],
          r: files['elgamal_r']
        }}
        handleFileChange={handleFileChange}
      />

      <ElgamalDecrypt
        files={{
          sk: files['elgamal_sk'],
          cipher: files['elgamal_cipher']
        }}
        handleFileChange={handleFileChange}
      />     

      <GenProof
        files={{
          data: files['data_prove'],
          pk: files['pk_prove'],
          model: files['model_ser_prove'],
          circuitSettings: files['circuit_settings_ser_prove'],
          srs: files['srs_ser_prove'],
        }}
        handleFileChange={handleFileChange}
      />

      <Verify
        files={{
          proof: files['proof_js'],
          vk: files['vk'],
          circuitSettings: files['circuit_settings_ser_verify'],
          srs: files['srs_ser_verify'],
        }}
        handleFileChange={handleFileChange}
      />

      <Hash
        message={files['message_hash']}
        handleFileChange={handleFileChange}
      />
    </div>
  )
}
