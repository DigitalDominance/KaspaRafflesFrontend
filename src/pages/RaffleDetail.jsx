'use client';

import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { useParams } from 'react-router-dom';
import { motion, AnimatePresence, useAnimation } from 'framer-motion';
import { FaClock, FaCoins, FaUserAlt, FaTrophy, FaUsers } from 'react-icons/fa';
import '../styles.css';

// Simple spinner for UI feedback.
const Spinner = () => (
  <div className="spinner" style={{ display: 'inline-block', marginLeft: '0.5rem' }} />
);

const TokenLogoBig = ({ ticker }) => {
  const [imgError, setImgError] = useState(false);
  const controls = useAnimation();
  const [animating, setAnimating] = useState(false);

  const tokenVariants = {
    initial: { scale: 1, rotateY: 0 },
    hover: { scale: 1.1, rotateY: 360 },
  };

  const handleHoverStart = () => {
    if (!animating) {
      setAnimating(true);
      controls.start("hover").then(() => {
        controls.start("initial");
        setAnimating(false);
      });
    }
  };

  if (imgError) {
    return (
      <motion.div 
        className="tokenLogoBig-fallback"
        animate={controls}
        initial="initial"
        variants={tokenVariants}
        onHoverStart={handleHoverStart}
        whileTap={{ scale: 0.95 }}
        transition={{ type: 'spring', stiffness: 300, damping: 80, duration: 3 }}
      >
        {ticker}
      </motion.div>
    );
  } else {
    return (
      <motion.img
        src={`https://kaspamarket.io/static/${ticker}.jpg`}
        alt={ticker}
        className="tokenLogoBig"
        onError={() => setImgError(true)}
        animate={controls}
        initial="initial"
        variants={tokenVariants}
        onHoverStart={handleHoverStart}
        whileTap={{ scale: 0.95 }}
        transition={{ type: 'spring', stiffness: 300, damping: 80, duration: 3 }}
      />
    );
  }
};

