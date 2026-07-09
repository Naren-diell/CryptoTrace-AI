// src/services/blockchainService.js
// Single entry point that routes wallet lookups to the correct chain-specific service.
const ethereumService = require('./ethereumService');
const bitcoinService = require('./bitcoinService');
const { WALLET_REGEX } = require('../config/constants');

function detectChain(address) {
  if (WALLET_REGEX.ethereum.test(address)) return 'ethereum';
  if (WALLET_REGEX.bitcoin.test(address)) return 'bitcoin';
  return null;
}

async function getWalletSummary(address, chainHint = null) {
  const chain = chainHint || detectChain(address);
  if (!chain) {
    const err = new Error('Unrecognized wallet address format. Supported: Bitcoin, Ethereum.');
    err.statusCode = 422;
    throw err;
  }

  if (chain === 'ethereum') return ethereumService.getWalletSummary(address);
  if (chain === 'bitcoin') return bitcoinService.getWalletSummary(address);

  const err = new Error(`Unsupported chain: ${chain}`);
  err.statusCode = 400;
  throw err;
}

module.exports = { detectChain, getWalletSummary };
