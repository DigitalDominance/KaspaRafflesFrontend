"use client"

import { useState, useEffect } from "react"
import { Link } from "react-router-dom"
import { motion } from "framer-motion"
import "../styles.css"

const Navbar = ({ wallet, onDisconnect }) => {
  const [isOpen, setIsOpen] = useState(false)
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768)
    }
    checkMobile()
    window.addEventListener("resize", checkMobile)
    return () => window.removeEventListener("resize", checkMobile)
  }, [])

  const handleDisconnect = async () => {
    try {
      const origin = window.location.origin
      await window.kasware.disconnect(origin)
      onDisconnect()
      console.log("Wallet disconnected")
    } catch (e) {
      console.error("Error disconnecting wallet:", e)
    }
  }

  const toggleMenu = () => setIsOpen(!isOpen)

  return (
    <motion.nav
      className="navbar"
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ type: "spring", stiffness: 120, damping: 20 }}
    >
      <div className="navbar-container">
        <motion.div className="navbar-logo" whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
          <Link to="/">KASPA RAFFLES</Link>
        </motion.div>
        <div className="navbar-menu">
          {(!isMobile || isOpen) && (
            <motion.div
              className="navbar-links"
              initial={isMobile ? { opacity: 0, height: 0 } : false}
              animate={isMobile ? { opacity: 1, height: "auto" } : false}
              exit={isMobile ? { opacity: 0, height: 0 } : false}
              transition={{ duration: 0.3 }}
            >
              <NavLink to="/profile">My Raffles</NavLink>
              <NavLink to="/create">Create Raffle</NavLink>
              <motion.button onClick={handleDisconnect} whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                Disconnect Wallet
              </motion.button>
            </motion.div>
          )}
          {isMobile && (
            <motion.div
              className={`navbar-toggle ${isOpen ? "active" : ""}`}
              onClick={toggleMenu}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
            >
              <span></span>
              <span></span>
              <span></span>
            </motion.div>
          )}
        </div>
      </div>
    </motion.nav>
  )
}

const NavLink = ({ to, children }) => (
  <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
    <Link to={to} className="nav-link">
      {children}
      <motion.div
        className="link-underline"
        initial={{ scaleX: 0 }}
        whileHover={{ scaleX: 1 }}
        transition={{ duration: 0.3 }}
      />
    </Link>
  </motion.div>
)

export default Navbar

