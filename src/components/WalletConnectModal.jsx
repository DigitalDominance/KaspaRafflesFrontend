import React from 'react';
import '../styles.css';

const WalletConnectModal = ({ onConnect }) => {
  const handleConnect = async () => {
    if (window.kasware) {
      try {
        const accounts = await window.kasware.requestAccounts();
        console.log("Connected wallet:", accounts[0]);
        onConnect({ address: accounts[0] });
      } catch (err) {
        console.error('Error connecting wallet:', err);
      }
    } else {
      alert('Please install KasWare Wallet');
    }
  };

  return (
    <div className="modal modal-centered">
      <div className="modal-content">
        <h2>Connect Your KasWare Wallet</h2>
        <button onClick={handleConnect}>Connect Wallet</button>
      </div>
    </div>
  );
};

export default WalletConnectModal;
