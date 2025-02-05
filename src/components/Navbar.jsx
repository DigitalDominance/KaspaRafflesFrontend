import React from 'react';
import { Link } from 'react-router-dom';

const Navbar = ({ wallet, onDisconnect }) => {
  return (
    <nav className="navbar">
      <div className="navbar-left">
        <Link to="/">Kaspa Raffles</Link>
      </div>
      <div className="navbar-right">
        <Link to="/profile">My Raffles</Link>
        <Link to="/create">Create Raffle</Link>
        <button onClick={onDisconnect}>Disconnect</button>
      </div>
    </nav>
  );
};

export default Navbar;
