// src/controllers/walletController.js
const { v4: uuidv4 } = require('uuid');
const { pool } = require('../config/db');
const blockchainService = require('../services/blockchainService');
const riskEngine = require('../services/riskEngine');
const endReceiverEngine = require('../services/endReceiverEngine');
const { logActivity } = require('../utils/activityLogger');

// In-memory cache of last analysis per address so the AI assistant endpoint
// can reuse it without re-hitting the blockchain API on every chat message.
// For a real deployment, back this with Redis or the DB instead.
const analysisCache = new Map();

async function upsertWallet(summary, investigationId) {
  const [existing] = await pool.query(
    'SELECT id FROM wallets WHERE address = ? AND chain = ?',
    [summary.address, summary.chain]
  );

  if (existing.length > 0) {
    await pool.query(
      `UPDATE wallets SET balance=?, balance_usd=?, first_tx_at=?, last_tx_at=?, total_tx_count=?, updated_at=NOW()
       WHERE id = ?`,
      [summary.balance, summary.balanceUsd, summary.firstTxAt, summary.lastTxAt, summary.totalTxCount, existing[0].id]
    );
    return existing[0].id;
  }

  const walletUuid = uuidv4();
  const [result] = await pool.query(
    `INSERT INTO wallets (uuid, address, chain, balance, balance_usd, first_tx_at, last_tx_at, total_tx_count, investigation_id)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [walletUuid, summary.address, summary.chain, summary.balance, summary.balanceUsd, summary.firstTxAt, summary.lastTxAt, summary.totalTxCount, investigationId || null]
  );
  return result.insertId;
}

async function persistTransactions(summary, walletId, investigationId) {
  const txs = summary.transactions || [];
  for (const tx of txs.slice(0, 200)) { // cap for demo performance
    try {
      await pool.query(
        `INSERT IGNORE INTO transactions
         (uuid, tx_hash, chain, from_address, to_address, amount, fee, block_number, tx_timestamp, investigation_id)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [uuidv4(), tx.txHash, summary.chain, tx.fromAddress, tx.toAddress, tx.amount, tx.fee || 0, tx.blockNumber, tx.timestamp, investigationId || null]
      );
    } catch (e) {
      // duplicate or malformed row - skip without failing the whole batch
    }
  }
}

async function searchWallet(req, res, next) {
  try {
    const { address, chain, investigationId } = req.body;

    const summary = await blockchainService.getWalletSummary(address, chain);
    const riskResult = riskEngine.scoreWallet(summary);
    const endReceiverResult = endReceiverEngine.findProbableEndReceiver(
      summary.address,
      summary.transactions,
      new Set() // known exchange addresses would be loaded from `wallets WHERE is_exchange = true`
    );

    const walletId = await upsertWallet(summary, investigationId);
    await persistTransactions(summary, walletId, investigationId);

    await pool.query(
      `INSERT INTO risk_analysis
       (uuid, wallet_id, risk_level, risk_score, indicators, probable_end_receiver_address, end_receiver_confidence, investigation_id)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        uuidv4(), walletId, riskResult.riskLevel, riskResult.riskScore,
        JSON.stringify(riskResult.indicators), endReceiverResult.probableEndReceiver,
        endReceiverResult.confidenceScore, investigationId || null
      ]
    );

    analysisCache.set(summary.address, { walletSummary: summary, riskResult, endReceiverResult });

    await logActivity(req.user.id, 'WALLET_SEARCH', { address, chain: summary.chain }, req.ip);

    res.json({
      success: true,
      data: {
        wallet: summary,
        risk: riskResult,
        endReceiver: endReceiverResult
      }
    });
  } catch (err) {
    next(err);
  }
}

async function getWalletHistory(req, res, next) {
  try {
    const { address } = req.params;
    const [wallet] = await pool.query('SELECT * FROM wallets WHERE address = ?', [address]);
    if (wallet.length === 0) {
      return res.status(404).json({ success: false, message: 'Wallet not found in local database. Search it first.' });
    }

    const [transactions] = await pool.query(
      'SELECT * FROM transactions WHERE from_address = ? OR to_address = ? ORDER BY tx_timestamp DESC LIMIT 200',
      [address, address]
    );
    const [risk] = await pool.query(
      'SELECT * FROM risk_analysis WHERE wallet_id = ? ORDER BY analyzed_at DESC LIMIT 1',
      [wallet[0].id]
    );

    res.json({ success: true, data: { wallet: wallet[0], transactions, risk: risk[0] || null } });
  } catch (err) {
    next(err);
  }
}

async function listWallets(req, res, next) {
  try {
    const { riskLevel, chain, limit = 50 } = req.query;
    let query = `
      SELECT w.*, r.risk_level, r.risk_score, r.probable_end_receiver_address
      FROM wallets w
      LEFT JOIN risk_analysis r ON r.wallet_id = w.id
      WHERE 1=1
    `;
    const params = [];
    if (riskLevel) { query += ' AND r.risk_level = ?'; params.push(riskLevel); }
    if (chain) { query += ' AND w.chain = ?'; params.push(chain); }
    query += ' ORDER BY w.updated_at DESC LIMIT ?';
    params.push(Number(limit));

    const [rows] = await pool.query(query, params);
    res.json({ success: true, data: rows });
  } catch (err) {
    next(err);
  }
}

function getCachedAnalysis(address) {
  return analysisCache.get(address);
}

module.exports = { searchWallet, getWalletHistory, listWallets, getCachedAnalysis };
