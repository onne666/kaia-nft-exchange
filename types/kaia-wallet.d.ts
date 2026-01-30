interface KlaytnProvider {
  enable(): Promise<string[]>
  on(event: 'accountsChanged', callback: (accounts: string[]) => void): void
  on(event: 'networkChanged', callback: (chainId: number) => void): void
  networkVersion: string
  selectedAddress: string | null
  isKaikas?: boolean
}

interface EthereumProvider {
  isMetaMask?: boolean
  isOkxWallet?: boolean
  request?: (args: { method: string; params?: any[] }) => Promise<any>
  on?: (event: string, callback: (...args: any[]) => void) => void
  removeListener?: (event: string, callback: (...args: any[]) => void) => void
}

interface Window {
  klaytn?: KlaytnProvider
  ethereum?: EthereumProvider
  okxwallet?: EthereumProvider
}
