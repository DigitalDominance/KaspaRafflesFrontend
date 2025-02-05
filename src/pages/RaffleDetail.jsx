import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useParams } from 'react-router-dom';

const RaffleDetail = ({ wallet }) => {
  const { raffleId } = useParams();
  const [raffle, setRaffle] = useState(null);
  const [entryAmount, setEntryAmount] = useState('');

  useEffect(() => {
    const fetchRaffle = async () => {
      try {
        const res = await axios.get(`/api/raffles/${raffleId}`);
        if (res.data.success) {
          setRaffle(res.data.raffle);
        }
      } catch (err) {
        console.error('Error fetching raffle details:', err);
      }
    };
    fetchRaffle();
  }, [raffleId]);

  const handleEnterRaffle = async () => {
    if (parseFloat(entryAmount) < parseFloat(raffle.creditConversion)) {
      alert(`Minimum entry is ${raffle.creditConversion}`);
      return;
    }
    // Initiate a transaction via KasWare Wallet.
    if (window.kasware) {
      try {
        if (raffle.type === 'KAS') {
          const txid = await window.kasware.sendKaspa(
            raffle.wallet.receivingAddress,
            entryAmount * 1e8
          );
          alert(`Transaction sent: ${txid}`);
        } else if (raffle.type === 'KRC20') {
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
        }
      } catch (err) {
        console.error('Error sending transaction:', err);
        alert('Transaction failed');
      }
    } else {
      alert('KasWare Wallet not available');
    }
  };

  if (!raffle) return <div>Loading raffle details...</div>;

  return (
    <div className="raffle-detail">
      <h1>{raffle.prize || 'Raffle Prize'}</h1>
      <p>Type: {raffle.type}</p>
      <p>Total Entries: {raffle.totalEntries}</p>
      <p>Current Entries: {raffle.currentEntries}</p>
      <p>Time Remaining: {new Date(raffle.timeFrame).toLocaleString()}</p>
      <p>Minimum Entry: {raffle.creditConversion}</p>
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
