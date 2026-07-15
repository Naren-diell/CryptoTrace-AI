-- ============================================================
-- CryptoTrace AI - Database Schema (MySQL 8+)
-- ============================================================
-- Database schema (database creation is handled by the cloud provider connection configuration)

-- ---------------------------------------------------------
-- users
-- ---------------------------------------------------------
CREATE TABLE IF NOT EXISTS users (
  id            INT AUTO_INCREMENT PRIMARY KEY,
  uuid          CHAR(36) NOT NULL UNIQUE,
  name          VARCHAR(100) NOT NULL,
  email         VARCHAR(150) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  role          ENUM('admin', 'investigator') NOT NULL DEFAULT 'investigator',
  is_active     BOOLEAN NOT NULL DEFAULT TRUE,
  created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_users_email (email),
  INDEX idx_users_role (role)
) ENGINE=InnoDB;

-- ---------------------------------------------------------
-- investigations
-- ---------------------------------------------------------
CREATE TABLE IF NOT EXISTS investigations (
  id            INT AUTO_INCREMENT PRIMARY KEY,
  uuid          CHAR(36) NOT NULL UNIQUE,
  title         VARCHAR(200) NOT NULL,
  description   TEXT,
  case_type     ENUM('fraud','money_laundering','cybercrime','ransomware','scam','dark_web','other') DEFAULT 'other',
  status        ENUM('open','in_progress','closed') NOT NULL DEFAULT 'open',
  created_by    INT NOT NULL,
  created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_investigations_user FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_investigations_status (status),
  INDEX idx_investigations_created_by (created_by)
) ENGINE=InnoDB;

-- ---------------------------------------------------------
-- wallets
-- ---------------------------------------------------------
CREATE TABLE IF NOT EXISTS wallets (
  id                INT AUTO_INCREMENT PRIMARY KEY,
  uuid              CHAR(36) NOT NULL UNIQUE,
  address           VARCHAR(120) NOT NULL,
  chain             ENUM('bitcoin','ethereum') NOT NULL,
  label             VARCHAR(150) DEFAULT NULL,
  is_exchange       BOOLEAN DEFAULT FALSE,
  balance           DECIMAL(36,18) DEFAULT 0,
  balance_usd       DECIMAL(20,2) DEFAULT 0,
  first_tx_at       DATETIME DEFAULT NULL,
  last_tx_at        DATETIME DEFAULT NULL,
  total_tx_count    INT DEFAULT 0,
  investigation_id  INT DEFAULT NULL,
  created_at        TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at        TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uq_wallet_address_chain (address, chain),
  CONSTRAINT fk_wallets_investigation FOREIGN KEY (investigation_id) REFERENCES investigations(id) ON DELETE SET NULL,
  INDEX idx_wallets_chain (chain),
  INDEX idx_wallets_address (address)
) ENGINE=InnoDB;

-- ---------------------------------------------------------
-- transactions
-- ---------------------------------------------------------
CREATE TABLE IF NOT EXISTS transactions (
  id                INT AUTO_INCREMENT PRIMARY KEY,
  uuid              CHAR(36) NOT NULL UNIQUE,
  tx_hash           VARCHAR(150) NOT NULL,
  chain             ENUM('bitcoin','ethereum') NOT NULL,
  from_wallet_id    INT DEFAULT NULL,
  to_wallet_id      INT DEFAULT NULL,
  from_address      VARCHAR(120) NOT NULL,
  to_address        VARCHAR(120) NOT NULL,
  amount            DECIMAL(36,18) NOT NULL DEFAULT 0,
  amount_usd        DECIMAL(20,2) DEFAULT 0,
  fee               DECIMAL(36,18) DEFAULT 0,
  block_number      BIGINT DEFAULT NULL,
  tx_timestamp      DATETIME NOT NULL,
  hop_depth         INT DEFAULT 0,
  investigation_id  INT DEFAULT NULL,
  created_at        TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uq_tx_hash_chain (tx_hash, chain, from_address, to_address),
  CONSTRAINT fk_tx_from_wallet FOREIGN KEY (from_wallet_id) REFERENCES wallets(id) ON DELETE SET NULL,
  CONSTRAINT fk_tx_to_wallet FOREIGN KEY (to_wallet_id) REFERENCES wallets(id) ON DELETE SET NULL,
  CONSTRAINT fk_tx_investigation FOREIGN KEY (investigation_id) REFERENCES investigations(id) ON DELETE SET NULL,
  INDEX idx_tx_hash (tx_hash),
  INDEX idx_tx_from_address (from_address),
  INDEX idx_tx_to_address (to_address),
  INDEX idx_tx_timestamp (tx_timestamp),
  INDEX idx_tx_investigation (investigation_id)
) ENGINE=InnoDB;