const RaffleDetail = ({ wallet }) => {
  const { raffleId } = useParams();
  const [raffle, setRaffle] = useState(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [entryAmount, setEntryAmount] = useState('');
  const [entryError, setEntryError] = useState('');
  const [entrySuccess, setEntrySuccess] = useState('');
  const [entryPage, setEntryPage] = useState(1);
  const [connectedAddress, setConnectedAddress] = useState('');
  const entriesPerPage = 6;
  const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

  // Helper: Live countdown.
  const getTimeLeft = (endTime) => {
    const diff = new Date(endTime) - new Date();
    if (diff <= 0) return 'Completed';
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff / (1000 * 60)) % 60);
    const seconds = Math.floor((diff / 1000) % 60);
    return `${hours}h ${minutes}m ${seconds}s`;
  };

  // Helper: Get connected Kasware address.
  const getConnectedAddress = useCallback(async () => {
    try {
      const accounts = await window.kasware.getAccounts();
      return accounts[0];
    } catch (err) {
      console.error('Error fetching connected account:', err);
      return null;
    }
  }, []);

  // Fetch raffle details with a cache-busting parameter.
  const fetchRaffle = useCallback(async () => {
    try {
      const res = await axios.get(`${apiUrl}/raffles/${raffleId}?t=${new Date().getTime()}`);
      if (res.data.success) {
        setRaffle(res.data.raffle);
      } else {
        setEntryError('Raffle not found');
      }
    } catch (err) {
      setEntryError('Error loading raffle details.');
      console.error('Error fetching raffle details:', err);
    } finally {
      setLoading(false);
    }
  }, [apiUrl, raffleId]);

  useEffect(() => {
    fetchRaffle();
    const updateConnectedAddress = async () => {
      const addr = await getConnectedAddress();
      if (addr) setConnectedAddress(addr);
    };
    updateConnectedAddress();
    const interval = setInterval(() => {
      fetchRaffle();
      updateConnectedAddress();
    }, 1000);
    return () => clearInterval(interval);
  }, [raffleId, apiUrl, fetchRaffle, getConnectedAddress]);

  // Compute "My Entries".
  const myEntries =
    raffle && raffle.entries && Array.isArray(raffle.entries)
      ? raffle.entries
          .filter((entry) => entry.walletAddress === connectedAddress)
          .reduce((sum, entry) => sum + entry.creditsAdded, 0)
      : 0;

  // Check if sufficient balance exists.
  const checkEntryBalance = async () => {
    if (!entryAmount || !raffle) return false;
    if (raffle.type === 'KAS') {
      try {
        const balance = await window.kasware.getBalance();
        const required = parseFloat(entryAmount) * 1e8;
        if (balance.total < required) {
          setEntryError('Insufficient KAS balance for entry.');
          return false;
        }
        return true;
      } catch (err) {
        console.error('Error checking KAS balance:', err);
        setEntryError('Error checking KAS balance.');
        return false;
      }
    } else {
      try {
        const tokenBalances = await window.kasware.getKRC20Balance();
        const tokenObj = tokenBalances.find(
          (token) => token.tick.toUpperCase() === raffle.tokenTicker.toUpperCase()
        );
        if (!tokenObj) {
          setEntryError(`Token ${raffle.tokenTicker.toUpperCase()} not found in your wallet.`);
          return false;
        }
        const dec = parseInt(tokenObj.dec, 10);
        const required = parseFloat(entryAmount) * Math.pow(10, dec);
        if (parseInt(tokenObj.balance, 10) < required) {
          setEntryError('Insufficient token balance for entry.');
          return false;
        }
        return true;
      } catch (err) {
        console.error('Error checking token balance:', err);
        setEntryError('Error checking token balance.');
        return false;
      }
    }
  };

  const handleEnterRaffle = async () => {
    setEntryError('');
    setEntrySuccess('');
    
    if (parseFloat(entryAmount) < parseFloat(raffle.creditConversion)) {
      setEntryError(`Minimum entry is ${raffle.creditConversion}`);
      return;
    }
    const hasFunds = await checkEntryBalance();
    if (!hasFunds) return;
  
    const currentAddress = await getConnectedAddress();
    if (!currentAddress) {
      setEntryError("Could not verify connected wallet address.");
      return;
    }
  
    setProcessing(true);
    try {
      let txid;
      if (raffle.type === 'KAS') {
        // For Kaspa, submit the transaction and await its response.
        txid = await window.kasware.sendKaspa(
          raffle.wallet.receivingAddress,
          parseFloat(entryAmount) * 1e8,
          { priorityFee: 10000 }
        );
      } else if (raffle.type === 'KRC20') {
        const transferJson = JSON.stringify({
          p: "KRC-20",
          op: "transfer",
          tick: raffle.tokenTicker,
          amt: (parseFloat(entryAmount) * 1e8).toString(),
          to: raffle.wallet.receivingAddress,
        });
        // For KRC20, use signKRC20Transaction.
        txid = await window.kasware.signKRC20Transaction(
          transferJson,
          4,
          raffle.wallet.receivingAddress,
          0.1
        );
      }
      if (!txid) {
        setEntryError("Transaction Failed");
        setProcessing(false);
        return;
      }
      
      // Now extract the TXID from the returned JSON.
      // For Kaspa, we assume the wallet returns a JSON string that includes an "id" field.
      let txidString = '';
      if (raffle.type === 'KAS') {
        const parsedTx = typeof txid === 'string' ? JSON.parse(txid) : txid;
        // Extract the top-level "id" field.
        txidString = parsedTx.id;
      } else if (raffle.type === 'KRC20') {
        const parsedTx = typeof txid === 'string' ? JSON.parse(txid) : txid;
        // For KRC20, we assume the response has a "commitTxStr" field that is a JSON string.
        const commitTx = typeof parsedTx.commitTxStr === 'string'
          ? JSON.parse(parsedTx.commitTxStr)
          : parsedTx.commitTxStr;
        txidString = commitTx.id;
      }
  
      // Immediately update the UI with the new TXID.
      setEntrySuccess(
        <>
          Entry Successful! TXID:{' '}
          <a
            className="txid-link small-txid"
            href={`https://kas.fyi/transaction/${txidString}`}
            target="_blank"
            rel="noopener noreferrer"
          >
            {txidString}
          </a>
        </>
      );
  
      // Post the entry to your backend.
      await axios.post(`${apiUrl}/raffles/${raffle.raffleId}/enter`, {
        txid: txidString,
        walletAddress: currentAddress,
        amount: parseFloat(entryAmount)
      });
  
    } catch (e) {
      console.error(e);
      setEntryError("Transaction Cancelled");
    } finally {
      await new Promise(resolve => setTimeout(resolve, 500));
      setProcessing(false);
      setEntryAmount('');
      fetchRaffle();
    }
  };

  // Aggregate raffle entries.
  const aggregatedEntries = raffle && raffle.entries
    ? Object.values(
        raffle.entries.reduce((acc, entry) => {
          if (!acc[entry.walletAddress]) {
            acc[entry.walletAddress] = { walletAddress: entry.walletAddress, creditsAdded: 0 };
          }
          acc[entry.walletAddress].creditsAdded += entry.creditsAdded;
          return acc;
        }, {})
      )
    : [];
  const sortedAggregated = aggregatedEntries.sort((a, b) => b.creditsAdded - a.creditsAdded);
  const totalEntryPages = Math.ceil(sortedAggregated.length / entriesPerPage);
  const displayedEntries = sortedAggregated.slice((entryPage - 1) * entriesPerPage, entryPage * entriesPerPage);

  if (loading) {
    return (
      <div className="raffle-detail page-container">
        <div className="loading-spinner"></div>
      </div>
    );
  }
  if (!raffle) {
    return (
      <div className="raffle-detail page-container">
        <p>No raffle data available.</p>
      </div>
    );
  }

  // (Prize dispersal UI remains unchanged.)
  let prizeDispersalInfo = null;
  let completedContent = null;
  if (raffle.status === "completed") {
    const winners = (raffle.winnersList && raffle.winnersList.length > 0)
      ? raffle.winnersList
      : (raffle.winner && raffle.winner !== "No Entries" ? [raffle.winner] : []);
    const txidByWinner = {};
    if (raffle.prizeDispersalTxids && raffle.prizeDispersalTxids.length > 0) {
      raffle.prizeDispersalTxids.forEach(record => {
        if (!txidByWinner[record.winnerAddress]) {
          txidByWinner[record.winnerAddress] = [];
        }
        txidByWinner[record.winnerAddress].push(record.txid);
      });
    }
    prizeDispersalInfo = winners.map((winner, idx) => {
      const prizeSent = txidByWinner[winner] && txidByWinner[winner].length > 0;
      const statusText = prizeSent ? "Complete!" : "In Progress...";
      return (
        <motion.div 
          key={idx} 
          className="prize-info"
          initial={{ opacity: 0, y: 20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          whileHover={{ scale: 1.05, y: -5, rotate: 1 }}
          whileTap={{ scale: 0.98 }}
          transition={{ type: "spring", stiffness: 300, damping: 20, delay: idx * 0.1 }}
        >
          <p className="prize-winner">
            <strong>Winner:</strong> {winner}
          </p>
          <p className="prize-status">
            <strong>Prize Sent:</strong> {statusText}
          </p>
          {prizeSent && (
            <div className="txid-container">
              <p className="txid-label">
                <strong>TXID(s):</strong>
              </p>
              <ul className="txid-list">
                {txidByWinner[winner].map((tx, txIdx) => (
                  <motion.li 
                    key={txIdx}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    whileHover={{ scale: 1.05, x: 5 }}
                    whileTap={{ scale: 0.98 }}
                    transition={{ type: "spring", stiffness: 300, damping: 20, delay: 0.1 * txIdx }}
                  >
                    <a
                      className="txid-link"
                      href={`https://kas.fyi/transaction/${tx}`}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      {tx}
                    </a>
                  </motion.li>
                ))}
              </ul>
            </div>
          )}
        </motion.div>
      );
    });
    completedContent = (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
      >
        {raffle.winnersCount > 1 ? (
          <div className="winners-list">
            <h3>Winners List:</h3>
            {raffle.winnersList && raffle.winnersList.length > 0 ? (
              raffle.winnersList.map((winner, index) => (
                <motion.p 
                  key={index}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  whileHover={{ scale: 1.05, x: 5 }}
                  transition={{ delay: 0.1 * index, type: "spring", stiffness: 300, damping: 20 }}
                >
                  {index + 1}. {winner}
                </motion.p>
              ))
            ) : (
              <p>No winners selected.</p>
            )}
          </div>
        ) : (
          <p className="single-winner">
            <strong>Winner: {raffle.winner ? raffle.winner : "No winner selected"}</strong>
          </p>
        )}
        <div className="prize-dispersal-section">
          <h3>Prize Dispersal Details</h3>
          {prizeDispersalInfo ? prizeDispersalInfo : <p>No prize transactions recorded.</p>}
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div 
      className="raffle-detail page-container"
      style={{ marginTop: '120px', textAlign: 'center' }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <motion.div 
        className="raffle-title-container"
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        transition={{ type: 'spring', stiffness: 300, damping: 20 }}
        style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}
      >
        <TokenLogoBig ticker={raffle.prizeTicker} />
        <span className="raffle-title">{raffle.prizeDisplay}</span>
      </motion.div>
      <motion.div 
        className={`raffle-detail-container ${raffle.status === "completed" ? "completed" : ""}`}
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.2 }}
      >
        <div className="raffle-info-detail">
          <motion.div 
            className="info-item"
            whileHover={{ scale: 1.02, y: -2 }}
            transition={{ type: "spring", stiffness: 300, damping: 20 }}
          >
            <FaCoins className="info-icon" />
            <p>Conversion: {raffle.creditConversion} {raffle.type === "KAS" ? "KAS" : raffle.tokenTicker} = 1 Entry</p>
          </motion.div>
          <motion.div 
            className="info-item"
            whileHover={{ scale: 1.02, y: -2 }}
            transition={{ type: "spring", stiffness: 300, damping: 20 }}
          >
            <FaTrophy className="info-icon" />
            <p>Winners: {raffle.winnersCount}</p>
          </motion.div>
          <motion.div 
            className="info-item"
            whileHover={{ scale: 1.02, y: -2 }}
            transition={{ type: "spring", stiffness: 300, damping: 20 }}
          >
            <FaUsers className="info-icon" />
            <p>Total Entries: {raffle.totalEntries.toFixed(2)}</p>
          </motion.div>
          <motion.div 
            className="info-item"
            whileHover={{ scale: 1.02, y: -2 }}
            transition={{ type: "spring", stiffness: 300, damping: 20 }}
          >
            <FaUserAlt className="info-icon" />
            <p>My Entries: {myEntries.toFixed(2)}</p>
          </motion.div>
          {raffle.status === "live" ? (
            <motion.div 
              className="info-item"
              whileHover={{ scale: 1.02, y: -2 }}
              transition={{ type: "spring", stiffness: 300, damping: 20 }}
            >
              <FaClock className="info-icon" />
              <p>Time Remaining: {getTimeLeft(raffle.timeFrame)}</p>
            </motion.div>
          ) : (
            <motion.div 
              className="info-item"
              whileHover={{ scale: 1.02, y: -2 }}
              transition={{ type: "spring", stiffness: 300, damping: 20 }}
            >
              <FaClock className="info-icon" />
              <p>Status: Completed</p>
            </motion.div>
          )}
        </div>
        {raffle.status === "completed" && completedContent}
      </motion.div>
      {raffle.status === "live" && (
        <motion.div 
          className="entry-section"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
        >
          <motion.input
            className="entry-input"
            type="number"
            placeholder={`Min ${raffle.creditConversion} tokens`}
            value={entryAmount}
            onChange={(e) => setEntryAmount(e.target.value)}
            whileHover={{ scale: 1.02 }}
            transition={{ type: "spring", stiffness: 300, damping: 20 }}
          />
          <motion.button 
            onClick={handleEnterRaffle}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.98 }}
            transition={{ type: "spring", stiffness: 300, damping: 20 }}
          >
            Enter Raffle
          </motion.button>
        </motion.div>
      )}
      <AnimatePresence>
        {entryError && (
          <motion.div 
            className="message error"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            whileHover={{ scale: 1.02 }}
            transition={{ type: "spring", stiffness: 300, damping: 20 }}
          >
            {entryError}
            <button className="close-button" onClick={() => setEntryError('')}>×</button>
          </motion.div>
        )}
      </AnimatePresence>
      <AnimatePresence>
        {entrySuccess && (
          <motion.div 
            className="message success"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            whileHover={{ scale: 1.02 }}
            transition={{ type: "spring", stiffness: 300, damping: 20 }}
          >
            {entrySuccess}
            <button className="close-button" onClick={() => setEntrySuccess('')}>×</button>
          </motion.div>
        )}
      </AnimatePresence>
      {processing && (
        <motion.div 
          className="processing-modal"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <div className="spinner"></div>
          <p>Your entry is being processed and will be counted soon...</p>
          <button className="close-button" onClick={() => setProcessing(false)}>×</button>
        </motion.div>
      )}
      <motion.div 
        className="leaderboard"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.8 }}
      >
        <h3>Leaderboard (Entries)</h3>
        {displayedEntries.length > 0 ? (
          displayedEntries.map((entry, index) => (
            <motion.div 
              key={index} 
              className="leaderboard-entry"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              whileHover={{ scale: 1.02, x: 5 }}
              transition={{ delay: 0.1 * index, type: "spring", stiffness: 300, damping: 20 }}
            >
              <span>{entry.walletAddress}</span>: <span>{entry.creditsAdded.toFixed(2)} entries</span>
            </motion.div>
          ))
        ) : (
          <p>No entries yet.</p>
        )}
        {totalEntryPages > 1 && (
          <div className="pagination">
            <motion.button 
              onClick={() => setEntryPage(prev => Math.max(prev - 1, 1))} 
              disabled={entryPage === 1}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.98 }}
              transition={{ type: "spring", stiffness: 300, damping: 20 }}
            >
              Previous
            </motion.button>
            <span>Page {entryPage} of {totalEntryPages}</span>
            <motion.button 
              onClick={() => setEntryPage(prev => Math.min(prev + 1, totalEntryPages))} 
              disabled={entryPage === totalEntryPages}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.98 }}
              transition={{ type: "spring", stiffness: 300, damping: 20 }}
            >
              Next
            </motion.button>
          </div>
        )}
      </motion.div>
    </motion.div>
  );
};

export default RaffleDetail;
