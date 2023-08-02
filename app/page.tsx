'use client'
import dynamic from 'next/dynamic'
import React from 'react'

const App = dynamic(() => import('./App'), { ssr: false })
const TestScript = dynamic(() => import('./WASMTests'), { ssr: false }) // Assuming this component uses browser-only APIs

function Home() {
  const isTest = process.env.NEXT_PUBLIC_REACT_APP_ENTRY_POINT === 'test'

  return <React.Fragment>{isTest ? <TestScript /> : <App />}</React.Fragment>
}

export default Home
