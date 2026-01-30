/**
 * API Route: 查询钱包地址的代币余额
 * GET /api/tokens/[address]?page=1&size=20
 */

import { NextRequest, NextResponse } from 'next/server'

// Kaiascan API 配置（服务端环境变量，无需 NEXT_PUBLIC_ 前缀）
const KAIASCAN_API_URL = process.env.KAIASCAN_API_URL || 'https://api.kaiascan.io/api/v1'
const KAIASCAN_API_KEY = process.env.KAIASCAN_API_KEY || ''

// API 响应类型
interface TokenContract {
  symbol: string
  name: string
  icon: string | null
  contract_address: string
  decimal: number
  verified: boolean
  total_supply: string
  implementation_address?: string
}

interface TokenBalanceResult {
  contract: TokenContract
  balance: string
}

interface KaiascanAPIResponse {
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
 * GET 请求处理
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ address: string }> }
) {
  try {
    const { address } = await params
    
    // 验证地址格式
    if (!address || !/^0x[a-fA-F0-9]{40}$/.test(address)) {
      return NextResponse.json(
        { error: '无效的钱包地址格式' },
        { status: 400 }
      )
    }

    // 获取查询参数
    const searchParams = request.nextUrl.searchParams
    const page = parseInt(searchParams.get('page') || '1', 10)
    const size = parseInt(searchParams.get('size') || '20', 10)

    // 验证分页参数
    if (page < 1 || size < 1 || size > 2000) {
      return NextResponse.json(
        { error: '无效的分页参数（page >= 1, 1 <= size <= 2000）' },
        { status: 400 }
      )
    }

    // 构建 Kaiascan API URL
    const apiUrl = new URL(`${KAIASCAN_API_URL}/accounts/${address}/token-details`)
    apiUrl.searchParams.append('page', page.toString())
    apiUrl.searchParams.append('size', size.toString())

    console.log('🔍 [API Route] 查询代币余额:', {
      address,
      page,
      size,
      url: apiUrl.toString(),
    })

    // 准备请求头
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    }

    // 如果配置了 API Key，添加到请求头
    if (KAIASCAN_API_KEY) {
      headers['Authorization'] = `Bearer ${KAIASCAN_API_KEY}`
    }

    // 调用 Kaiascan API
    const response = await fetch(apiUrl.toString(), {
      method: 'GET',
      headers,
      // 添加缓存策略
      next: {
        revalidate: 60, // 缓存 60 秒
      },
    })

    // 处理 API 错误
    if (!response.ok) {
      const errorText = await response.text()
      console.error('❌ [API Route] Kaiascan API 错误:', {
        status: response.status,
        statusText: response.statusText,
        error: errorText,
      })

      return NextResponse.json(
        {
          error: 'Kaiascan API 请求失败',
          details: `${response.status} ${response.statusText}`,
        },
        { status: response.status }
      )
    }

    // 解析响应
    const data: KaiascanAPIResponse = await response.json()

    console.log('✅ [API Route] 查询成功:', {
      address,
      totalCount: data.paging.total_count,
      resultsCount: data.results.length,
      blockNumber: data.property?.blockNumber,
    })

    // 返回数据
    return NextResponse.json(data, {
      status: 200,
      headers: {
        'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=120',
      },
    })
  } catch (error: any) {
    console.error('❌ [API Route] 服务器错误:', error)

    return NextResponse.json(
      {
        error: '服务器内部错误',
        details: error.message || '未知错误',
      },
      { status: 500 }
    )
  }
}
