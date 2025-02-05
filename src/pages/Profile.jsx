import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';

const Profile = ({ wallet }) => {
  const [myRaffles, setMyRaffles] = useState([]);

  useEffect(() => {
    const fetchMyRaffles = async () => {
      try {
        // Extend your backend to support filtering by creator if desired.
        const res = await axios.get(`/api/raffles?creator=${wallet.address}`);
        if (res.data.success) {
          setMyRaffles(res.data.raffles);
        }
      } catch (err) {
        console.error('Error fetching user raffles:', err);
      }
    };
    fetchMyRaffles();
  }, [wallet.address]);

  return (
    <div className="profile-page">
      <h1>My Raffles</h1>
      {myRaffles.length === 0 ? (
        <p>You haven't created any raffles yet.</p>
      ) : (
        <div className="raffles-list">
          {myRaffles.map((raffle) => (
            <Link key={raffle.raffleId} to={`/raffle/${raffle.raffleId}`} className="raffle-card">
              <h3>{raffle.prize || 'Raffle Prize'}</h3>
              <p>Entries: {raffle.currentEntries}</p>
              <p>Time Remaining: {new Date(raffle.timeFrame).toLocaleString()}</p>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
};

export default Profile;
