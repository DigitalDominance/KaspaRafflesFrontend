import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';

const Home = () => {
  const [raffles, setRaffles] = useState([]);

  useEffect(() => {
    const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';
    const fetchRaffles = async () => {
      try {
        const res = await axios.get(`${apiUrl}/raffles`);
        if (res.data.success) {
          setRaffles(res.data.raffles);
        }
      } catch (err) {
        console.error('Error fetching raffles:', err);
      }
    };
    fetchRaffles();
  }, []);

  return (
    <div className="home page-container">
      <h1>Popular Raffles</h1>
      <div className="raffles-grid">
        {raffles.map((raffle) => (
          <Link key={raffle.raffleId} to={`/raffle/${raffle.raffleId}`} className="raffle-card">
            <h3>{raffle.prize || 'Raffle Prize'}</h3>
            <p>Entries: {raffle.currentEntries}</p>
            <p>Time Remaining: {new Date(raffle.timeFrame).toLocaleString()}</p>
          </Link>
        ))}
      </div>
    </div>
  );
};

export default Home;
