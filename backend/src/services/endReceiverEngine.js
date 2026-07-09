// src/services/endReceiverEngine.js
//
// Heuristic "probable end receiver" identification.
//
// WHAT THIS ACTUALLY DOES: given a chain of transactions starting from a
// source wallet, it walks forward through the largest outgoing transfer at
// each hop (a simple "follow the money" heuristic) until it hits a wallet
// that either (a) has no further outgoing transactions in the dataset,
// (b) is flagged as a known exchange deposit address, or (c) a max hop
// limit is reached. It returns a confidence score that DECAYS with each
// hop, reflecting the fact that certainty about fund destination drops
// the further you trace from the source — this is an explainability
// signal, not a statistically validated probability.
//
// This is intentionally transparent about its own limitations: real
// end-receiver attribution requires labeled exchange/service address
// databases (e.g. Chainalysis, TRM Labs style datasets) which are not
// available here. Treat output as an investigative lead, not a finding.

const MAX_HOPS = 8;
const CONFIDENCE_DECAY_PER_HOP = 12; // percentage points lost per hop

function findProbableEndReceiver(startAddress, allTransactions, knownExchangeAddresses = new Set()) {
  const path = [];
  let currentAddress = startAddress;
  let confidence = 100;
  const visited = new Set();

  for (let hop = 0; hop < MAX_HOPS; hop++) {
    if (visited.has(currentAddress)) {
      // cycle detected - funds returned to a previously seen address
      path.push({ address: currentAddress, note: 'CYCLE_DETECTED', hop });
      break;
    }
    visited.add(currentAddress);

    const outgoing = allTransactions
      .filter(t => t.fromAddress === currentAddress)
      .sort((a, b) => (b.amount || 0) - (a.amount || 0));

    if (outgoing.length === 0) {
      // terminal node - no further outgoing transactions found in our dataset
      break;
    }

    const nextHop = outgoing[0];
    path.push({
      address: currentAddress,
      nextAddress: nextHop.toAddress,
      txHash: nextHop.txHash,
      amount: nextHop.amount,
      hop
    });

    if (knownExchangeAddresses.has(nextHop.toAddress)) {
      path.push({ address: nextHop.toAddress, note: 'KNOWN_EXCHANGE_DEPOSIT_ADDRESS', hop: hop + 1 });
      currentAddress = nextHop.toAddress;
      confidence = Math.max(confidence - CONFIDENCE_DECAY_PER_HOP, 10);
      break;
    }

    currentAddress = nextHop.toAddress;
    confidence = Math.max(confidence - CONFIDENCE_DECAY_PER_HOP, 10);
  }

  return {
    probableEndReceiver: currentAddress,
    confidenceScore: confidence,
    hopCount: path.length,
    path,
    disclaimer: 'Heuristic "follow the largest output" trace. Not a verified forensic finding — confirm manually before acting on it.'
  };
}

module.exports = { findProbableEndReceiver };
