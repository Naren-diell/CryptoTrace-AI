// src/services/ethereumService.js
// Wraps the Etherscan API for Ethereum wallet & transaction lookups.
const axios = require('axios');

const BASE_URL = 'https://api.etherscan.io/api';
const ETH_USD_FALLBACK = 3000; // used only if a live price lookup fails; clearly a placeholder

function weiToEth(wei) {
  return Number(wei) / 1e18;
}

async function getEthPriceUsd() {
  try {
    const { data } = await axios.get(BASE_URL, {
      params: { module: 'stats', action: 'ethprice', apikey: process.env.ETHERSCAN_API_KEY }
    });
    const price = parseFloat(data?.result?.ethusd);
    return Number.isFinite(price) && price > 0 ? price : ETH_USD_FALLBACK;
  } catch {
    return ETH_USD_FALLBACK;
  }
}

async function getBalance(address) {
  const { data } = await axios.get(BASE_URL, {
    params: {
      module: 'account',
      action: 'balance',
      address,
      tag: 'latest',
      apikey: process.env.ETHERSCAN_API_KEY
    }
  });
  if (data.status !== '1' && data.message !== 'OK') {
    throw new Error(data.result || 'Etherscan balance lookup failed');
  }
  return weiToEth(data.result);
}

async function getTransactions(address, { page = 1, offset = 100 } = {}) {
  const { data } = await axios.get(BASE_URL, {
    params: {
      module: 'account',
      action: 'txlist',
      address,
      startblock: 0,
      endblock: 99999999,
      page,
      offset,
      sort: 'desc',
      apikey: process.env.ETHERSCAN_API_KEY
    }
  });

  if (data.status !== '1') {
    // status "0" with message "No transactions found" is a valid empty result
    if (data.message === 'No transactions found') return [];
    throw new Error(data.result || 'Etherscan transaction lookup failed');
  }

  return data.result.map(tx => ({
    txHash: tx.hash,
    fromAddress: tx.from,
    toAddress: tx.to,
    amount: weiToEth(tx.value),
    fee: weiToEth(BigInt(tx.gasUsed || 0) * BigInt(tx.gasPrice || 0)),
    blockNumber: Number(tx.blockNumber),
    timestamp: new Date(Number(tx.timeStamp) * 1000),
    isError: tx.isError === '1'
  }));
}

async function getWalletSummary(address) {
  const [balance, txs, ethPrice] = await Promise.all([
    getBalance(address),
    getTransactions(address),
    getEthPriceUsd()
  ]);

  const timestamps = txs.map(t => t.timestamp.getTime());
  const firstTxAt = timestamps.length ? new Date(Math.min(...timestamps)) : null;
  const lastTxAt = timestamps.length ? new Date(Math.max(...timestamps)) : null;

  return {
    address,
    chain: 'ethereum',
    balance,
    balanceUsd: balance * ethPrice,
    totalTxCount: txs.length,
    firstTxAt,
    lastTxAt,
    transactions: txs,
    priceUsd: ethPrice
  };
}

module.exports = { getBalance, getTransactions, getWalletSummary, getEthPriceUsd };
