// src/controllers/graphController.js
const { pool } = require('../config/db');

// Builds a nodes/edges graph compatible with React Flow, centered on a wallet.
async function getTransactionGraph(req, res, next) {
  try {
    const { address } = req.params;
    const depth = Math.min(Number(req.query.depth) || 2, 5);

    const visitedAddresses = new Set([address]);
    let frontier = [address];
    const edges = [];

    for (let level = 0; level < depth; level++) {
      if (frontier.length === 0) break;
      const [rows] = await pool.query(
        `SELECT from_address, to_address, tx_hash, amount, tx_timestamp
         FROM transactions
         WHERE from_address IN (?) OR to_address IN (?)
         LIMIT 300`,
        [frontier, frontier]
      );

      const nextFrontier = new Set();
      for (const row of rows) {
        edges.push(row);
        if (!visitedAddresses.has(row.from_address)) nextFrontier.add(row.from_address);
        if (!visitedAddresses.has(row.to_address)) nextFrontier.add(row.to_address);
      }
      nextFrontier.forEach(a => visitedAddresses.add(a));
      frontier = Array.from(nextFrontier);
    }

    // Pull risk levels for every node we found so the frontend can color/highlight them
    const addressList = Array.from(visitedAddresses);
    let riskByAddress = {};
    if (addressList.length > 0) {
      const [riskRows] = await pool.query(
        `SELECT w.address, r.risk_level, r.risk_score
         FROM wallets w LEFT JOIN risk_analysis r ON r.wallet_id = w.id
         WHERE w.address IN (?)`,
        [addressList]
      );
      riskByAddress = Object.fromEntries(riskRows.map(r => [r.address, { riskLevel: r.risk_level, riskScore: r.risk_score }]));
    }

    const nodes = addressList.map((addr, i) => ({
      id: addr,
      type: 'default',
      data: {
        label: addr === address ? `${addr} (search origin)` : addr,
        riskLevel: riskByAddress[addr]?.riskLevel || 'unknown',
        riskScore: riskByAddress[addr]?.riskScore || 0
      },
      position: { x: (i % 6) * 220, y: Math.floor(i / 6) * 150 } // simple grid layout; frontend can re-layout with dagre/elk
    }));

    const graphEdges = edges.map((e, i) => ({
      id: `e-${i}`,
      source: e.from_address,
      target: e.to_address,
      label: `${e.amount}`,
      data: { txHash: e.tx_hash, timestamp: e.tx_timestamp }
    }));

    res.json({ success: true, data: { nodes, edges: graphEdges } });
  } catch (err) {
    next(err);
  }
}

module.exports = { getTransactionGraph };
