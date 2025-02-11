import { motion } from "framer-motion"
import "../styles.css"

const Footer = () => {
  const currentYear = new Date().getFullYear()

  return (
    <footer className="app-footer">
      <div className="footer-content">
        <motion.a
          href="https://www.kaspercoin.net"
          target="_blank"
          rel="noopener noreferrer"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <img src="/assets/KasperLogo.png" alt="Kasper Logo" className="footer-logo" />
        </motion.a>
      </div>
      <div className="footer-bottom">
        <p>&copy; {currentYear} Kaspa Raffles. All rights reserved.</p>
      </div>
    </footer>
  )
}

export default Footer

