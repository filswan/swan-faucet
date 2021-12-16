import { React, useState } from 'react'
import axios from 'axios'
import '../styles/Faucet.css'
import Modal from './Modal'
import '../styles/Modal.css'

import SelectTokens from './SelectTokens'

const Faucet = (props) => {
  const web3 = props.web3
  const faucet = props.faucetContract // faucet contract
  //const token = props.tokenContract // token contract
  const server = props.server
  const [account, setAccount] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [txHash, setTxHash] = useState('')
  const [isValidAddress, setIsValidAddress] = useState(false)
  const [inProgress, setInProgress] = useState(false)
  const [isError, setIsError] = useState(false)
  const [selectedNetwork, setSelectedNetwork] = useState('mumbai')

  const [selectedTokenAddresses, setSelectedTokenAddresses] = useState([])

  // whenever the textfield changes
  const handleChange = async (e) => {
    const address = e.target.value
    setAccount(address)
    setIsValidAddress(await web3.utils.isAddress(address))
  }

  const buttonClicked = async (address) => {
    setIsError(false)
    setInProgress(true)
    setShowModal(true)
    // first check if the address is valid
    if (await web3.utils.isAddress(address)) {
      // check if they are allowed to withdraw (24 hours)
      const allowedToWithdraw = await faucet.methods
        .allowedToWithdraw(address)
        .call()

      if (allowedToWithdraw) {
        try {
          // send request for tokens
          const response = await sendRequest({ account: address })
          await timeout(3000)
          //console.log(response)

          // if success, update balance and display tx_hash
          if (response.message === 'success') {
            //setTokenBalance(parseFloat(tokenBalance) + 100)
            setTxHash(response.tx_hash)
          }
        } catch (err) {
          setShowModal(false)
          alert('Internal Server Error, please try again later')
        }
      } else {
        setIsError(true)
      }
    } else {
      setShowModal(false)
    }

    setInProgress(false)
  }

  // send post request to server to send contract method
  const sendRequest = async (jsonObject) => {
    try {
      const response = await axios.post(server, jsonObject, {
        headers: { 'Content-Type': 'application/json' },
      })
      return response.data
    } catch (err) {
      // Handle Error Here
      console.error(err)
    }
  }

  const timeout = (delay) => {
    return new Promise((res) => setTimeout(res, delay))
  }

  /*
  const test = (e) => {
    e.preventDefault()
    console.log('network: ', selectedNetwork)
    console.log(selectedTokenAddresses)
  }
  */

  const handleNetworkChange = (e) => {
    setSelectedNetwork(e.target.value)
  }

  return (
    <form id="faucet">
      <div className="faucet-inputs">
        <div className="faucet-network">
          <div className="network-label">Network</div>
          <select
            className="network"
            name="network"
            value={selectedNetwork}
            onChange={handleNetworkChange}
          >
            <option value="mumbai">Polygon Mumbai</option>
            <option value="rinkeby">Ethereum Rinkeby</option>
          </select>
        </div>

        <div className="faucet-address">
          <div className="address-label">Testnet account address</div>
          <input
            className="address-text"
            type="text"
            value={account}
            onChange={handleChange}
            placeholder="Ex: 0xA878795d2C93985444f1e2A077FA324d59C759b0"
          />
          {!isValidAddress && account !== '' ? (
            <div className="error-div">
              <img className="error-icon" src="error-icon.svg" alt="error! " />
              <div className="error-text">
                Please enter a valid ethereum address.
              </div>
            </div>
          ) : (
            <></>
          )}
        </div>
      </div>

      <SelectTokens
        setSelectedTokenAddresses={setSelectedTokenAddresses}
        network={selectedNetwork}
      />

      {
        //<button onClick={(e) => test(e)}>TEST</button>
      }

      <button
        id="faucet-btn"
        disabled={showModal}
        onClick={() => buttonClicked(account)}
      >
        Request 100 USDC
      </button>

      <div className="help-div">
        <img className="help-icon" src="question.svg" alt="need help?" />
        <div className="help-text">
          Need more testnet MATIC? Get MATIC from{' '}
          <a
            className="mumbai-faucet-link"
            href="https://faucet.polygon.technology"
            target="_blank"
            rel="noreferrer noopener"
          >
            Polygon Mumbai Faucet
          </a>
        </div>
      </div>

      <Modal
        show={showModal}
        handleClose={() => setShowModal(false)}
        inProgress={inProgress}
        hash={txHash}
        isError={isError}
      />
    </form>
  )
}

export default Faucet
