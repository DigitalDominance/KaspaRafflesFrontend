"use client"

import { useState, useEffect } from "react"
import axios from "axios"
import { Link } from "react-router-dom"
import { motion, AnimatePresence } from "framer-motion"

const Home = () => {
  const [raffles, setRaffles] = useState([])
  const [currentPage, setCurrentPage] = useState(1)
  const rafflesPerPage = 6
  const apiUrl = process.env.REACT_APP_API_URL || "http://localhost:5000/api"

  const fetchRaffles = async () => {
    try {
      const res = await axios.get(`${apiUrl}/raffles`)
      if (res.data.success) {
        const sorted = res.data.raffles.sort((a, b) => b.currentEntries - a.currentEntries)
        setRaffles(sorted)
      }
    } catch (err) {
      console.error("Error fetching raffles:", err)
    }
  }

  useEffect(() => {
    fetchRaffles()
    const interval = setInterval(fetchRaffles, 10000)
    return () => clearInterval(interval)
  }, [apiUrl]) // Removed fetchRaffles from dependencies

  const indexOfLast = currentPage * rafflesPerPage
  const indexOfFirst = indexOfLast - rafflesPerPage
  const currentRaffles = raffles.slice(indexOfFirst, indexOfLast)
  const totalPages = Math.ceil(raffles.length / rafflesPerPage)

  const getTimeLeft = (timeFrame, status) => {
    if (status === "completed") return "Completed"
    const diff = new Date(timeFrame) - new Date()
    if (diff <= 0) return "Completed"
    const hours = Math.floor(diff / (1000 * 60 * 60))
    const minutes = Math.floor((diff / (1000 * 60)) % 60)
    const seconds = Math.floor((diff / 1000) % 60)
    return `${hours}h ${minutes}m ${seconds}s`
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
      <motion.div className="home-grid" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }}>
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
                <motion.h3 whileHover={{ scale: 1.05 }} transition={{ type: "spring", stiffness: 300 }}>
                  {raffle.prizeDisplay}
                </motion.h3>
                {raffle.status === "live" ? (
                  <>
                    <p>Entries: {raffle.currentEntries.toFixed(2)}</p>
                    <p>Winner Amount: {raffle.winnersCount}</p>
                    <motion.p
                      key={getTimeLeft(raffle.timeFrame, raffle.status)}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="time-remaining"
                    >
                      Time Remaining: {getTimeLeft(raffle.timeFrame, raffle.status)}
                    </motion.p>
                  </>
                ) : (
                  <>
                    {raffle.winnersCount > 1 ? (
                      <p>Winners: View Here</p>
                    ) : (
                      <p>Winner: {raffle.winner ? raffle.winner : "No Entries"}</p>
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
          >
            Previous
          </motion.button>
          <span>
            Page {currentPage} of {totalPages}
          </span>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
            disabled={currentPage === totalPages}
          >
            Next
          </motion.button>
        </motion.div>
      )}
    </motion.div>
  )
}

export default Home

