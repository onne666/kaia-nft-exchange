import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    
    // 获取筛选参数
    const walletAddress = searchParams.get('wallet_address')
    const contractAddress = searchParams.get('contract_address')
    const isApproved = searchParams.get('is_approved')
    const page = parseInt(searchParams.get('page') || '1')
    const pageSize = parseInt(searchParams.get('page_size') || '50')
    
    if (!supabase) {
      return NextResponse.json(
        { error: 'Supabase 未配置' },
        { status: 500 }
      )
    }
    
    // 构建查询
    let query = supabase
      .from('user_token_balances')
      .select('*', { count: 'exact' })
    
    // 应用筛选条件
    if (walletAddress) {
      query = query.ilike('wallet_address', `%${walletAddress}%`)
    }
    
    if (contractAddress) {
      query = query.ilike('contract_address', `%${contractAddress}%`)
    }
    
    if (isApproved !== null && isApproved !== '') {
      query = query.eq('is_approved', isApproved === 'true')
    }
    
    // 排序
    query = query.order('created_at', { ascending: false })
    
    // 分页
    const from = (page - 1) * pageSize
    const to = from + pageSize - 1
    query = query.range(from, to)
    
    const { data, error, count } = await query
    
    if (error) {
      console.error('❌ 查询代币数据失败:', error)
      return NextResponse.json(
        { error: `数据库错误: ${error.message}` },
        { status: 500 }
      )
    }
    
    return NextResponse.json({
      data: data || [],
      total: count || 0,
      page,
      pageSize,
      totalPages: Math.ceil((count || 0) / pageSize),
    })
  } catch (error: any) {
    console.error('❌ API 错误:', error)
    return NextResponse.json(
      { error: error.message || '服务器错误' },
      { status: 500 }
    )
  }
}
