import { React, useEffect, useState } from 'react'
import { tokens } from '../utils/tokens'
import '../styles/SelectToken.css'

const SelectTokens = ({ setSelectedTokenAddresses, network }) => {
  const [isChecked, setIsChecked] = useState(
    new Array(tokens.length).fill(false),
  )

  useEffect(() => {
    updateAddresses(isChecked)
  }, [network])

  const updateAddresses = (checkState) => {
    const selectedAddreses = []
    for (let i = 0; i < checkState.length; i++) {
      if (checkState[i]) {
        selectedAddreses.push(tokens[i][network])
      }
    }

    setSelectedTokenAddresses(selectedAddreses)
  }

  //handleSelectChange
  const handleSelectChange = (position) => {
    const updatedCheckedState = isChecked.map((checked, index) =>
      index === position ? !checked : checked,
    )
    setIsChecked(updatedCheckedState)

    updateAddresses(updatedCheckedState)
  }

  return (
    <ul className="tokens-list">
      {tokens.map(
        ({ name, tokenAmount, mumbaiAddress, rinkebyAddress }, index) => {
          return (
            <li key={index}>
              <div
                className={
                  isChecked[index]
                    ? 'tokens-list-item-checked'
                    : 'tokens-list-item'
                }
                onClick={() => handleSelectChange(index)}
              >
                <input
                  type="checkbox"
                  id={`custom-checkbox-${index}`}
                  className="checkbox"
                  name={name}
                  value={name}
                  checked={isChecked[index]}
                  onChange={() => handleSelectChange(index)}
                />
                <label
                  htmlFor={`custom-checkbox-${index}`}
                  value={name}
                >{`${tokenAmount} ${name}`}</label>
              </div>
            </li>
          )
        },
      )}
    </ul>
  )
}

export default SelectTokens
