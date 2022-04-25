import {useRouter} from 'next/router'
import React, { useEffect, useState} from 'react'
import Layout from '../../components/layout'
import SessionSection from '../../components/session_section'
import {getStorage} from '../api/localstorage'
import {requestClientFetch, requestSessionFetch, RestBodyClient, RestBodyHistory, RestBodySession} from '../api/sp_rest'
import {Connect, Send, WsEventMsg} from '../api/sp_websocket'
import debounce from "lodash/debounce"
import ClientSection from '../../components/client_section'
import EstimationSection from '../../components/estimation_section'
import HistorySection from '../../components/history_section'

export default function Home() {
  const router = useRouter()

  let [IsInit, setIsInit] = useState(false)
  let [Session, setSession] = useState({} as RestBodySession)
  let [Client, setClient] = useState({} as RestBodyClient)
  let [ClientList, setClientList] = useState([] as Array<RestBodyClient>)
  let [HistoryList, setHistoryList] = useState([] as Array<RestBodyHistory>)

  let [ErrorMsg, setErrorMsg] = useState("")

  useEffect(() => {
    if (!IsInit) {
      init()
    }
    return () => {
      // cleanup
      cleanupWS()
    }
  }, [])

  async function init() {
    setIsInit(true)
    const sessionId = getStorage("sessionId")
    const clientId = getStorage("clientId")
    if (!sessionId || !clientId) {
      router.push("/")
    }
    const initDataSuccess = await initData()
    if (!initDataSuccess) {
      router.push("/")
    }
    await initWS()
  }
  async function initData() {
    const sessionId = getStorage("sessionId")
    const clientId = getStorage("clientId")
    try {
      const session = await requestSessionFetch(sessionId)
      setSession(session.body)
    } catch(e) {
      console.error("game/fetch-session failed", e)
      setErrorMsg("Failed to join game session")
      return false
    }
    try {
      const client = await requestClientFetch(clientId)
      setClient(client.body)
    } catch(e) {
      console.error("game/fetch-client failed", e)
      setErrorMsg("Failed to join game client")
      return false
    }
    return true
  }
  async function cleanupWS() {
    window.removeEventListener(`websocket-event`, wsEventHandler.bind(this))
  }
  async function initWS() {
    const sessionId = getStorage("sessionId")
    const clientId = getStorage("clientId")
    Connect(clientId, sessionId)
    window.addEventListener(`websocket-event`, wsEventHandler.bind(this))
  }

  function wsEventHandler(event: WsEventMsg) {
    if (event.detail.head.action !== "update") {
      return
    }

    setSession(event.detail.body.session)
    setClient(event.detail.body.client)
    setClientList(event.detail.body.clientList)
    setHistoryList(event.detail.body.historyList)
  }

  function onDescriptionChangeHandler(description: string) {
    const s = {...Session, description}
    sendStateToServer(s, undefined)
  }
  function onCardListChangeHandler(cardSelectionList: string) {
    const s = {...Session, cardSelectionList}
    sendStateToServer(s, undefined)
  }
  function onNewGameHandler() {
    const s = {...Session, gameStatus: "new"}
    sendStateToServer(s, undefined)
  }
  function onRevealGameHandler() {
    const s = {...Session, gameStatus: "reveal"}
    sendStateToServer(s, undefined)
  }
  function onClientChangeHandler(name: string, viewer: boolean) {
    const c = {...Client, name, viewer}
    sendStateToServer(undefined, c)
  }
  function onClientEstimationChangeHandler(estimation: string) {
    const c = {...Client, estimation}
    sendStateToServer(undefined, c)
  }
  const sendStateToServer = debounce(
    function(s: RestBodySession = Session, c: RestBodyClient = Client) {
      const sessionId = getStorage("sessionId")
      const clientId = getStorage("clientId")
      Send({
        head: {
          action: "update",
          clientId,
          groupId: sessionId,
        },
        body: {
          client: c,
          session: s,
        }
      })
    },
    300
  )

  return (
    <Layout title="Game">
      <>
        <div className="flex flex-wrap justify-center">
          <div className="basis-1/2 p-2">
            <SessionSection
              Session={Session}
              Client={Client}
              onDescriptionChange={onDescriptionChangeHandler}
              onCardListChange={onCardListChangeHandler}
              onNewGame={onNewGameHandler}
              onRevealGame={onRevealGameHandler}
            />
          </div>
          <div className="basis-1/2 p-2">
            <ClientSection
              Client={Client}
              onClientChange={onClientChangeHandler}
            />
          </div>
          <div className="basis-1/2 p-2">
            <EstimationSection
              Client={Client}
              Session={Session}
              ClientList={ClientList}
              onEstimationChange={onClientEstimationChangeHandler}
            />
          </div>
          <div className="basis-1/2 p-2">
            <HistorySection
              HistoryList={HistoryList}
            />
          </div>

          {
            ErrorMsg.length > 0 &&
              <div className="alert alert-error shadow-lg">
                <div>
                  <svg xmlns="http://www.w3.org/2000/svg" className="stroke-current flex-shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                  <div>{ErrorMsg}</div>
                </div>
              </div>
          }
        </div>
      </>
    </Layout>
  )
}

