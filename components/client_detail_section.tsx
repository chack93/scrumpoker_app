import React, {useEffect, useState} from 'react'
import {RestBodyClient} from '../pages/api/sp_rest'

export type ClientDetailSectionParam = {
  Client: RestBodyClient
  onClientChange: (name: string, isViewer: boolean) => void
}

export default function ClientDetailSection({
  Client,
  onClientChange,
}: ClientDetailSectionParam) {

  let [Name, setName] = useState("")
  let [Viewer, setViewer] = useState(false)

  useEffect(() => {
    if (Client.name && !Name) {
      setName(Client.name)
      setViewer(Client.viewer)
    }
  }, [Client])

  function onNameChangeHandler(event: React.ChangeEvent<HTMLInputElement>) {
    setName(event.target.value)
    onClientChange(event.target.value, Viewer)
  }
  function onViewerChangeHandler(event: React.ChangeEvent<HTMLInputElement>) {
    setViewer(event.target.checked)
    onClientChange(Name, event.target.checked)
  }

  return (
    <>
      <div className="card w-full shadow-2xl bg-primary">
        <div className="card-body px-12">
          <h2 className="card-title">User</h2>
          <div className="form-control w-96">
            <label className="label">
              <span className="label-text">Name</span>
            </label>
            <input
              type="text"
              placeholder="Name"
              className={`input input-bordered input-sm`}
              value={Name}
              onChange={onNameChangeHandler}/>

            <label className="label cursor-pointer">
              <span className="label-text">Viewer</span>
              <input
                type="checkbox"
                className="checkbox checkbox-accent"
                checked={Viewer}
                onChange={onViewerChangeHandler}
              />
            </label>
          </div>
        </div>
      </div>
    </>
  )
}

