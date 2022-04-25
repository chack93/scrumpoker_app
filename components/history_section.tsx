import React, {useEffect, useState} from 'react'
import {RestBodyClient, RestBodyHistory, RestBodySession} from '../pages/api/sp_rest'
import EstimationCard from './estimation_card'
import {parseCardString} from './session_section'

export type HistorySectionParam = {
  HistoryList: Array<RestBodyHistory>
}

type ClientItemType = {
  clientId: string,
  clientName: string,
  estimation: string,
}

type GameItemType = {
  gameId: string,
  createdAt: string,
  clientList: Array<ClientItemType>,
}

export default function HistorySection({
  HistoryList,
}: HistorySectionParam) {

  let [GameList, setGameList] = useState([] as Array<GameItemType>)
  let [ClientList, setClientList] = useState([] as Array<ClientItemType>)

  useEffect(() => {
    if (HistoryList) {
      const gameList = HistoryList.reduce((acc, el) => {
        let listItem = acc.find(game => game.gameId === el.gameId)
        if (!listItem) {
          acc.push({
            gameId: el.gameId,
            createdAt: el.createdAt,
            clientList: [],
          })
          listItem = acc[acc.length - 1]
        }
        if (!listItem.clientList.find((client: ClientItemType) => client.clientId === el.clientId)) {
          listItem.clientList.push({
            clientId: el.clientId,
            clientName: el.clientName,
            estimation: el.estimation,
          })
        }
        return acc
      }, [] as Array<GameItemType>)
      setGameList(gameList)

      const clientList = HistoryList.reduce((acc, el) => {
        if (!acc.find(client => client.clientId === el.clientId)) {
          acc.push({
            clientId: el.clientId,
            clientName: el.clientName,
            estimation: el.estimation,
          })
        }
        return acc
      }, [] as Array<ClientItemType>)
      setClientList(clientList)

      console.log(gameList)
      console.log(clientList)
    }
  }, [HistoryList])

  function getEstimationTime(date: string) {
    try {
      const d = new Date(date)
      return `${d.getHours()}:${d.getMinutes()}`
    } catch(ignore) {
      return ""
    }
  }

  function renderTable() {
    const gameList = GameList.slice(0, 5)

    return <table className="table-fixed">
      <thead>
        <tr
          className="border-t border-slate-500">
          <th className="text-left p-1">User</th>
          { gameList.map((el, idx) => <th className="text-left p-1" key={idx}>
            No: {idx+1}
            <br />
            {getEstimationTime(el.createdAt)}
          </th>) }
        </tr>
      </thead>
      <tbody>
        { ClientList.map(client => (
          <tr
            className="border-y border-slate-500 bg-secondary/50"
            key={client.clientId}>
            <td className="text-left p-1">{client.clientName}</td>
            {
              gameList.map(game => {
                const gameClientJoint = game.clientList.find(el => el.clientId === client.clientId)
                const key = game.gameId.substring(0, 8) + client.clientId.substring(0, 8)
                return <td className="text-left p-1" key={key}>{gameClientJoint.estimation}</td>
              })
            }
          </tr>
        )) }
      </tbody>
    </table>
  }

  return (
    <>
      <div className="card w-full shadow-2xl bg-primary">
        <div className="card-body">
          <h2 className="card-title">History</h2>
          <div className="flex flex-wrap gap-2">
            { renderTable() }
          </div>
        </div>
      </div>
    </>
  )
}