-- ---------------------------------------------------------
-- wallet_clusters
-- (groups of wallets heuristically linked as controlled by the same entity)
-- ---------------------------------------------------------
CREATE TABLE IF NOT EXISTS wallet_clusters (
  id                INT AUTO_INCREMENT PRIMARY KEY,
  uuid              CHAR(36) NOT NULL UNIQUE,
  cluster_name      VARCHAR(150) DEFAULT NULL,
  wallet_id         INT NOT NULL,
  cluster_root_id   INT DEFAULT NULL COMMENT 'wallet id treated as the representative node of the cluster',
  heuristic_used    VARCHAR(100) DEFAULT NULL COMMENT 'e.g. common-input-ownership, address-reuse',
  confidence_score  DECIMAL(5,2) DEFAULT 0 COMMENT '0-100',
  investigation_id  INT DEFAULT NULL,
  created_at        TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_cluster_wallet FOREIGN KEY (wallet_id) REFERENCES wallets(id) ON DELETE CASCADE,
  CONSTRAINT fk_cluster_investigation FOREIGN KEY (investigation_id) REFERENCES investigations(id) ON DELETE SET NULL,
  INDEX idx_cluster_wallet (wallet_id),
  INDEX idx_cluster_root (cluster_root_id)
) ENGINE=InnoDB;

-- ---------------------------------------------------------
-- risk_analysis
-- ---------------------------------------------------------
CREATE TABLE IF NOT EXISTS risk_analysis (
  id                INT AUTO_INCREMENT PRIMARY KEY,
  uuid              CHAR(36) NOT NULL UNIQUE,
  wallet_id         INT NOT NULL,
  risk_level        ENUM('low','medium','high') NOT NULL DEFAULT 'low',
  risk_score        DECIMAL(5,2) NOT NULL DEFAULT 0 COMMENT '0-100',
  indicators        JSON DEFAULT NULL COMMENT 'array of triggered heuristic flags',
  probable_end_receiver_address VARCHAR(120) DEFAULT NULL,
  end_receiver_confidence DECIMAL(5,2) DEFAULT NULL COMMENT '0-100',
  ai_summary        TEXT DEFAULT NULL,
  investigation_id  INT DEFAULT NULL,
  analyzed_at       TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_risk_wallet FOREIGN KEY (wallet_id) REFERENCES wallets(id) ON DELETE CASCADE,
  CONSTRAINT fk_risk_investigation FOREIGN KEY (investigation_id) REFERENCES investigations(id) ON DELETE SET NULL,
  INDEX idx_risk_wallet (wallet_id),
  INDEX idx_risk_level (risk_level)
) ENGINE=InnoDB;

-- ---------------------------------------------------------
-- reports
-- ---------------------------------------------------------
CREATE TABLE IF NOT EXISTS reports (
  id                INT AUTO_INCREMENT PRIMARY KEY,
  uuid              CHAR(36) NOT NULL UNIQUE,
  investigation_id  INT NOT NULL,
  generated_by      INT NOT NULL,
  report_type       ENUM('investigation_summary','transaction_flow','wallet_risk','end_receiver','timeline') NOT NULL,
  file_format       ENUM('pdf','xlsx') NOT NULL,
  file_path         VARCHAR(255) NOT NULL,
  created_at        TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_report_investigation FOREIGN KEY (investigation_id) REFERENCES investigations(id) ON DELETE CASCADE,
  CONSTRAINT fk_report_user FOREIGN KEY (generated_by) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_reports_investigation (investigation_id)
) ENGINE=InnoDB;

-- ---------------------------------------------------------
-- activity_logs
-- ---------------------------------------------------------
CREATE TABLE IF NOT EXISTS activity_logs (
  id            INT AUTO_INCREMENT PRIMARY KEY,
  user_id       INT DEFAULT NULL,
  action        VARCHAR(150) NOT NULL,
  details       JSON DEFAULT NULL,
  ip_address    VARCHAR(64) DEFAULT NULL,
  created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_log_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
  INDEX idx_logs_user (user_id),
  INDEX idx_logs_created (created_at)
) ENGINE=InnoDB;
