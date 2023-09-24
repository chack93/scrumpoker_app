import ReconnectingWebSocket from "reconnecting-websocket"
import {RestBodyClient, RestBodyHistory, RestBodySession} from "./sp_rest"

let connection: ReconnectingWebSocket = undefined

export type WsMsg = {
  head: WsHead
  body: WsMsgBodyUpdate
}

export interface WsEventMsg extends WsMsg {
  detail: WsMsg
}

export type WsHead = {
  action: string
  clientId: string
  groupId: string
}

export type WsMsgBodyUpdate = {
  client: RestBodyClient
  session: RestBodySession
  historyList?: Array<RestBodyHistory>
  clientList?: Array<RestBodyClient>
}

export function Send(msg: WsMsg) {
  if (!connection) {
    Connect(msg.head.clientId, msg.head.groupId)
  }
  connection.send(JSON.stringify(msg))
}

export function Close() {
  if (connection) {
    connection.close()
  }
  connection = undefined
}

export function Connect(clientId: string, groupId: string) {
  const protocol = location.href.indexOf("https") !== -1 ? "wss://" : "ws://"
  const url = `${protocol}${location.host}/scrumpoker/api/ws/${clientId}/${groupId}`
  connection = new ReconnectingWebSocket(url)

  connection.addEventListener("message", event => {
    window.dispatchEvent(
      new CustomEvent(`websocket-event`, {
        bubbles: true,
        detail: JSON.parse(event.data),
      })
    );
  })
}
