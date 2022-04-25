import React, {useEffect, useState} from 'react'

export type EstimationCardParam = {
  value: string,
  active: boolean,
  readonly?: boolean,
  onStateChange?: (value: string, active: boolean) => void
}

export default function EstimationCard({
  value,
  active,
  readonly = false,
  onStateChange,
}: EstimationCardParam) {

  let [Value, setValue] = useState("")
  let [Active, setActive] = useState(true)

  useEffect(() => {
    setValue(value)
    setActive(active)
  }, [value, active])

  function onValueChangeHandler(event: React.ChangeEvent<HTMLInputElement>) {
    setValue(event.target.value)
    onStateChange && onStateChange(event.target.value, Active)
  }
  function onClickHandler(event: React.MouseEvent<HTMLDivElement>) {
    if (readonly) return
      if ((event.target as HTMLElement).tagName !== "DIV") return
        setActive(!Active)
    onStateChange && onStateChange(Value, !Active)
  }

  return (
    <>
      <div
        className={`btn btn-square ${!readonly && "btn-accent"} ${!Active && "btn-outline"}`}
        onClick={onClickHandler}>
        {
          readonly
          && <span>{Value}</span>
          || <input
            type="text"
            className={`input input-bordered input-sm w-8 p-0 text-center`}
            value={Value}
            onChange={onValueChangeHandler}/>
        }
      </div>
    </>
  )
}

