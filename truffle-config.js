const HDWalletProvider = require('truffle-hdwallet-provider')

module.exports = {
  networks: {
    main: {
      provider: () => {
        return new HDWalletProvider(process.env.MNEMONIC, process.env.INFURA_MAINNET_URL, 0)
      },
      network_id: 1
    },
    ropsten: {
      provider: () =>  {
        return new HDWalletProvider(process.env.MNEMONIC, process.env.INFURA_ROPSTEN_URL, 0)
      },
      network_id: 3
    },
    rinkeby: {
      provider: () =>  {
        return new HDWalletProvider(process.env.MNEMONIC, process.env.INFURA_RINKEBY_URL, 0)
      },
      network_id: 4
    },
    kovan: {
      provider: () =>  {
        return new HDWalletProvider(process.env.MNEMONIC, process.env.INFURA_KOVAN_URL, 0)
      },
      network_id: 42
    },
    staging: {
      provider: () =>  {
        return new HDWalletProvider(process.env.GANACHE_MNEMONIC, process.env.GANACHE_URL, 0)
      },
      network_id: 1337
    },
    development: {
     host: '127.0.0.1',
     port: 8546,
     network_id: '*',
    }
  },
  compilers: {
    solc: {
      version: '0.5.7',
      settings: {
       optimizer: {
         enabled: true,
         runs: 200
        }
      }
    }
  }
}
