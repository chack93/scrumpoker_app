import {useRouter} from 'next/router'
import React, {useEffect, useState} from 'react'
import Layout from '../../components/layout'
import {getStorage} from '../api/localstorage'

export default function Home() {
  const router = useRouter()
  let [init, setInit] = useState(false)

  useEffect(() => {
    if (!init) {
      setInit(true)
      const sessionId = getStorage("sessionId")
      const clientId = getStorage("clientId")
      if (!sessionId || !clientId) {
        router.push("/")
      }
      return
    }
  })
  return (
    <Layout title="Game">
      <>
        <h1 className="text-lg mb-2">GAME</h1>
      </>
    </Layout>
  )
}

