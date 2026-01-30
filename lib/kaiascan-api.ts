/**
 * Kaiascan API 服务（通过内部 API Route 调用，避免 CORS）
 * 文档: https://docs.kaiascan.io/api/Account/Token/get-account-fungible-token-details
 */

// API 响应类型定义
export interface TokenContract {
  symbol: string
  name: string
  icon: string | null
  contract_address: string
  decimal: number
  verified: boolean
  total_supply: string
  implementation_address?: string
}

export interface TokenBalanceResult {
  contract: TokenContract
  balance: string
}

export interface KaiascanAPIResponse {
  results: TokenBalanceResult[]
  paging: {
    total_count: number
    current_page: number
    last: boolean
    total_page: number
  }
  property: {
    blockNumber: number
  }
}

/**
 * 获取账户的代币余额详情（通过内部 API Route）
 * @param accountAddress 钱包地址
 * @param page 页码（默认 1）
 * @param size 每页数量（默认 20，最大 2000）
 * @returns 代币余额列表
 */
export async function getAccountTokenBalances(
  accountAddress: string,
  page: number = 1,
  size: number = 20
): Promise<KaiascanAPIResponse> {
  if (!accountAddress) {
    throw new Error('钱包地址不能为空')
  }

  // 构建内部 API URL
  const url = new URL(`/api/tokens/${accountAddress}`, window.location.origin)
  url.searchParams.append('page', page.toString())
  url.searchParams.append('size', size.toString())

  console.log('🔍 查询代币余额 (通过内部 API):', {
    address: accountAddress,
    page,
    size,
  })

  try {
    const response = await fetch(url.toString(), {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: '未知错误' }))
      console.error('❌ API 请求错误:', {
        status: response.status,
        statusText: response.statusText,
        error: errorData,
      })
      throw new Error(errorData.error || `API 请求失败: ${response.status}`)
    }

    const data: KaiascanAPIResponse = await response.json()

    console.log('✅ 查询成功:', {
      totalCount: data.paging.total_count,
      resultsCount: data.results.length,
      blockNumber: data.property?.blockNumber,
    })

    return data
  } catch (error: any) {
    console.error('❌ 查询代币余额失败:', error)
    throw new Error(`查询失败: ${error.message}`)
  }
}

/**
 * 获取账户的所有代币余额（处理分页）
 * @param accountAddress 钱包地址
 * @returns 所有代币余额列表
 */
export async function getAllAccountTokenBalances(
  accountAddress: string
): Promise<TokenBalanceResult[]> {
  const allResults: TokenBalanceResult[] = []
  let page = 1
  const size = 100 // 每次获取 100 条

  try {
    // 第一次请求
    const firstResponse = await getAccountTokenBalances(accountAddress, page, size)
    allResults.push(...firstResponse.results)

    // 如果有多页，继续获取
    const totalPages = firstResponse.paging.total_page
    if (totalPages > 1) {
      console.log(`📄 检测到多页数据，共 ${totalPages} 页，继续获取...`)

      for (page = 2; page <= totalPages; page++) {
        const response = await getAccountTokenBalances(accountAddress, page, size)
        allResults.push(...response.results)
      }
    }

    console.log(`✅ 共获取 ${allResults.length} 个代币`)
    return allResults
  } catch (error: any) {
    console.error('❌ 获取所有代币余额失败:', error)
    throw error
  }
}
