import { motion } from "framer-motion"
import "../styles.css"
import Footer from "./Footer"

const WalletConnectLanding = ({ onConnect }) => {
  const handleConnect = async () => {
    if (window.kasware) {
      try {
        const accounts = await window.kasware.requestAccounts()
        console.log("Connected wallet:", accounts[0])
        onConnect({ address: accounts[0] })
      } catch (err) {
        console.error("Error connecting wallet:", err)
      }
    } else {
      alert("Please install KasWare Wallet")
    }
  }

  return (
    <div className="landing-container">
      <motion.div
        className="landing-content"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
      >
        <h1 className="landing-heading">KASPA RAFFLES</h1>
        <h3 className="landing-subheading">Connect wallet to login</h3>
        <motion.button
          className="landing-button"
          onClick={handleConnect}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          Connect Wallet
          <div className="button-background" />
        </motion.button>
      </motion.div>
      <Footer />
    </div>
  )
}

export default WalletConnectLanding

