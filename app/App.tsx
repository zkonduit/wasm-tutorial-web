'use client'
import React, { useEffect, useState } from 'react'

import init from '../pkg/ezkl'

import GenPK from './GenPk'
import GenVk from './GenVk'
import GenProof from './GenProof'
import Verify from './Verify'
import Hash from './Hash'

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
      <GenPK
        files={{
          model: files['model_ser_pk'],
          srs: files['srs_ser_pk'],
          circuitSettings: files['circuit_settings_ser_pk'],
        }}
        handleFileChange={handleFileChange}
      />

      <GenVk
        files={{
          pk: files['pk_ser_vk'],
          circuitSettings: files['circuit_settings_ser_vk'],
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
