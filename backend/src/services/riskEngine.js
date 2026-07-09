// src/services/riskEngine.js
//
// Rule-based risk scoring engine.
//
// IMPORTANT (read before using this anywhere near a real investigation):
// This is a transparent, explainable HEURISTIC engine suitable for a hackathon
// demo. It is NOT a validated forensic tool. Real AML/forensic risk scoring
// relies on labeled address datasets (known exchanges, known scam addresses,
// sanctioned addresses, mixer services) plus statistical clustering models
// trained/validated against ground truth. This engine only looks at patterns
// visible in the transactions you feed it, and every flag it raises is
// listed in `indicators` so a human investigator can verify it manually.
const { RISK_THRESHOLDS, RISK_LEVELS } = require('../config/constants');

function scoreWallet(walletSummary) {
  const indicators = [];
  let score = 0;

  const txs = walletSummary.transactions || [];

  // 1. High frequency transfers in a short window
  const now = Date.now();
  const txsLast24h = txs.filter(t => now - new Date(t.timestamp).getTime() <= 24 * 60 * 60 * 1000);
  if (txsLast24h.length >= RISK_THRESHOLDS.HIGH_FREQUENCY_TX_COUNT_24H) {
    indicators.push({
      flag: 'HIGH_FREQUENCY_TRANSFERS',
      detail: `${txsLast24h.length} transactions in the last 24 hours (threshold: ${RISK_THRESHOLDS.HIGH_FREQUENCY_TX_COUNT_24H})`
    });
    score += 25;
  }

  // 2. Large-value transactions
  const largeTxs = txs.filter(t => (t.amountUsd || 0) >= RISK_THRESHOLDS.LARGE_VALUE_USD);
  if (largeTxs.length > 0) {
    indicators.push({
      flag: 'LARGE_VALUE_TRANSFERS',
      detail: `${largeTxs.length} transaction(s) over $${RISK_THRESHOLDS.LARGE_VALUE_USD.toLocaleString()}`
    });
    score += 20;
  }

  // 3. Rapid pass-through behavior (funds in and out within a very short window)
  // -- a common mixer/tumbler / layering signature
  const sorted = [...txs].sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
  let rapidHops = 0;
  for (let i = 1; i < sorted.length; i++) {
    const diffSeconds = (new Date(sorted[i].timestamp) - new Date(sorted[i - 1].timestamp)) / 1000;
    if (diffSeconds >= 0 && diffSeconds <= RISK_THRESHOLDS.RAPID_HOP_SECONDS) {
      rapidHops++;
    }
  }
  if (rapidHops > 0) {
    indicators.push({
      flag: 'RAPID_PASS_THROUGH',
      detail: `${rapidHops} transaction pair(s) within ${RISK_THRESHOLDS.RAPID_HOP_SECONDS}s of each other (possible pass-through / layering)`
    });
    score += 20;
  }

  // 4. Many unique counterparties relative to tx count (fan-out / fan-in pattern)
  const uniqueCounterparties = new Set(
    txs.map(t => t.toAddress === walletSummary.address ? t.fromAddress : t.toAddress)
  );
  if (txs.length > 0 && uniqueCounterparties.size / txs.length > 0.8 && txs.length >= 10) {
    indicators.push({
      flag: 'HIGH_FAN_OUT',
      detail: `${uniqueCounterparties.size} unique counterparties across ${txs.length} transactions`
    });
    score += 15;
  }

  // 5. Dormant-then-active pattern (long gap followed by burst of activity)
  if (walletSummary.firstTxAt && walletSummary.lastTxAt) {
    const lifespanDays = (new Date(walletSummary.lastTxAt) - new Date(walletSummary.firstTxAt)) / (1000 * 60 * 60 * 24);
    if (lifespanDays < 2 && txs.length >= 10) {
      indicators.push({
        flag: 'BURST_ACTIVITY_NEW_WALLET',
        detail: `${txs.length} transactions within a ${lifespanDays.toFixed(1)}-day wallet lifespan`
      });
      score += 20;
    }
  }

  score = Math.min(score, 100);

  let level = RISK_LEVELS.LOW;
  if (score >= 60) level = RISK_LEVELS.HIGH;
  else if (score >= 30) level = RISK_LEVELS.MEDIUM;

  return { riskScore: score, riskLevel: level, indicators };
}

module.exports = { scoreWallet };
