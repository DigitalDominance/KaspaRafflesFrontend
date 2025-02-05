// frontend/src/pages/RaffleDetail.jsx
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
    console.log("Transaction sent, txid:", txid);
    // Now, post the TXID to our new endpoint.
    const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';
    const resEntry = await axios.post(`${apiUrl}/raffles/${raffle.raffleId}/enter`, {
      txid,
      walletAddress: wallet.address,
      amount: parseFloat(entryAmount)
    });
    if (resEntry.data.success) {
      alert("Entry recorded successfully.");
    } else {
      alert("Entry recording failed.");
    }
  } catch (e) {
    console.error(e);
    alert("Transaction failed");
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
      <h1>{raffle.prizeDisplay}</h1>
      <div className="raffle-detail-container">
        {raffle.status === "live" ? (
          <p>Conversion: {raffle.creditConversion} {raffle.type === "KAS" ? "KAS" : raffle.tokenTicker} = 1 Entry</p>
        ) : (
          <>
            <p>Conversion: {raffle.creditConversion} {raffle.type === "KAS" ? "KAS" : raffle.tokenTicker} = 1 Entry</p>
            <p><strong>Winner: {raffle.winner ? raffle.winner : "No Entries"}</strong></p>
          </>
        )}
        <p>Total Entries: {raffle.totalEntries.toFixed(2)}</p>
        <p>Current Entries: {raffle.currentEntries.toFixed(2)}</p>
        <p>{raffle.status === "live" ? `Time Remaining: ${new Date(raffle.timeFrame).toLocaleString()}` : "Completed"}</p>
      </div>
      {raffle.status === "live" && (
        <div className="entry-section">
          <input
            type="number"
            placeholder={`Min ${raffle.creditConversion} tokens`}
            value={entryAmount}
            onChange={(e) => setEntryAmount(e.target.value)}
          />
          <button onClick={handleEnterRaffle}>Enter Raffle</button>
        </div>
      )}
      {processing && (
        <div className="processing-modal">
          <div className="spinner"></div>
          <p>Your entry is being processed and will be counted soon...</p>
          <button onClick={() => setProcessing(false)}>Close</button>
        </div>
      )}
      <div className="leaderboard">
        <h3>Leaderboard (Top 10 wallets by entries)</h3>
        {raffle.entries && raffle.entries.length > 0 ? (
          Object.entries(
            raffle.entries.reduce((acc, entry) => {
              acc[entry.walletAddress] = (acc[entry.walletAddress] || 0) + entry.creditsAdded;
              return acc;
            }, {})
          )
            .sort(([, aCredits], [, bCredits]) => bCredits - aCredits)
            .slice(0, 10)
            .map(([walletAddress, totalCredits], index) => (
              <div key={index} className="leaderboard-entry">
                <span style={{ wordWrap: 'break-word' }}>{walletAddress}</span>: <span>{totalCredits.toFixed(2)} entries</span>
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
