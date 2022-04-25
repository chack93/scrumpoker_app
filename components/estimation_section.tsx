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
    //setCardList(CardList.map(el => ({...el, active: el.key === key})))
    onEstimationChange(value)
  }

  function renderClient(client: RestBodyClient) {
    const estimation =
      (client.id === Client.id
       || Session.gameStatus === "reveal"
      )
      && !client.viewer
        ? client.estimation : "?"
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
              CardList.filter(el => el.active).map(({key, value}) =>
                <div
                  onClick={() => onEstimationCardClickHandler(key, value)}
                >
                  <EstimationCard
                    key={key}
                    value={value}
                    active={true}
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
        </div>
      </div>
    </>
  )
}

