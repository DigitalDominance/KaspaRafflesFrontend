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
  const [prizeAmount, setPrizeAmount] = useState('');
  const navigate = useNavigate();

  // Treasury wallet from env variable
  const treasuryWallet = process.env.REACT_APP_TREASURY_WALLET;

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
    });
    if (!timeFrame || !creditConversion || !prizeAmount) {
      alert('Please fill all required fields');
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
      tokenTicker: raffleType === 'KRC20' ? tokenTicker : undefined,
    };

    try {
      const res = await axios.post(`${apiUrl}/raffles/create`, payload);
      console.log("API response:", res.data);
      if (res.data.success) {
        // Show a confirm popup instructing the host to send the prize
        if (window.confirm(`Please send ${prizeAmount} ${prizeType === "KAS" ? "KAS" : tokenTicker.trim().toUpperCase()} to our treasury wallet: ${treasuryWallet}. Note: KASPER takes 5% fee. Click OK after you have sent the prize.`)) {
          const txid = window.prompt("Enter the prize transaction ID:");
          if (txid) {
            const confirmRes = await axios.post(`${apiUrl}/raffles/${res.data.raffleId}/confirmPrize`, { txid });
            if (confirmRes.data.success) {
              alert("Prize confirmed! Raffle created successfully.");
              navigate(`/raffle/${res.data.raffleId}`);
            } else {
              alert("Prize confirmation failed.");
            }
          } else {
            alert("Prize confirmation cancelled.");
          }
        }
      }
    } catch (err) {
      console.error("Error in raffle creation:", err.response ? err.response.data : err.message);
      alert('Error creating raffle: ' + (err.response?.data.error || err.message));
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
            <label>Token Ticker (for raffle deposit):</label>
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
        <div>
          <label>Prize Amount:</label>
          <input type="number" value={prizeAmount} onChange={(e) => setPrizeAmount(e.target.value)} />
        </div>
        <button type="submit">Create Raffle</button>
      </form>
    </div>
  );
};

export default CreateRaffle;
