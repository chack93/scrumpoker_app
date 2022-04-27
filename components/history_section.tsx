import React, {useEffect, useState} from 'react'
import {RestBodyClient, RestBodyHistory, RestBodySession} from '../pages/api/sp_rest'
import EstimationCard from './estimation_card'
import {calculateAverage, calculatePert} from './estimation_section'
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
  createdAt: Date,
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
            createdAt: new Date(el.createdAt),
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
      setGameList(gameList.sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime()))

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
    }
  }, [HistoryList])

  function getEstimationTime(date: Date) {
    try {
      return `${date.getHours()}:${date.getMinutes()}`
    } catch(ignore) {
      return ""
    }
  }

  function renderTable() {
    const pastGamesLimit = 5
    const offset = Math.max(0, GameList.length - pastGamesLimit) 
    const gameList = GameList.slice(-pastGamesLimit)

    return <table className="table-fixed">
      <thead>
        <tr
          className="border-t border-slate-500">
          <th className="text-left p-1"></th>
          { gameList.map((_el, idx) => <th className="text-left p-1" key={idx}>
            No: {offset+idx+1}
          </th>) }
        </tr>
      </thead>
      <tbody>
        <tr
          className="border-y border-slate bg-secondary/50"
        >
          <td className="bg-primary">Time</td>
          {
            gameList.map(el => <td key={el.createdAt.getTime()}>{getEstimationTime(el.createdAt)}</td>)
          }
        </tr>
        <tr
          className="border-y border-slate bg-secondary/50"
        >
          <td className="bg-primary">Avg/Pert</td>
          {
            gameList.map(el => {
              const estList = el.clientList.map(el => el.estimation)
              return <td key={el.gameId}>{calculateAverage(estList)}/{calculatePert(estList)}</td>
            })
          }
        </tr>
        { ClientList.map(client => (
          <tr
            className="border-y border-slate bg-secondary/50"
            key={client.clientId}>
            <td className="text-left p-1 bg-primary">{client.clientName}</td>
            {
              gameList.map(game => {
                const gameClientJoint = game.clientList.find(el => el.clientId === client.clientId)
                const key = game.gameId.substring(0, 8) + client.clientId.substring(0, 8)
                return <td className="text-left p-1" key={key}>{gameClientJoint && gameClientJoint.estimation || "-"}</td>
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

