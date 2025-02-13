"use client";

import { useState, useEffect, useCallback } from "react";
import axios from "axios";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { FaClock, FaTrophy, FaUserAlt, FaUsers, FaCrown, FaClipboardList } from "react-icons/fa";
import "../styles.css";

const Home = () => {
  const [raffles, setRaffles] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [now, setNow] = useState(new Date()); // state to keep current time
  const rafflesPerPage = 6;
  const apiUrl = process.env.REACT_APP_API_URL || "http://localhost:5000/api";

  // Fetch raffles from the server once (or at a slower interval)
  const fetchRaffles = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await axios.get(`${apiUrl}/raffles`);
      if (res.data.success) {
        const sorted = res.data.raffles.sort((a, b) => b.currentEntries - a.currentEntries);
        setRaffles(sorted);
      } else {
        setError("Failed to fetch raffles");
      }
    } catch (err) {
      console.error("Error fetching raffles:", err);
      setError("An error occurred while fetching raffles");
    } finally {
      setLoading(false);
    }
  }, [apiUrl]);

  useEffect(() => {
    fetchRaffles();
    // Optionally, if you want to refresh raffles periodically, set a longer interval (e.g., every minute)
    // const fetchInterval = setInterval(fetchRaffles, 60000);
    // return () => clearInterval(fetchInterval);
  }, [fetchRaffles]);

  // Update the current time every second so the time remaining display updates
  useEffect(() => {
    const timer = setInterval(() => {
      setNow(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const indexOfLast = currentPage * rafflesPerPage;
  const indexOfFirst = indexOfLast - rafflesPerPage;
  const currentRaffles = raffles.slice(indexOfFirst, indexOfLast);
  const totalPages = Math.ceil(raffles.length / rafflesPerPage);

  const getTimeLeft = (timeFrame, status) => {
    if (status === "completed") return "Completed";
    const diff = new Date(timeFrame) - now;
    if (diff <= 0) return "Completed";
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((diff / 1000) % 60);
    return `${days}d ${hours}h ${minutes}m ${seconds}s`;
  };

  const pageNumbers = [];
  for (let i = 1; i <= totalPages; i++) {
    pageNumbers.push(i);
  }

  return (
    <motion.div className="home page-container" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
      <motion.h1
        className="global-heading"
        initial={{ y: -50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.2 }}
      >
        Popular Raffles
      </motion.h1>
      {loading && <div className="home-loading-spinner"></div>}
      {error && <p className="error-message">{error}</p>}
      {!loading && !error && (
        <>
          <motion.div
            className="home-grid"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
          >
            <AnimatePresence>
              {currentRaffles.map((raffle, index) => (
                <motion.div
                  key={raffle.raffleId}
                  initial={{ opacity: 0, y: 50 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -50 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <Link
                    to={`/raffle/${raffle.raffleId}`}
                    className={`home-raffle-card ${raffle.status === "completed" ? "completed" : ""}`}
                  >
                    <motion.h3 
                      whileHover={{ scale: 1.05 }} 
                      transition={{ type: "spring", stiffness: 300 }}
                    >
                      <FaCrown className="info-icon3" /> {raffle.prizeDisplay}
                    </motion.h3>

                    {raffle.status === "live" ? (
                      <>
                        <div className="raffle-info">
                          <FaClipboardList className="info-icon" />
                          <p>Total Entries: {raffle.currentEntries.toFixed(2)}</p>
                        </div>
                        <div className="raffle-info">
                          <FaUsers className="info-icon" />
                          <p>Winners: {raffle.winnersCount}</p>
                        </div>
                        <div className="raffle-info">
                          <FaClock className="info-icon" />
                          <motion.p
                            key={getTimeLeft(raffle.timeFrame, raffle.status)}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="time-remaining"
                          >
                            Time Left: {getTimeLeft(raffle.timeFrame, raffle.status)}
                          </motion.p>
                        </div>
                      </>
                    ) : (
                      <>
                        <p className="total-entries-info">
                          <FaClipboardList className="info-icon2" /> Total Entries: {raffle.totalEntries.toFixed(2)}
                        </p>
                        <p className="status-info">
                          <FaClock className="info-icon2" /> Status: Completed
                        </p>
                        {raffle.winnersCount > 1 ? ( 
                          <p className="winners-info">
                            <FaUsers className="info-icon2" /> Winners: View Here
                          </p>
                        ) : (
                          <p className="winner-info">
                            <FaUserAlt className="info-icon2" /> Winner: {raffle.winner ? raffle.winner : "No Entries"}
                          </p>
                        )}
                      </>
                    )}
                  </Link>
                </motion.div>
              ))}
            </AnimatePresence>
          </motion.div>
          {totalPages > 1 && (
            <motion.div
              className="home-pagination"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
            >
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className="pagination-arrow"
              >
                &lt;
              </motion.button>
              {pageNumbers.map((number) => (
                <motion.button
                  key={number}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setCurrentPage(number)}
                  className={`pagination-number ${currentPage === number ? "active" : ""}`}
                >
                  {number}
                </motion.button>
              ))}
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
                className="pagination-arrow"
              >
                &gt;
              </motion.button>
            </motion.div>
          )}
        </>
      )}
    </motion.div>
  );
};

export default Home;
