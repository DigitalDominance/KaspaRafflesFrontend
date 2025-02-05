// frontend/src/pages/Home.jsx
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';

const Home = () => {
  const [raffles, setRaffles] = useState([]);
  const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

  const fetchRaffles = async () => {
    try {
      // Fetch raffles that are live or completed within the last 12 hours.
      const res = await axios.get(`${apiUrl}/raffles`);
      if (res.data.success) {
        setRaffles(res.data.raffles);
      }
    } catch (err) {
      console.error('Error fetching raffles:', err);
    }
  };

  useEffect(() => {
    fetchRaffles();
    const interval = setInterval(fetchRaffles, 1000);
    return () => clearInterval(interval);
  }, [apiUrl]);

  // Calculate countdown timer.
  const getTimeLeft = (timeFrame, status) => {
    if (status === "completed") return "Completed";
    const diff = new Date(timeFrame) - new Date();
    if (diff <= 0) return "Completed";
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff / (1000 * 60)) % 60);
    const seconds = Math.floor((diff / 1000) % 60);
    return `${hours}h ${minutes}m ${seconds}s`;
  };

  return (
    <div className="home page-container">
      <h1>Popular Raffles</h1>
      <div className="raffles-grid">
        {raffles.sort((a, b) => b.currentEntries - a.currentEntries)
          .map((raffle) => (
            <Link
              key={raffle.raffleId}
              to={`/raffle/${raffle.raffleId}`}
              className={`home-raffle-card ${raffle.status === "completed" ? "completed" : ""}`}
            >
              <h3>{raffle.prize || 'Raffle Prize'}</h3>
              <p>{raffle.status === "live" ? getTimeLeft(raffle.timeFrame, raffle.status) : "Completed"}</p>
              <p>Entries: {raffle.currentEntries.toFixed(2)}</p>
              {raffle.status === "completed" && raffle.winner ? (
                <p>Winner: {raffle.winner}</p>
              ) : (
                <p>No Entries</p>
              )}
            </Link>
        ))}
      </div>
    </div>
  );
};

export default Home;
