'use client';

import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import '../styles.css';

const Navbar = ({ wallet, onDisconnect }) => {
  const [isOpen, setIsOpen] = useState(false);

  const handleDisconnect = async () => {
    try {
      const origin = window.location.origin;
      await window.kasware.disconnect(origin);
      onDisconnect();
      console.log('Wallet disconnected');
    } catch (e) {
      console.error('Error disconnecting wallet:', e);
    }
  };

  const toggleMenu = () => setIsOpen(!isOpen);

  return (
    <motion.nav
      className="navbar"
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ type: 'spring', stiffness: 120, damping: 20 }}
    >
      <div className="navbar-container">
        <motion.div
          className="navbar-logo"
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
        >
          <Link to="/">KASPA RAFFLES</Link>
        </motion.div>
        <div className="navbar-menu">
          <motion.div
            className={`navbar-links ${isOpen ? 'active' : ''}`}
            initial={false}
            animate={isOpen ? { height: 'auto' } : { height: 0 }}
            transition={{ duration: 0.3 }}
          >
            <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
              <Link to="/profile">My Raffles</Link>
            </motion.div>
            <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
              <Link to="/create">Create Raffle</Link>
            </motion.div>
            <motion.button
              onClick={handleDisconnect}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              Disconnect Wallet
            </motion.button>
          </motion.div>
          <motion.div
            className="navbar-toggle"
            onClick={toggleMenu}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
          >
            <span></span>
            <span></span>
            <span></span>
          </motion.div>
        </div>
      </div>
    </motion.nav>
  );
};

export default Navbar;
