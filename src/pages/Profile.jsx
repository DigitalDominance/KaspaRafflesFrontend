// frontend/src/pages/Profile.jsx
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';

const Profile = ({ wallet }) => {
  const [myRaffles, setMyRaffles] = useState([]);
  const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

  const fetchMyRaffles = async () => {
    try {
      const res = await axios.get(`${apiUrl}/raffles?creator=${wallet.address}`);
      if (res.data.success) {
        setMyRaffles(res.data.raffles);
      }
    } catch (err) {
      console.error('Error fetching user raffles:', err);
    }
  };

  useEffect(() => {
    fetchMyRaffles();
  }, [wallet.address, apiUrl]);

  return (
    <div className="profile-page page-container">
      <h1>My Raffles</h1>
      {myRaffles.length === 0 ? (
        <p>You haven't created any raffles yet.</p>
      ) : (
        <div className="raffles-grid">
          {myRaffles.map((raffle) => (
            <Link
              key={raffle.raffleId}
              to={`/raffle/${raffle.raffleId}`}
              className={`profile-raffle-card ${raffle.status === "completed" ? "completed" : ""}`}
            >
              <h3>{raffle.prize || 'Raffle Prize'}</h3>
              <p>Entries: {raffle.currentEntries.toFixed(2)}</p>
              <p>
                {raffle.status === "live"
                  ? `Time Left: ${new Date(raffle.timeFrame).toLocaleString()}`
                  : `Completed - Winner: ${raffle.winner ? raffle.winner : "No Entries"}`}
              </p>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
};

export default Profile;
