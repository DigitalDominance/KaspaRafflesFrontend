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
  const [entryError, setEntryError] = useState('');
  // Pagination for leaderboard entries
  const [entryPage, setEntryPage] = useState(1);
  const entriesPerPage = 6;
  const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

  // Fetch raffle details from backend
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
    const interval = setInterval(fetchRaffle, 1000);
    return () => clearInterval(interval);
  }, [raffleId, apiUrl]);

  // Check if user has sufficient balance for an entry
  const checkEntryBalance = async () => {
    if (!entryAmount || !raffle) return false;
    if (raffle.type === 'KAS') {
      try {
        const balance = await window.kasware.getBalance();
        if (balance.confirmed < entryAmount * 1e8) {
          setEntryError('Insufficient KAS balance for entry.');
          return false;
        }
        return true;
      } catch (err) {
        console.error('Error checking KAS balance:', err);
        setEntryError('Error checking KAS balance.');
        return false;
      }
    } else { // KRC20
      try {
        const tokenBalances = await window.kasware.getKRC20Balance();
        // Use raffle.tokenTicker for entry tokens
        const tokenObj = tokenBalances.find(
          (token) => token.tick.toUpperCase() === raffle.tokenTicker.toUpperCase()
        );
        if (!tokenObj) {
          setEntryError(`Token ${raffle.tokenTicker.toUpperCase()} not found in your wallet.`);
          return false;
        }
        const dec = parseInt(tokenObj.dec, 10);
        const required = entryAmount * Math.pow(10, dec);
        if (parseInt(tokenObj.balance, 10) < required) {
          setEntryError('Insufficient token balance for entry.');
          return false;
        }
        return true;
      } catch (err) {
        console.error('Error checking KRC20 balance:', err);
        setEntryError('Error checking token balance.');
        return false;
      }
    }
  };

  // Handle user entry submission
  const handleEnterRaffle = async () => {
    // Clear previous error
    setEntryError('');
    if (parseFloat(entryAmount) < parseFloat(raffle.creditConversion)) {
      alert(`Minimum entry is ${raffle.creditConversion}`);
      return;
    }
    // Check wallet balance for entry
    const hasFunds = await checkEntryBalance();
    if (!hasFunds) return;
    
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
      // Post the TXID along with entry details to our backend.
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

  // Pagination for leaderboard: sort entries by confirmedAt descending
  const sortedEntries = raffle && raffle.entries && raffle.entries.length > 0
    ? [...raffle.entries].sort((a, b) => new Date(b.confirmedAt) - new Date(a.confirmedAt))
    : [];
  const totalEntryPages = Math.ceil(sortedEntries.length / entriesPerPage);
  const displayedEntries = sortedEntries.slice((entryPage - 1) * entriesPerPage, entryPage * entriesPerPage);

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
      {entryError && (
        <div className="error-message" style={{ marginTop: '1rem', color: 'red', textAlign: 'center' }}>
          {entryError}
          <button className="close-button" onClick={() => setEntryError('')} style={{ marginLeft: '1rem' }}>×</button>
        </div>
      )}
      {processing && (
        <div className="processing-modal">
          <div className="spinner"></div>
          <p>Your entry is being processed and will be counted soon...</p>
          <button className="close-button" onClick={() => setProcessing(false)}>×</button>
        </div>
      )}
      <div className="leaderboard">
        <h3>Leaderboard (Entries)</h3>
        {displayedEntries.length > 0 ? (
          displayedEntries.map((entry, index) => (
            <div key={index} className="leaderboard-entry">
              <span>{entry.walletAddress}</span>: <span>{entry.creditsAdded.toFixed(2)} entries</span>
            </div>
          ))
        ) : (
          <p>No entries yet.</p>
        )}
        {totalEntryPages > 1 && (
          <div className="pagination">
            <button onClick={() => setEntryPage(prev => Math.max(prev - 1, 1))} disabled={entryPage === 1}>
              Previous
            </button>
            <span>Page {entryPage} of {totalEntryPages}</span>
            <button onClick={() => setEntryPage(prev => Math.min(prev + 1, totalEntryPages))} disabled={entryPage === totalEntryPages}>
              Next
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default RaffleDetail;
