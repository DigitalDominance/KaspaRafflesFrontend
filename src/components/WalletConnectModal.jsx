import React from 'react';

const WalletConnectModal = ({ onConnect }) => {
  const handleConnect = async () => {
    if (window.kasware) {
      try {
        const accounts = await window.kasware.requestAccounts();
        onConnect({ address: accounts[0] });
      } catch (err) {
        console.error('Error connecting wallet:', err);
      }
    } else {
      alert('Please install KasWare Wallet');
    }
  };

  return (
    <div className="modal">
      <h2>Please connect your KasWare wallet</h2>
      <button onClick={handleConnect}>Connect Wallet</button>
    </div>
  );
};

export default WalletConnectModal;
