import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const CreateRaffle = ({ wallet }) => {
  const [raffleType, setRaffleType] = useState('KAS');
  const [tokenTicker, setTokenTicker] = useState('');
  const [timeFrame, setTimeFrame] = useState('');
  const [creditConversion, setCreditConversion] = useState('');
  const [prize, setPrize] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    // Convert the datetime-local value to ISO string
    const localDate = new Date(timeFrame);
    const isoDate = localDate.toISOString();
    console.log("Submitting raffle with:", { raffleType, tokenTicker, isoDate, creditConversion, prize });
    if (!timeFrame || !creditConversion) {
      alert('Please fill all required fields');
      return;
    }
    const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';
    const payload = {
      type: raffleType,
      timeFrame: isoDate,
      creditConversion,
      prize,
      tokenTicker: raffleType === 'KRC20' ? tokenTicker : undefined,
      creator: wallet.address,
    };

    try {
      const res = await axios.post(`${apiUrl}/raffles/create`, payload);
      console.log("API response:", res.data);
      if (res.data.success) {
        alert(`Raffle created! ID: ${res.data.raffleId}`);
        navigate(`/raffle/${res.data.raffleId}`);
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
            <label>Token Ticker:</label>
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
          <label>Credit Conversion (tokens per entry – minimum deposit):</label>
          <input type="number" value={creditConversion} onChange={(e) => setCreditConversion(e.target.value)} />
        </div>
        <div>
          <label>Prize Description:</label>
          <input type="text" value={prize} onChange={(e) => setPrize(e.target.value)} />
        </div>
        <button type="submit">Create Raffle</button>
      </form>
    </div>
  );
};

export default CreateRaffle;
