"use client"

import { useState, useEffect, useCallback } from "react"
import axios from "axios"
import { Link } from "react-router-dom"
import { motion, AnimatePresence } from "framer-motion"
import { FaTrophy, FaClock, FaUsers } from "react-icons/fa"
import "../styles.css"

const Profile = () => {
  const [myRaffles, setMyRaffles] = useState([])
  const [currentPage, setCurrentPage] = useState(1)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const rafflesPerPage = 6
  const apiUrl = process.env.REACT_APP_API_URL || "http://localhost:5000/api"

  const getConnectedAddress = useCallback(async () => {
    try {
      const accounts = await window.kasware.getAccounts()
      return accounts[0]
    } catch (error) {
      console.error("Error fetching connected account:", error)
      return null
    }
  }, [])

  const fetchMyRaffles = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const currentAddress = await getConnectedAddress()
      if (!currentAddress) {
        setError("Unable to fetch connected address")
        return
      }

      const res = await axios.get(`${apiUrl}/raffles?creator=${currentAddress}`)
      if (res.data.success) {
        const live = res.data.raffles.filter((r) => r.status === "live")
        const completed = res.data.raffles.filter((r) => r.status !== "live")

        live.sort((a, b) => new Date(a.timeFrame) - new Date(b.timeFrame))
        completed.sort((a, b) => new Date(b.completedAt) - new Date(a.completedAt))

        const sortedRaffles = [...live, ...completed]
        setMyRaffles(sortedRaffles)
      } else {
        setError("Failed to fetch raffles")
      }
    } catch (err) {
      console.error("Error fetching user raffles:", err)
      setError("Failed to load raffles. Please try again.")
    } finally {
      setLoading(false)
    }
  }, [apiUrl, getConnectedAddress])

  useEffect(() => {
    fetchMyRaffles()
  }, [fetchMyRaffles])

  const indexOfLast = currentPage * rafflesPerPage
  const indexOfFirst = indexOfLast - rafflesPerPage
  const currentRaffles = myRaffles.slice(indexOfFirst, indexOfLast)
  const totalPages = Math.ceil(myRaffles.length / rafflesPerPage)

  const getTimeLeft = (endTime) => {
    const end = new Date(endTime)
    if (isNaN(end.getTime())) return "Invalid Date"
    const diff = end - new Date()
    if (diff <= 0) return "Ended"
    const days = Math.floor(diff / (1000 * 60 * 60 * 24))
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
    return `${days}d ${hours}h ${minutes}m`
  }

  return (
    <motion.div
      className="profile-page page-container"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <h1 className="global-heading">My Raffles</h1>
      {loading && <div className="profile-loading-spinner"></div>}
      {error && <p className="error-message">{error}</p>}
      {!loading && !error && myRaffles.length === 0 && (
        <motion.p initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          You haven't created any raffles yet.
        </motion.p>
      )}
      {!loading && !error && myRaffles.length > 0 && (
        <>
          <motion.div
            className="raffles-grid"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2, staggerChildren: 0.1 }}
          >
            <AnimatePresence>
              {currentRaffles.map((raffle, index) => (
                <motion.div
                  key={raffle.raffleId}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <Link
                    to={`/raffle/${raffle.raffleId}`}
                    className={`profile-raffle-card ${raffle.status === "completed" ? "completed" : ""}`}
                  >
                    <h3>{raffle.prizeDisplay}</h3>
                    {raffle.status === "live" ? (
                      <>
                        <div className="raffle-info">
                          <FaTrophy className="info-icon" />
                          <p>Entries: {raffle.currentEntries.toFixed(2)}</p>
                        </div>
                        <div className="raffle-info">
                          <FaUsers className="info-icon" />
                          <p>Winners: {raffle.winnersCount}</p>
                        </div>
                        <div className="raffle-info">
                          <FaClock className="info-icon" />
                          <p>Time Left: {getTimeLeft(raffle.timeFrame)}</p>
                        </div>
                      </>
                    ) : (
                      <>
                        {raffle.winnersCount > 1 ? (
                          <p className="winners-info">Winners: View Here</p>
                        ) : (
                          <p className="winner-info">Winner: {raffle.winner ? raffle.winner : "No Entries"}</p>
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
              className="pagination"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
            >
              <button onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))} disabled={currentPage === 1}>
                Previous
              </button>
              <span>
                Page {currentPage} of {totalPages}
              </span>
              <button
                onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
              >
                Next
              </button>
            </motion.div>
          )}
        </>
      )}
    </motion.div>
  )
}

export default Profile

