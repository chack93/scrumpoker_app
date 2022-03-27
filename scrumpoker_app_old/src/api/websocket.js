import ReconnectingWebSocket from "reconnecting-websocket"
import {v4 as uuidv4} from "uuid"

let connection = undefined

export function CreateClientId() {
  return uuidv4()
}

export function Send(head, body) {
  if (!connection)  {
    connection = Connect(head.clientId, head.groupId)
  }
  connection.send(JSON.stringify({head, body}))
}

export function Close() {
  if (connection) {
    connection.close()
  }
  connection = undefined
}

export function Connect(clientId, groupId) {
  const protocol = location.href.indexOf("https") !== -1 ? "wss://" : "ws://"
  const url = `${protocol}${location.host}/api/scrumpoker/ws/${clientId}/${groupId}`
  const websocket = new ReconnectingWebSocket(url)

  websocket.addEventListener("message", event => {
    window.dispatchEvent(
      new CustomEvent(`websocket-event`, {
        bubbles: true,
        detail: JSON.parse(event.data),
      })
    );
  })

  return websocket
}

