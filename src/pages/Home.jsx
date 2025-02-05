import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';

const Home = () => {
  const [raffles, setRaffles] = useState([]);
  const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

  const fetchRaffles = async () => {
    try {
      const res = await axios.get(`${apiUrl}/raffles?liveOnly=true`);
      if (res.data.success) {
        setRaffles(res.data.raffles);
      }
    } catch (err) {
      console.error('Error fetching raffles:', err);
    }
  };

  useEffect(() => {
    fetchRaffles();
    const interval = setInterval(fetchRaffles, 5000);
    return () => clearInterval(interval);
  }, [apiUrl]);

  // Countdown timer logic
  const getTimeLeft = (timeFrame, status) => {
    if (status === "completed") return "Completed";
    const difference = new Date(timeFrame) - new Date();
    if (difference <= 0) return "Completed";
    const hours = Math.floor(difference / (1000 * 60 * 60));
    const minutes = Math.floor((difference / (1000 * 60)) % 60);
    const seconds = Math.floor((difference / 1000) % 60);
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
            className={`raffle-card ${raffle.status === "completed" ? "completed-raffle" : ""}`}
          >
            <h3>{raffle.prize || 'Raffle Prize'}</h3>
            <p>{raffle.status === "live" ? getTimeLeft(raffle.timeFrame, raffle.status) : "Completed"}</p>
            <p>Entries: {raffle.currentEntries.toFixed(2)}</p>
          </Link>
        ))}
      </div>
    </div>
  );
};

export default Home;
