// frontend/src/pages/RaffleDetail.jsx
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useParams } from 'react-router-dom';

const RaffleDetail = ({ wallet }) => {
  const { raffleId } = useParams();
  const [raffle, setRaffle] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [entryAmount, setEntryAmount] = useState('');
  const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

  useEffect(() => {
    const fetchRaffle = async () => {
      try {
        const res = await axios.get(`${apiUrl}/raffles/${raffleId}`);
        console.log("Raffle response:", res.data);
        if (res.data.success) {
          setRaffle(res.data.raffle);
        } else {
          setError('Raffle not found');
        }
      } catch (err) {
        console.error('Error fetching raffle details:', err);
        setError('Error loading raffle details.');
      } finally {
        setLoading(false);
      }
    };
    fetchRaffle();
  }, [raffleId, apiUrl]);

  const handleEnterRaffle = async () => {
    if (parseFloat(entryAmount) < parseFloat(raffle.creditConversion)) {
      alert(`Minimum entry is ${raffle.creditConversion}`);
      return;
    }
    // Here you would integrate with KasWare's functions for sending a transaction.
    // For example, if it's a KAS raffle:
    if (raffle.type === 'KAS') {
      try {
        const txid = await window.kasware.sendKaspa(
          raffle.wallet.receivingAddress,
          entryAmount * 1e8  // converting to sompi
        );
        alert(`Transaction sent: ${txid}`);
      } catch (e) {
        console.error(e);
        alert('Transaction failed');
      }
    } else if (raffle.type === 'KRC20') {
      try {
        const transferJson = JSON.stringify({
          p: "KRC-20",
          op: "transfer",
          tick: raffle.tokenTicker,
          amt: (entryAmount * 1e8).toString(),
          to: raffle.wallet.receivingAddress,
        });
        const txid = await window.kasware.signKRC20Transaction(
          transferJson,
          4,
          raffle.wallet.receivingAddress
        );
        alert(`Transaction sent: ${txid}`);
      } catch (e) {
        console.error(e);
        alert('Transaction failed');
      }
    }
  };

  if (loading) {
    return <div className="page-container"><p>Loading raffle...</p></div>;
  }

  if (error) {
    return <div className="page-container"><p>{error}</p></div>;
  }

  return (
    <div className="raffle-detail page-container">
      <h1>{raffle.prize || 'Raffle Prize'}</h1>
      <p>
        Conversion: {raffle.creditConversion} {raffle.type} = 1 Entry
      </p>
      <p>Total Entries: {raffle.totalEntries}</p>
      <p>Current Entries: {raffle.currentEntries}</p>
      <p>Time Remaining: {new Date(raffle.timeFrame).toLocaleString()}</p>
      <div>
        <input
          type="number"
          placeholder="Enter amount"
          value={entryAmount}
          onChange={(e) => setEntryAmount(e.target.value)}
        />
        <button onClick={handleEnterRaffle}>Enter Raffle</button>
      </div>
      <div className="leaderboard">
        <h3>Leaderboard (Top 10 entries)</h3>
        {raffle.entries && raffle.entries.slice(0, 10).map((entry, index) => (
          <div key={index}>
            <span>{entry.walletAddress}</span>: <span>{entry.amount}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default RaffleDetail;
