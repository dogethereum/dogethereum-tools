/**
 * Based on dogecoin/src/rpc/protocol.h
 */
const ERRORS = {
  /**
   * Transaction or block was rejected by network rules
   */
  RPC_VERIFY_REJECTED: -26,
};

const DOGECOIN_MAINNET = {
  /**
   * Message prefix used in `signmessage` node API
   */
  messagePrefix: "\x19Dogecoin Signed Message:\n",
  /**
   * BIP32 version bytes for dogecoin mainnet
   * See https://github.com/bitcoin/bips/blob/master/bip-0032.mediawiki
   */
  bip32: {
    /**
     * BIP32 version bytes for extended non-hardened keys
     */
    public: 0x02facafd,
    /**
     * BIP32 version bytes for extended hardened keys
     */
    private: 0x02fac398,
  },
  /**
   * First byte of public key addresses for dogecoin
   */
  pubKeyHash: 0x1e,
  /**
   * First byte of script addresses for dogecoin
   */
  scriptHash: 0x16,
  /**
   * Network prefix
   * See https://en.bitcoin.it/wiki/Wallet_import_format
   */
  wif: 0x9e,
};

const DOGECOIN_TESTNET = {
  /**
   * Message prefix used in `signmessage` node API
   */
  messagePrefix: "\x19Dogecoin Signed Message:\n",
  /**
   * BIP32 version bytes for dogecoin mainnet
   * See https://github.com/bitcoin/bips/blob/master/bip-0032.mediawiki
   */
  bip32: {
    /**
     * BIP32 version bytes for extended non-hardened keys
     */
    public: 0x043587cf,
    /**
     * BIP32 version bytes for extended hardened keys
     */
    private: 0x04358394,
  },
  /**
   * First byte of public key addresses for dogecoin
   */
  pubKeyHash: 0x71,
  /**
   * First byte of script addresses for dogecoin
   */
  scriptHash: 0xc4,
  /**
   * Network prefix
   * See https://en.bitcoin.it/wiki/Wallet_import_format
   */
  wif: 0xf1,
};

const DOGECOIN_REGTEST = {
  /**
   * Message prefix used in `signmessage` node API
   */
  messagePrefix: "\x19Dogecoin Signed Message:\n",
  /**
   * BIP32 version bytes for dogecoin mainnet
   * See https://github.com/bitcoin/bips/blob/master/bip-0032.mediawiki
   */
  bip32: {
    /**
     * BIP32 version bytes for extended non-hardened keys
     */
    public: 0x043587cf,
    /**
     * BIP32 version bytes for extended hardened keys
     */
    private: 0x04358394,
  },
  /**
   * First byte of public key addresses for dogecoin
   */
  pubKeyHash: 0x6f,
  /**
   * First byte of script addresses for dogecoin
   */
  scriptHash: 0xc4,
  /**
   * Network prefix
   * See https://en.bitcoin.it/wiki/Wallet_import_format
   */
  wif: 0xef,
};

module.exports = {
  DOGECOIN_MAINNET,
  DOGECOIN_TESTNET,
  DOGECOIN_REGTEST,
  ERRORS,
};
