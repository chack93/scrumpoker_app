import React, {useEffect, useState} from 'react'
import {RestBodyClient, RestBodySession} from '../pages/api/sp_rest'
import EstimationCard from './estimation_card'

export type SessionDetailSectionParam = {
  Session: RestBodySession
  Client: RestBodyClient
  onDescriptionChange: (description: string) => void
  onCardListChange: (cardSelectionList: string) => void
}

type CardListType = {
  idx: number,
  key: string,
  value: string,
  active: boolean
}

export default function SessionDetailSection({
  Session,
  Client,
  onDescriptionChange,
  onCardListChange
}: SessionDetailSectionParam) {

  const locationOrigin = typeof window !== "undefined" ? window.location.origin : ""
  const locationPathname = typeof window !== "undefined" ? window.location.pathname : ""
  const defaultCardList = "☕=true,1=true,2=true,3=true,4=true,5=true,6=true,7=true,8=true,9=true,10=true"

  let [Description, setDescription] = useState("")
  let [CardList, setCardList] = useState([] as Array<CardListType>)

  useEffect(() => {
    if (Session.description && !Description) {
      setDescription(Session.description)
    }
    if ((Session.cardSelectionList && !CardList.length) || !isAdmin()) {
      const cardList = parseCardString(Session.cardSelectionList || defaultCardList)
      setCardList(cardList)
    }
  }, [Session])

  function onDescriptionChangeHandler(event: React.ChangeEvent<HTMLInputElement>) {
    setDescription(event.target.value)
    onDescriptionChange(event.target.value)
  }
  function onEstimationCardChange(key: string, value: string, active: boolean) {
    const newCardList = CardList.map(el => (el.key === key ? { ...el, value, active  }: el))
    setCardList(newCardList)
    onCardListChange && onCardListChange(cardListToString(newCardList))
  }
  function onCardCountChangeHandler(event: React.ChangeEvent<HTMLInputElement>) {
    const oldLength = CardList.length
    const newLength = Math.max(Math.min(parseInt(event.target.value), 32), 1)
    let newCardList = CardList
    if (oldLength >= newLength) {
      newCardList = CardList.slice(0, newLength)
    } else {
      const lastElement = CardList[oldLength-1] || {value: "0", idx: 0}
      const lastValue = parseInt(lastElement.value) || 0
      const newElements = Array(newLength-oldLength).fill("").map((_, i): CardListType => {
        const idx = lastElement.idx+i
        const value = (lastValue+i+1).toString()
        return {
          key: getCardKey(idx, value.toString(), true),
          idx,
          value,
          active: true
        }
      })
      newCardList = [...CardList, ...newElements]
    }
    setCardList(newCardList)
    onCardListChange && onCardListChange(cardListToString(newCardList))
  }
  function onClickResetHandler() {
    const newCardList = parseCardString(defaultCardList)
    setCardList(newCardList)
    onCardListChange && onCardListChange(cardListToString(newCardList))
  }

  function isAdmin() {
    return Client.id === Session.ownerClientId
  }
  function getCardListCount() {
    return CardList.length
  }
  function parseCardString(str: string = ""): Array<CardListType> {
    return str.split(",").map((el, idx) => {
      const [value, active] = el.split("=")
      return {key: getCardKey(idx, value, active == "true"), idx, value, active: active == "true"}
    })
  }
  function cardListToString(cardList: Array<CardListType>): string {
    return cardList
    .reduce((acc, el) => `${acc},${el.value}=${el.active.toString()}`, "")
    .substring(1)
  }
  function getCardKey(idx: number, value: string, active: boolean): string {
    return `${idx.valueOf()}${value.valueOf()}${active?"t":"f"}`
  }

  return (
    <>
      <div className="card w-full shadow-2xl bg-primary">
        <div className="card-body px-12">
          <h2 className="card-title">Session</h2>
          <div className="form-control w-96">
            <div className="flex justify-between">
              <span>Join Link: </span>
              <a
                className="link-accent"
                href={`${locationOrigin}${locationPathname}?join=${Session.joinCode || ""}`}
              >#{Session.joinCode}</a>
            </div>
            {
              isAdmin() &&
                <>
                  <label className="label">
                    <span className="label-text">Description</span>
                  </label>
                  <input
                    type="text"
                    placeholder="Description"
                    className={`input input-bordered input-sm`}
                    value={Description}
                    onChange={onDescriptionChangeHandler}/>
                </>
                ||
                <div className="text-xl truncate max-w-full mt-2">{Session.description}</div>
            }
            {
              isAdmin() && (
                <>
                  <label className="label mt-2">
                    <span className="label-text">Cards</span>
                  </label>
                  <div className="flex gap-2 items-center">
                    <input
                      type="range"
                      min="1"
                      max="32"
                      value={getCardListCount()}
                      className="range range-accent"
                      onChange={onCardCountChangeHandler}/>
                    <input
                      type="text"
                      className={`input input-bordered input-sm w-8 p-1 text-center`}
                      value={getCardListCount()}
                      onChange={onCardCountChangeHandler}/>
                    <button
                      className="btn btn-sm btn-accent btn-outline"
                      onClick={onClickResetHandler}>Reset</button>
                  </div>
                  <label className="label mt-2">
                    <span className="label-text">Estimation Cards</span>
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {
                      CardList.map(({key, value, active}) =>
                        <EstimationCard
                          className=""
                          key={key}
                          value={value}
                          active={active}
                          onStateChange={(v, a) => onEstimationCardChange(key, v, a)}/>
                                  )
                    }
                  </div>
                </>
              )
            }
          </div>
        </div>
      </div>
    </>
  )
}

