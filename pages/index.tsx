import {useRouter} from 'next/router'
import React, {useEffect, useState} from 'react'
import Layout from '../components/layout'
import {getStorage, setStorage} from './api/localstorage'
import {requestClientCreate, requestClientFetch, requestClientUpdate, requestSessionCreate, requestSessionJoinCodeFetch} from './api/sp_rest'
import {Close} from './api/sp_websocket'

export default function Home() {
  const router = useRouter()
  let [init, setInit] = useState(false)
  let [username, setUsername] = useState("")
  let [joinCode, setJoinCode] = useState("")
  let [loadingCreate, setLoadingCreate] = useState(false)
  let [loadingJoin, setLoadingJoin] = useState(false)
  let [errorMsg, setErrorMsg] = useState("")

  useEffect(() => {
    if (!init) {
      setInit(true)
      setUsername(getStorage("username"))
      const jc = new URLSearchParams(window.location.search).get("join")
      setJoinCode(jc || getStorage("joinCode"))
      Close()
      return
    }
    setStorage("username", username)
    setStorage("joinCode", joinCode)
  })

  async function createGame(_event: React.MouseEvent<HTMLButtonElement>) {
    if (username.length < 1) return

    setLoadingCreate(true)
    try {
      const newClient = await requestClientCreate(username)
      setStorage("clientId", newClient.body.id)
    } catch (e) {
      console.error("login/create-client failed", e)
      setErrorMsg("Create new session failed")
      setLoadingCreate(false)
      return
    }

    try {
      const newSession = await requestSessionCreate(getStorage("clientId"))
      setStorage("sessionId", newSession.body.id)
      setStorage("joinCode", newSession.body.joinCode)
    } catch (e) {
      console.error("login/create-session failed", e)
      setErrorMsg("Create new session failed")
      setLoadingCreate(false)
      return
    }
    setLoadingCreate(false)
    router.push("/game")
  }

  async function joinGame(_event: React.MouseEvent<HTMLButtonElement>) {
    if (username.length < 1 || joinCode.length < 6) return
    setLoadingJoin(true)

    try {
      const session = await requestSessionJoinCodeFetch(joinCode)
      setStorage("sessionId", session.body.id)
    } catch (e) {
      console.error("login/join-session failed", e)
      setErrorMsg("Unknown join code")
      setLoadingJoin(false)
      return
    }

    if (getStorage("clientId").length > 0) {
      try {
        await requestClientFetch(getStorage("clientId"))
        await requestClientUpdate(getStorage("clientId"), username, getStorage("sessionId"))
      } catch (e) {
        console.info("login/fetch-client failed", e)
        setStorage("clientId", "")
      }
    }
    if (getStorage("clientId").length < 1) {
      try {
        const newClient = await requestClientCreate(username)
        setStorage("clientId", newClient.body.id)
      } catch (e) {
        console.error("login/create-client failed", e)
        setErrorMsg("Create new client failed")
        setLoadingJoin(false)
        return
      }
    }

    setLoadingJoin(false)
    router.push("/game")
  }

  return (
    <Layout title="Login">
      <>
        <div className="hero">
          <div className="hero-content grid justify-items-center">
            <div className="card w-full max-w-sm shadow-2xl bg-primary">
              <div className="card-body px-12">
                <div className="form-control">
                  <label className="label">
                    <span className="label-text">Name</span>
                  </label>
                  <input
                    type="text"
                    placeholder="Name"
                    className={`input input-bordered input-sm ${username.length < 1 && "btn-error btn-outline"}`}
                    value={username}
                    onChange={event => setUsername(event.target.value)} />
                </div>
                <div className="form-control">
                  <label className="label">
                    <span className="label-text">Join Code</span>
                  </label>
                  <input
                    type="text"
                    placeholder="Join Code"
                    className={`input input-bordered input-sm ${joinCode.length < 6 && "btn-error btn-outline"}`}
                    value={joinCode}
                    onChange={event => setJoinCode(event.target.value)} />
                </div>
                <div className="form-control mt-6">
                  <div className="flex w-full">
                    <div className="grid flex-grow">
                      <button className={`
                        btn
                        btn-accent
                        btn-sm
                        ${(
                          !username
                          || username.length < 1
                        ) && "btn-disabled"}
                        ${loadingCreate && "loading"}
                        `}
                        onClick={createGame}>Create</button>
                    </div>
                    <div className="divider divider-horizontal"></div>
                    <div className="grid flex-grow">
                      <button className={`
                        btn
                        btn-accent
                        btn-sm
                        ${(
                          !username
                          || !joinCode
                          || username.length < 1
                          || joinCode.length < 6
                        ) && "btn-disabled"}
                        ${loadingJoin && "loading"}
                        `}
                        onClick={joinGame}>Join</button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            {
              errorMsg.length > 0 &&
              <div className="alert alert-error shadow-lg">
                <div>
                  <svg xmlns="http://www.w3.org/2000/svg" className="stroke-current flex-shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                  <div>{errorMsg}</div>
                </div>
              </div>
            }
          </div>
        </div>
      </>
    </Layout>
  )
}

