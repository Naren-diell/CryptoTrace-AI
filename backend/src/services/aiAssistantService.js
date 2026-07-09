// src/services/aiAssistantService.js
// Wraps OpenAI for natural-language summaries of analyzed blockchain data.
// Falls back to a deterministic templated summary if no API key is configured,
// so the rest of the app still functions end-to-end in a demo with no AI key.
let OpenAI;
try {
  OpenAI = require('openai');
} catch {
  OpenAI = null;
}

function buildContextPrompt({ walletSummary, riskResult, endReceiverResult }) {
  return `You are a blockchain forensics assistant helping an investigator understand analysis results.
Be precise, factual, and clearly note when something is a heuristic/estimate rather than a confirmed fact.

WALLET: ${walletSummary.address} (${walletSummary.chain})
Balance: ${walletSummary.balance} (~$${Math.round(walletSummary.balanceUsd || 0).toLocaleString()})
Total transactions: ${walletSummary.totalTxCount}
First seen: ${walletSummary.firstTxAt}
Last seen: ${walletSummary.lastTxAt}

RISK ANALYSIS:
Risk level: ${riskResult.riskLevel} (score: ${riskResult.riskScore}/100)
Indicators: ${riskResult.indicators.map(i => i.flag).join(', ') || 'none'}

END RECEIVER TRACE:
Probable end receiver: ${endReceiverResult.probableEndReceiver}
Confidence: ${endReceiverResult.confidenceScore}%
Hops traced: ${endReceiverResult.hopCount}
`;
}

async function askAssistant(question, analysisContext) {
  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey || !OpenAI) {
    return fallbackAnswer(question, analysisContext);
  }

  try {
    const client = new OpenAI({ apiKey });
    const systemContext = buildContextPrompt(analysisContext);

    const completion = await client.chat.completions.create({
      model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
      messages: [
        { role: 'system', content: systemContext },
        { role: 'user', content: question }
      ],
      max_tokens: 500,
      temperature: 0.3
    });

    return completion.choices[0].message.content;
  } catch (err) {
    console.error('OpenAI call failed, using fallback:', err.message);
    return fallbackAnswer(question, analysisContext);
  }
}

// Deterministic, template-based fallback so the assistant endpoint always works.
function fallbackAnswer(question, { walletSummary, riskResult, endReceiverResult }) {
  const q = question.toLowerCase();

  if (q.includes('end receiver') || q.includes('final destination')) {
    return `Based on a "follow the largest outgoing transfer" heuristic trace from ${walletSummary.address}, the probable end receiver is ${endReceiverResult.probableEndReceiver}, reached after ${endReceiverResult.hopCount} hop(s), with an estimated confidence of ${endReceiverResult.confidenceScore}%. This is a heuristic lead, not a confirmed finding — please verify manually.`;
  }

  if (q.includes('suspicious') || q.includes('risk')) {
    if (riskResult.indicators.length === 0) {
      return `No risk indicators were triggered for ${walletSummary.address} based on the available transaction data. Current risk level: ${riskResult.riskLevel}.`;
    }
    const list = riskResult.indicators.map(i => `• ${i.flag}: ${i.detail}`).join('\n');
    return `Wallet ${walletSummary.address} is flagged as ${riskResult.riskLevel.toUpperCase()} risk (score ${riskResult.riskScore}/100). Triggered indicators:\n${list}`;
  }

  if (q.includes('summar')) {
    return `Summary for ${walletSummary.address} (${walletSummary.chain}): ${walletSummary.totalTxCount} transactions, balance ~${walletSummary.balance} (~$${Math.round(walletSummary.balanceUsd || 0).toLocaleString()}). Risk level: ${riskResult.riskLevel}. Probable end receiver: ${endReceiverResult.probableEndReceiver} (${endReceiverResult.confidenceScore}% confidence).`;
  }

  return `I can answer questions about this wallet's risk level, suspicious activity, or probable end receiver based on the current analysis. Try asking: "Who is the probable end receiver?", "Show suspicious transactions", or "Summarize fund movement."`;
}

module.exports = { askAssistant };
