// frontend/src/pages/CreateRaffle.jsx
import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const CreateRaffle = ({ wallet }) => {
  const [raffleType, setRaffleType] = useState('KAS');
  const [tokenTicker, setTokenTicker] = useState('');
  const [timeFrame, setTimeFrame] = useState('');
  const [creditConversion, setCreditConversion] = useState('');
  const [prizeType, setPrizeType] = useState('KAS');
  const [prizeTicker, setPrizeTicker] = useState(''); // for KRC20 prize
  const [prizeAmount, setPrizeAmount] = useState('');
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [confirmError, setConfirmError] = useState('');
  const navigate = useNavigate();

  // Treasury wallet from environment variable
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

  // Handle form submission.
  const handleSubmit = async (e) => {
    e.preventDefault();
    const isoDate = new Date(timeFrame).toISOString();
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
    // Check balance before proceeding.
    const hasFunds = await checkPrizeBalance();
    if (!hasFunds) return;

    const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';
    const payload = {
      type: raffleType,
      timeFrame: isoDate,
      creditConversion,
      prizeType,
      prizeAmount,
      creator: wallet.address,
      treasuryAddress: treasuryWallet, // Use the defined variable here.
      tokenTicker: raffleType === 'KRC20' ? tokenTicker.trim().toUpperCase() : undefined,
      prizeTicker: prizeType === 'KRC20' ? prizeTicker.trim().toUpperCase() : undefined,
    };
    try {
      const res = await axios.post(`${apiUrl}/raffles/create`, payload);
      if (res.data.success) {
        setShowConfirmModal(true);
        localStorage.setItem('newRaffleId', res.data.raffleId);
        setConfirmError('');
      }
    } catch (err) {
      console.error("Error creating raffle:", err.response ? err.response.data : err.message);
      setConfirmError('Error creating raffle: ' + (err.response?.data.error || err.message));
    }
  };

  // Handle prize confirmation using KasWare.
  const handleConfirmPrize = async () => {
    setConfirmError('');
    const hasFunds = await checkPrizeBalance();
    if (!hasFunds) return;
    
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
      const raffleId = localStorage.getItem('newRaffleId');
      const confirmRes = await axios.post(`${apiUrl}/raffles/${raffleId}/confirmPrize`, { txid });
      if (confirmRes.data.success) {
        setShowConfirmModal(false);
        navigate(`/raffle/${raffleId}`);
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

  // Handler to close/cancel the confirmation modal.
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
                onChange={() => { setRaffleType('KAS'); }}
              />
              KAS
            </label>
            <label>
              <input
                type="radio"
                value="KRC20"
                checked={raffleType === 'KRC20'}
                onChange={() => { setRaffleType('KRC20'); }}
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
              onChange={(e) => setTokenTicker(e.target.value)}
            />
          </div>
        )}
        <div>
          <label>Time Frame (end date/time):</label>
          <input
            type="datetime-local"
            value={timeFrame}
            onChange={(e) => setTimeFrame(e.target.value)}
          />
        </div>
        <div>
          <label>Credit Conversion (tokens per entry):</label>
          <input
            type="number"
            value={creditConversion}
            onChange={(e) => setCreditConversion(e.target.value)}
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
                onChange={() => { setPrizeType('KAS'); }}
              />
              KAS
            </label>
            <label>
              <input
                type="radio"
                value="KRC20"
                checked={prizeType === 'KRC20'}
                onChange={() => { setPrizeType('KRC20'); }}
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
              onChange={(e) => setPrizeTicker(e.target.value)}
            />
          </div>
        )}
        <div>
          <label>Prize Amount:</label>
          <input
            type="number"
            value={prizeAmount}
            onChange={(e) => setPrizeAmount(e.target.value)}
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
