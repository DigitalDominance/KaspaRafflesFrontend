import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useParams } from 'react-router-dom';

const RaffleDetail = ({ wallet }) => {
  const { raffleId } = useParams();
  const [raffle, setRaffle] = useState(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState(null);
  const [entryAmount, setEntryAmount] = useState('');
  const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

  const fetchRaffle = async () => {
    try {
      const res = await axios.get(`${apiUrl}/raffles/${raffleId}`);
      if (res.data.success) {
        setRaffle(res.data.raffle);
      } else {
        setError('Raffle not found');
      }
    } catch (err) {
      setError('Error loading raffle details.');
      console.error('Error fetching raffle details:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRaffle();
    const interval = setInterval(fetchRaffle, 5000);
    return () => clearInterval(interval);
  }, [raffleId, apiUrl]);

  const handleEnterRaffle = async () => {
    if (parseFloat(entryAmount) < parseFloat(raffle.creditConversion)) {
      alert(`Minimum entry is ${raffle.creditConversion}`);
      return;
    }
    setProcessing(true);
    try {
      let txid;
      if (raffle.type === 'KAS') {
        txid = await window.kasware.sendKaspa(
          raffle.wallet.receivingAddress,
          entryAmount * 1e8  // converting to sompi
        );
      } else if (raffle.type === 'KRC20') {
        const transferJson = JSON.stringify({
          p: "KRC-20",
          op: "transfer",
          tick: raffle.tokenTicker,
          amt: (entryAmount * 1e8).toString(),
          to: raffle.wallet.receivingAddress,
        });
        txid = await window.kasware.signKRC20Transaction(
          transferJson,
          4,
          raffle.wallet.receivingAddress
        );
      }
      alert(`Transaction sent: ${txid}`);
      // Trigger backend processing
      await axios.post(`${apiUrl}/raffles/${raffle.raffleId}/process`);
    } catch (e) {
      console.error(e);
      alert('Transaction failed');
    } finally {
      setProcessing(false);
      setEntryAmount('');
      fetchRaffle();
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
      <div className="raffle-info">
        {raffle.type === 'KAS' ? (
          <p>Conversion: {raffle.creditConversion} KAS = 1 Entry</p>
        ) : (
          <p>Conversion: {raffle.creditConversion} {raffle.tokenTicker} = 1 Entry</p>
        )}
        <p>Total Entries: {raffle.totalEntries}</p>
        <p>Current Entries: {raffle.currentEntries}</p>
        <p>Time Remaining: {new Date(raffle.timeFrame).toLocaleString()}</p>
      </div>
      <div className="entry-section">
        <input
          type="number"
          placeholder={`Min ${raffle.creditConversion} tokens`}
          value={entryAmount}
          onChange={(e) => setEntryAmount(e.target.value)}
          style={{ maxWidth: '150px' }} // Make input shorter
        />
        <button onClick={handleEnterRaffle}>Enter Raffle</button>
      </div>
      {processing && (
        <div className="processing-modal">
          <div className="spinner"></div>
          <p>Your entry is being processed and will be counted soon...</p>
          <button onClick={() => setProcessing(false)}>Close</button>
        </div>
      )}
      <div className="leaderboard">
        <h3>Leaderboard (Top 10 entries)</h3>
        {raffle.entries && raffle.entries.length > 0 ? (
          raffle.entries.slice(0, 10).map((entry, index) => (
            <div key={index} className="leaderboard-entry">
              <span>{entry.walletAddress}</span>: <span>{entry.amount}</span>
            </div>
          ))
        ) : (
          <p>No entries yet.</p>
        )}
      </div>
    </div>
  );
};

export default RaffleDetail;
