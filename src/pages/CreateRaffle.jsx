import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const CreateRaffle = ({ wallet }) => {
  const [raffleType, setRaffleType] = useState('KAS');
  const [tokenTicker, setTokenTicker] = useState('');
  const [timeFrame, setTimeFrame] = useState('');
  const [creditConversion, setCreditConversion] = useState('');
  const [prizeType, setPrizeType] = useState('KAS');
  const [prizeTicker, setPrizeTicker] = useState(''); // For KRC20 prize
  const [prizeAmount, setPrizeAmount] = useState('');
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const navigate = useNavigate();

  // Treasury wallet from environment variable
  const treasuryWallet = process.env.REACT_APP_TREASURY_WALLET;

  // When the form is submitted, create the raffle (but prize not yet confirmed)
  const handleSubmit = async (e) => {
    e.preventDefault();
    const isoDate = new Date(timeFrame).toISOString();
    console.log("Submitting raffle with:", {
      raffleType,
      tokenTicker,
      isoDate,
      creditConversion,
      prizeType,
      prizeAmount,
      prizeTicker,
    });
    if (!timeFrame || !creditConversion || !prizeAmount) {
      alert('Please fill all required fields');
      return;
    }
    // For KRC20 raffles, require a token ticker for both the raffle and the prize.
    if (raffleType === 'KRC20' && !tokenTicker) {
      alert('Please provide a token ticker for the raffle deposit.');
      return;
    }
    if (prizeType === 'KRC20' && !prizeTicker) {
      alert('Please provide a token ticker for the prize.');
      return;
    }
    const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';
    const payload = {
      type: raffleType,
      timeFrame: isoDate,
      creditConversion,
      prizeType,
      prizeAmount,
      creator: wallet.address,
      treasuryAddress: treasuryWallet,
      tokenTicker: raffleType === 'KRC20' ? tokenTicker.trim().toUpperCase() : undefined,
    };
    try {
      const res = await axios.post(`${apiUrl}/raffles/create`, payload);
      console.log("API response:", res.data);
      if (res.data.success) {
        // Now show the prize confirmation modal
        setShowConfirmModal(true);
        // Store the newly created raffle ID in state for later confirmation.
        // (You could also use a context or pass it as a prop.)
        localStorage.setItem('newRaffleId', res.data.raffleId);
      }
    } catch (err) {
      console.error("Error in raffle creation:", err.response ? err.response.data : err.message);
      alert('Error creating raffle: ' + (err.response?.data.error || err.message));
    }
  };

  // Function to handle the prize confirmation step
  const handleConfirmPrize = async () => {
    setConfirming(true);
    const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';
    let txid;
    try {
      if (prizeType === 'KAS') {
        // Use KasWare to send KAS from the host's wallet to the treasury
        txid = await window.kasware.sendKaspa(treasuryWallet, prizeAmount * 1e8);
      } else if (prizeType === 'KRC20') {
        // Use KasWare to send KRC20 tokens from the host's wallet to the treasury
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
      // Now call the backend to confirm the prize
      const raffleId = localStorage.getItem('newRaffleId');
      const confirmRes = await axios.post(`${apiUrl}/raffles/${raffleId}/confirmPrize`, { txid });
      if (confirmRes.data.success) {
        alert("Prize confirmed! Raffle created successfully.");
        setShowConfirmModal(false);
        navigate(`/raffle/${raffleId}`);
      } else {
        alert("Prize confirmation failed.");
      }
    } catch (e) {
      console.error(e);
      alert("Transaction failed. Please try again.");
    } finally {
      setConfirming(false);
    }
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
                onChange={() => setRaffleType('KAS')}
              />
              KAS
            </label>
            <label>
              <input
                type="radio"
                value="KRC20"
                checked={raffleType === 'KRC20'}
                onChange={() => setRaffleType('KRC20')}
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
          <input type="datetime-local" value={timeFrame} onChange={(e) => setTimeFrame(e.target.value)} />
        </div>
        <div>
          <label>Credit Conversion (tokens per entry):</label>
          <input type="number" value={creditConversion} onChange={(e) => setCreditConversion(e.target.value)} />
        </div>
        <div>
          <label>Prize Type:</label>
          <div>
            <label>
              <input
                type="radio"
                value="KAS"
                checked={prizeType === 'KAS'}
                onChange={() => setPrizeType('KAS')}
              />
              KAS
            </label>
            <label>
              <input
                type="radio"
                value="KRC20"
                checked={prizeType === 'KRC20'}
                onChange={() => setPrizeType('KRC20')}
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
          <input type="number" value={prizeAmount} onChange={(e) => setPrizeAmount(e.target.value)} />
        </div>
        <button type="submit">Create Raffle</button>
      </form>

      {showConfirmModal && (
        <div className="processing-modal">
          <div className="spinner"></div>
          <div style={{ textAlign: 'center', marginBottom: '1rem' }}>
            <p>
              Please send {prizeAmount} {prizeType === "KAS" ? "KAS" : prizeTicker.trim().toUpperCase()} to our treasury wallet:
              <br /><strong>{treasuryWallet}</strong>
            </p>
            <p style={{ fontSize: '0.9rem', fontStyle: 'italic' }}>
              Note: KASPER takes 5% of the generated tokens.
            </p>
          </div>
          <button onClick={handleConfirmPrize} disabled={confirming}>
            {confirming ? "Confirming..." : "Confirm Prize"}
          </button>
        </div>
      )}
    </div>
  );
};

export default CreateRaffle;
