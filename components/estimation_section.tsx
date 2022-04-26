import React, {useEffect, useState} from 'react'
import {RestBodyClient, RestBodySession} from '../pages/api/sp_rest'
import EstimationCard from './estimation_card'
import {CardListType, parseCardString} from './session_section'

export type EstimationSectionParam = {
  Client: RestBodyClient
  Session: RestBodySession
  ClientList: Array<RestBodyClient>
  onEstimationChange: (estimation: string) => void
}

export function calculateAverage(estimationList: Array<string>): string {
  const estL = estimationList
  .map(el => parseInt(el))
  .filter(el => !isNaN(el))
  const average = estL.reduce((acc, el) => acc+el, 0) / estL.length
  if (isNaN(average)) return ""
    return average.toFixed(1)
}
export function calculatePert(estimationList: Array<string>): string {
  const estL = estimationList
  .map(el => parseInt(el))
  .filter(el => !isNaN(el))
  .sort((a, b) => a - b)
  const bestCase = estL[0]
  const worstCase = estL[estL.length - 1]
  const average = estL.reduce((acc, el) => acc+el, 0) / estL.length
  const pert = (bestCase + (4*average) + worstCase) / 6
  if (isNaN(pert)) return ""
    return pert.toFixed(1)
}

export default function EstimationSection({
  Client,
  Session,
  ClientList,
  onEstimationChange,
}: EstimationSectionParam) {

  let [CardList, setCardList] = useState([] as Array<CardListType>)
  useEffect(() => {
    if (Session) {
      const cardList = parseCardString(Session.cardSelectionList || "")
      //.map(el => ({...el, active: el.value === Client.estimation}))
      setCardList(cardList)
    }
  }, [Session, Client])

  function onEstimationCardClickHandler(_key: string, value: string) {
    if (Session.gameStatus === "reveal" || Client.viewer) return
      //setCardList(CardList.map(el => ({...el, active: el.key === key})))
      onEstimationChange(value)
  }

  function renderClient(client: RestBodyClient) {
    let estimation = "-"
    if (client.viewer) {
      estimation = ""
    }
    if (Session.gameStatus !== "reveal" && client.estimation === "") {
      estimation = ""
    }
    if (Session.gameStatus !== "reveal" && client.estimation !== "") {
      estimation = "?"
    }
    if (client.id === Client.id || Session.gameStatus === "reveal") {
      estimation = client.estimation
    }
    return <div
      key={client.id}
      className={`flex items-center gap-2`}>
      <EstimationCard
        value={estimation}
        active={true}
        readonly={true}/>
      <div>{client.name}</div>
      <div>{client.viewer && "(Viewer)"}</div>
    </div>
  }

  return (
    <>
      <div className="card w-full shadow-2xl bg-primary">
        <div className="card-body">
          <h2 className="card-title">Estimation</h2>
          <div className="flex flex-wrap gap-2">
            {
              !Client.viewer &&
                CardList.filter(el => el.active).map(({key, value}) =>
                <div
                  key={key}
                  onClick={() => onEstimationCardClickHandler(key, value)}
                >
                  <EstimationCard
                    key={key}
                    value={value}
                    active={Session.gameStatus !== "reveal"}
                    readonly={true}
                  />
                </div>
                                                    )
            }
          </div>
          <hr className="my-2" />
          {
            ClientList
            .filter(el => el.connected)
            .map(el => renderClient(el))
          }
          {
            Session.gameStatus === "reveal" &&
              <>
                <hr className="my-2" />
                <div className="badge badge-lg">Avg: {calculateAverage(ClientList.map(el => el.estimation))}</div>
                <div className="badge badge-lg">Pert: {calculatePert(ClientList.map(el => el.estimation))}</div>
              </>
          }
        </div>
      </div>
    </>
  )
}

