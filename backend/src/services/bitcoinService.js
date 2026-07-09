// src/services/bitcoinService.js
// Wraps Blockchain.com (primary, no key required) and Blockchair (secondary) APIs
// for Bitcoin wallet & transaction lookups.
const axios = require('axios');

const BLOCKCHAIN_INFO_BASE = process.env.BLOCKCHAIN_INFO_BASE_URL || 'https://blockchain.info';
const BTC_USD_FALLBACK = 65000; // placeholder used only if live price lookup fails

function satsToBtc(sats) {
  return Number(sats) / 1e8;
}

async function getBtcPriceUsd() {
  try {
    const { data } = await axios.get(`${BLOCKCHAIN_INFO_BASE}/ticker`);
    const price = data?.USD?.last;
    return Number.isFinite(price) && price > 0 ? price : BTC_USD_FALLBACK;
  } catch {
    return BTC_USD_FALLBACK;
  }
}

async function getWalletSummary(address) {
  const [addrRes, btcPrice] = await Promise.all([
    axios.get(`${BLOCKCHAIN_INFO_BASE}/rawaddr/${address}`, { params: { limit: 100 } }),
    getBtcPriceUsd()
  ]);

  const data = addrRes.data;
  const balance = satsToBtc(data.final_balance);

  const transactions = (data.txs || []).map(tx => {
    // Identify the primary "to" output (largest output not returning to an input address)
    const inputAddresses = new Set(
      (tx.inputs || []).map(i => i.prev_out?.addr).filter(Boolean)
    );
    const outputs = tx.out || [];
    const externalOutputs = outputs.filter(o => o.addr && !inputAddresses.has(o.addr));
    const primaryOutput = (externalOutputs.length ? externalOutputs : outputs)
      .sort((a, b) => b.value - a.value)[0];

    return {
      txHash: tx.hash,
      fromAddress: tx.inputs?.[0]?.prev_out?.addr || 'unknown',
      toAddress: primaryOutput?.addr || 'unknown',
      amount: satsToBtc(primaryOutput?.value || 0),
      fee: satsToBtc(tx.fee || 0),
      blockNumber: tx.block_height || null,
      timestamp: new Date(tx.time * 1000)
    };
  });

  const timestamps = transactions.map(t => t.timestamp.getTime());

  return {
    address,
    chain: 'bitcoin',
    balance,
    balanceUsd: balance * btcPrice,
    totalTxCount: data.n_tx || transactions.length,
    firstTxAt: timestamps.length ? new Date(Math.min(...timestamps)) : null,
    lastTxAt: timestamps.length ? new Date(Math.max(...timestamps)) : null,
    transactions,
    priceUsd: btcPrice
  };
}

// Secondary lookup via Blockchair, useful as a fallback or for cross-verification.
async function getWalletSummaryBlockchair(address) {
  const { data } = await axios.get(`https://api.blockchair.com/bitcoin/dashboards/address/${address}`, {
    params: { key: process.env.BLOCKCHAIR_API_KEY }
  });
  const info = data?.data?.[address]?.address;
  if (!info) throw new Error('Blockchair: address not found');

  return {
    address,
    chain: 'bitcoin',
    balance: satsToBtc(info.balance),
    totalTxCount: info.transaction_count,
    firstTxAt: info.first_seen_receiving ? new Date(info.first_seen_receiving) : null,
    lastTxAt: info.last_seen_spending ? new Date(info.last_seen_spending) : null
  };
}

module.exports = { getWalletSummary, getWalletSummaryBlockchair, getBtcPriceUsd };
