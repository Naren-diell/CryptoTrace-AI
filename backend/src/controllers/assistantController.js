// src/controllers/assistantController.js
const { askAssistant } = require('../services/aiAssistantService');
const { getCachedAnalysis } = require('./walletController');
const blockchainService = require('../services/blockchainService');
const riskEngine = require('../services/riskEngine');
const endReceiverEngine = require('../services/endReceiverEngine');

async function chat(req, res, next) {
  try {
    const { address, question } = req.body;
    if (!address || !question) {
      return res.status(422).json({ success: false, message: 'address and question are required' });
    }

    let context = getCachedAnalysis(address);

    // If the wallet hasn't been analyzed in this server session yet, analyze it on the fly.
    if (!context) {
      const walletSummary = await blockchainService.getWalletSummary(address);
      const riskResult = riskEngine.scoreWallet(walletSummary);
      const endReceiverResult = endReceiverEngine.findProbableEndReceiver(walletSummary.address, walletSummary.transactions);
      context = { walletSummary, riskResult, endReceiverResult };
    }

    const answer = await askAssistant(question, context);

    res.json({ success: true, data: { answer } });
  } catch (err) {
    next(err);
  }
}

module.exports = { chat };
