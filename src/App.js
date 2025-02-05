import React, { useState } from 'react';
import WalletConnectModal from './components/WalletConnectModal';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import CreateRaffle from './pages/CreateRaffle';
import RaffleDetail from './pages/RaffleDetail';
import Profile from './pages/Profile';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';

function App() {
  const [wallet, setWallet] = useState(null);

  const handleWalletConnect = (walletInfo) => {
    setWallet(walletInfo);
  };

  const handleWalletDisconnect = () => {
    setWallet(null);
  };

  return (
    <Router>
      {!wallet && <WalletConnectModal onConnect={handleWalletConnect} />}
      {wallet && (
        <div>
          <Navbar wallet={wallet} onDisconnect={handleWalletDisconnect} />
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/create" element={<CreateRaffle wallet={wallet} />} />
            <Route path="/raffle/:raffleId" element={<RaffleDetail wallet={wallet} />} />
            <Route path="/profile" element={<Profile wallet={wallet} />} />
          </Routes>
        </div>
      )}
    </Router>
  );
}

export default App;
