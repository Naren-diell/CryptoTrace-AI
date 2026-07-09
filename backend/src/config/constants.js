// src/config/constants.js

module.exports = {
  ROLES: {
    ADMIN: 'admin',
    INVESTIGATOR: 'investigator'
  },
  RISK_LEVELS: {
    LOW: 'low',
    MEDIUM: 'medium',
    HIGH: 'high'
  },
  SUPPORTED_CHAINS: ['bitcoin', 'ethereum'],
  WALLET_REGEX: {
    bitcoin: /^(bc1|[13])[a-zA-HJ-NP-Z0-9]{25,39}$/,
    ethereum: /^0x[a-fA-F0-9]{40}$/
  },
  // Demo-grade heuristic thresholds used by the rule-based risk engine.
  // These are NOT forensic-grade thresholds; tune with real labeled data
  // before using this in any production investigation context.
  RISK_THRESHOLDS: {
    HIGH_FREQUENCY_TX_COUNT_24H: 25,
    LARGE_VALUE_USD: 50000,
    RAPID_HOP_SECONDS: 120,
    MIN_HOPS_FOR_LAYERING_FLAG: 4
  }
};
