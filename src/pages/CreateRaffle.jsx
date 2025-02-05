// frontend/src/pages/CreateRaffle.jsx
import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const CreateRaffle = ({ wallet }) => {
  // Form data state
  const [formData, setFormData] = useState({
    raffleType: 'KAS',
    tokenTicker: '',
    timeFrame: '',
    creditConversion: '',
    prizeType: 'KAS',
    prizeTicker: '',
    prizeAmount: ''
  });
  const { raffleType, tokenTicker, timeFrame, creditConversion, prizeType, prizeTicker, prizeAmount } = formData;
  
  // Other state
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [confirmError, setConfirmError] = useState('');
  const navigate = useNavigate();

  // Treasury wallet from env variable
  const treasuryWallet = process.env.REACT_APP_TREASURY_WALLET;

  // Check the host's balance before initiating the prize transaction.
  const checkPrizeBalance = async () => {
    if (prizeType === 'KAS') {
      try {
        const balance = await window.kasware.getBalance();
        if (balance.confirmed < prizeAmount * 1e8) {
          setConfirmError('Insufficient KAS balance in your wallet.');
          return false;
        }
        return true;
      } catch (err) {
        console.error('Error checking KAS balance:', err);
        setConfirmError('Error checking KAS balance.');
        return false;
      }
    } else {
      try {
        const tokenBalances = await window.kasware.getKRC20Balance();
        const tokenObj = tokenBalances.find(
          (token) => token.tick.toUpperCase() === prizeTicker.trim().toUpperCase()
        );
        if (!tokenObj) {
          setConfirmError(`Token ${prizeTicker.trim().toUpperCase()} not found in your wallet.`);
          return false;
        }
        const dec = parseInt(tokenObj.dec, 10);
        const required = prizeAmount * Math.pow(10, dec);
        if (parseInt(tokenObj.balance, 10) < required) {
          setConfirmError('Insufficient token balance in your wallet.');
          return false;
        }
        return true;
      } catch (err) {
        console.error('Error checking KRC20 balance:', err);
        setConfirmError('Error checking token balance.');
        return false;
      }
    }
  };

  // When the form is submitted, validate input and check balance.
  // If sufficient funds exist, store form data in state and show the confirm modal.
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!timeFrame || !creditConversion || !prizeAmount) {
      setConfirmError('Please fill all required fields.');
      return;
    }
    if (raffleType === 'KRC20' && !tokenTicker) {
      setConfirmError('Please provide a token ticker for the raffle deposit.');
      return;
    }
    if (prizeType === 'KRC20' && !prizeTicker) {
      setConfirmError('Please provide a token ticker for the prize.');
      return;
    }
    // Check balance before even showing the modal
    const hasFunds = await checkPrizeBalance();
    if (!hasFunds) return;

    // Save form data (it is already in formData state) and show modal.
    setConfirmError('');
    setShowConfirmModal(true);
  };

  // When the user confirms, call KasWare to perform the prize transaction,
  // then create the raffle on the backend with the TXID.
  const handleConfirmPrize = async () => {
    setConfirmError('');
    setConfirming(true);
    const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';
    let txid;
    try {
      if (prizeType === 'KAS') {
        txid = await window.kasware.sendKaspa(treasuryWallet, prizeAmount * 1e8);
      } else if (prizeType === 'KRC20') {
        const transferJson = JSON.stringify({
          p: "KRC-20",
          op: "transfer",
          tick: prizeTicker.trim().toUpperCase(),
          amt: (prizeAmount * 1e8).toString(),
          to: treasuryWallet,
        });
        txid = await window.kasware.signKRC20Transaction(
          transferJson,
          4,
          treasuryWallet
        );
      }
      console.log("Prize transaction sent, txid:", txid);
      
      // Now create the raffle on the backend with the TXID included
      const payload = {
        type: raffleType,
        timeFrame,
        creditConversion,
        prizeType,
        prizeAmount,
        creator: wallet.address,
        treasuryAddress,
        tokenTicker: raffleType === 'KRC20' ? tokenTicker.trim().toUpperCase() : undefined,
        prizeTicker: prizeType === 'KRC20' ? prizeTicker.trim().toUpperCase() : undefined,
        prizeTransactionId: txid
      };
      const res = await axios.post(`${apiUrl}/raffles/create`, payload);
      if (res.data.success) {
        setShowConfirmModal(false);
        navigate(`/raffle/${res.data.raffleId}`);
      } else {
        setConfirmError("Prize confirmation failed.");
      }
    } catch (e) {
      console.error(e);
      setConfirmError("Transaction failed. Please try again.");
    } finally {
      setConfirming(false);
    }
  };

  // Handler to close/cancel the confirm modal
  const handleCloseModal = () => {
    setShowConfirmModal(false);
    setConfirmError('');
  };

  return (
    <div className="create-raffle-page page-container">
      <h1>Create a Raffle</h1>
      <form onSubmit={handleSubmit} className="frosted-form">
        <div>
          <label>Raffle Type:</label>
          <div>
            <label>
              <input
                type="radio"
                value="KAS"
                checked={raffleType === 'KAS'}
                onChange={() => setFormData({ ...formData, raffleType: 'KAS' })}
              />
              KAS
            </label>
            <label>
              <input
                type="radio"
                value="KRC20"
                checked={raffleType === 'KRC20'}
                onChange={() => setFormData({ ...formData, raffleType: 'KRC20' })}
              />
              KRC20
            </label>
          </div>
        </div>
        {raffleType === 'KRC20' && (
          <div>
            <label>Raffle Token Ticker:</label>
            <input
              type="text"
              value={tokenTicker}
              onChange={(e) => setFormData({ ...formData, tokenTicker: e.target.value })}
            />
          </div>
        )}
        <div>
          <label>Time Frame (end date/time):</label>
          <input
            type="datetime-local"
            value={timeFrame}
            onChange={(e) => setFormData({ ...formData, timeFrame: e.target.value })}
          />
        </div>
        <div>
          <label>Credit Conversion (tokens per entry):</label>
          <input
            type="number"
            value={creditConversion}
            onChange={(e) => setFormData({ ...formData, creditConversion: e.target.value })}
          />
        </div>
        <div>
          <label>Prize Type:</label>
          <div>
            <label>
              <input
                type="radio"
                value="KAS"
                checked={prizeType === 'KAS'}
                onChange={() => setFormData({ ...formData, prizeType: 'KAS' })}
              />
              KAS
            </label>
            <label>
              <input
                type="radio"
                value="KRC20"
                checked={prizeType === 'KRC20'}
                onChange={() => setFormData({ ...formData, prizeType: 'KRC20' })}
              />
              KRC20
            </label>
          </div>
        </div>
        {prizeType === 'KRC20' && (
          <div>
            <label>Prize Token Ticker:</label>
            <input
              type="text"
              value={prizeTicker}
              onChange={(e) => setFormData({ ...formData, prizeTicker: e.target.value })}
            />
          </div>
        )}
        <div>
          <label>Prize Amount:</label>
          <input
            type="number"
            value={prizeAmount}
            onChange={(e) => setFormData({ ...formData, prizeAmount: e.target.value })}
          />
        </div>
        <button type="submit">Create Raffle</button>
      </form>

      {/* Inline error message outside the modal if needed */}
      {confirmError && !showConfirmModal && (
        <div className="error-message" style={{ marginTop: '1rem', color: 'red', textAlign: 'center' }}>
          {confirmError}
          <button className="close-button" onClick={() => setConfirmError('')} style={{ marginLeft: '1rem' }}>×</button>
        </div>
      )}

      {showConfirmModal && (
        <div className="processing-modal">
          <div style={{ position: 'absolute', top: '1rem', right: '1rem' }}>
            <button className="close-button" onClick={handleCloseModal}>×</button>
          </div>
          {confirmError ? (
            <div style={{ textAlign: 'center', marginBottom: '1rem' }}>
              <p style={{ color: 'red' }}>{confirmError}</p>
              <button className="close-button" onClick={handleCloseModal}>×</button>
            </div>
          ) : (
            <>
              {!confirming && <div className="spinner"></div>}
              <div style={{ textAlign: 'center', marginBottom: '1rem' }}>
                <p>
                  Please send {prizeAmount} {prizeType === "KAS" ? "KAS" : prizeTicker.trim().toUpperCase()} to begin the raffle:
                </p>
                <p style={{ fontSize: '0.9rem', fontStyle: 'italic' }}>
                  Note: KASPER takes 5% of the generated tokens.
                </p>
              </div>
              <button onClick={handleConfirmPrize} disabled={confirming}>
                {confirming ? "Confirming..." : "Confirm Prize"}
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default CreateRaffle;
