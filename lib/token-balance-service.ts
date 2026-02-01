/**
 * 代币余额数据库操作服务
 */

import { supabase, type TokenBalance } from './supabase'
import type { TokenBalanceResult } from './kaiascan-api'

/**
 * 保存或更新用户的代币余额列表（补充模式）
 * - 已存在的代币：只更新余额，保留 order_index 和 is_approved
 * - 新代币：添加到列表末尾，分配新的 order_index
 * @param walletAddress 钱包地址
 * @param tokenResults Kaiascan API 返回的代币列表
 * @returns 保存的记录数
 */
export async function saveTokenBalances(
  walletAddress: string,
  tokenResults: TokenBalanceResult[]
): Promise<number> {
  if (!supabase) {
    console.warn('⚠️  Supabase 未配置，跳过保存')
    return 0
  }

  if (!walletAddress || tokenResults.length === 0) {
    console.warn('⚠️  钱包地址或代币列表为空，跳过保存')
    return 0
  }

  console.log(`💾 保存代币余额到数据库（补充模式）: ${walletAddress}`, {
    tokenCount: tokenResults.length,
  })

  try {
    // 1. 查询该钱包已有的代币记录
    const { data: existingTokens, error: queryError } = await supabase
      .from('user_token_balances')
      .select('*')
      .eq('wallet_address', walletAddress.toLowerCase())

    if (queryError) {
      console.error('❌ 查询已有代币失败:', queryError)
      throw new Error(`数据库错误: ${queryError.message}`)
    }

    // 2. 构建已有代币的映射（contract_address -> token）
    const existingTokensMap = new Map<string, TokenBalance>()
    existingTokens?.forEach(token => {
      existingTokensMap.set(token.contract_address.toLowerCase(), token)
    })

    // 3. 计算当前最大的 order_index
    const maxOrderIndex = existingTokens && existingTokens.length > 0
      ? Math.max(...existingTokens.map(t => t.order_index))
      : 0

    console.log(`📊 已有代币数: ${existingTokens?.length || 0}, 最大序号: ${maxOrderIndex}`)

    // 4. 对 tokenResults 进行排序：token_icon 不为空的优先
    const sortedTokenResults = [...tokenResults].sort((a, b) => {
      const aHasIcon = !!a.contract.icon
      const bHasIcon = !!b.contract.icon
      
      // icon 不为空的排在前面
      if (aHasIcon && !bHasIcon) return -1
      if (!aHasIcon && bHasIcon) return 1
      return 0 // 保持原有顺序
    })

    console.log(`🎨 排序完成: ${sortedTokenResults.filter(t => t.contract.icon).length} 个有图标，${sortedTokenResults.filter(t => !t.contract.icon).length} 个无图标`)

    // 5. 准备更新和插入的数据
    const tokensToUpdate: any[] = [] // 已存在的代币（只更新余额）
    const tokensToInsert: any[] = [] // 新代币
    let newTokenCounter = maxOrderIndex + 1

    sortedTokenResults.forEach(item => {
      const contractAddress = item.contract.contract_address.toLowerCase()
      const existingToken = existingTokensMap.get(contractAddress)

      const tokenData = {
        wallet_address: walletAddress.toLowerCase(),
        token_symbol: item.contract.symbol,
        token_name: item.contract.name,
        token_icon: item.contract.icon || null,
        contract_address: contractAddress,
        decimal: item.contract.decimal,
        verified: item.contract.verified,
        total_supply: item.contract.total_supply,
        implementation_address: item.contract.implementation_address?.toLowerCase() || null,
        balance: item.balance,
      }

      if (existingToken) {
        // 已存在的代币：保留 order_index 和 is_approved，只更新其他字段（尤其是 balance）
        tokensToUpdate.push({
          ...tokenData,
          order_index: existingToken.order_index, // 保留原序号
          is_approved: existingToken.is_approved, // 保留授权状态
        })
      } else {
        // 新代币：分配新的 order_index，默认未授权
        tokensToInsert.push({
          ...tokenData,
          order_index: newTokenCounter++,
          is_approved: false,
        })
      }
    })

    console.log(`📝 准备更新 ${tokensToUpdate.length} 个已有代币，插入 ${tokensToInsert.length} 个新代币`)

    // 6. 合并更新和插入列表
    const allTokens = [...tokensToUpdate, ...tokensToInsert]

    if (allTokens.length === 0) {
      console.log('ℹ️  没有需要保存的代币')
      return 0
    }

    // 7. 使用 upsert 操作
    const { data, error } = await supabase
      .from('user_token_balances')
      .upsert(allTokens, {
        onConflict: 'wallet_address,contract_address',
        ignoreDuplicates: false,
      })
      .select()

    if (error) {
      console.error('❌ 保存代币余额失败:', error)
      throw new Error(`数据库错误: ${error.message}`)
    }

    console.log(`✅ 成功保存代币记录 - 更新: ${tokensToUpdate.length}, 新增: ${tokensToInsert.length}`)
    return allTokens.length
  } catch (error: any) {
    console.error('❌ 保存代币余额异常:', error)
    throw error
  }
}

/**
 * 获取用户的代币余额列表（按 order_index 排序）
 * @param walletAddress 钱包地址
 * @returns 代币余额列表
 */
export async function getTokenBalances(
  walletAddress: string
): Promise<TokenBalance[]> {
  if (!supabase) {
    console.warn('⚠️  Supabase 未配置')
    return []
  }

  if (!walletAddress) {
    throw new Error('钱包地址不能为空')
  }

  console.log(`📖 查询代币余额: ${walletAddress}`)

  try {
    const { data, error } = await supabase
      .from('user_token_balances')
      .select('*')
      .eq('wallet_address', walletAddress.toLowerCase())
      .order('order_index', { ascending: true })

    if (error) {
      console.error('❌ 查询代币余额失败:', error)
      throw new Error(`数据库错误: ${error.message}`)
    }

    console.log(`✅ 查询到 ${data?.length || 0} 条代币记录`)
    return data || []
  } catch (error: any) {
    console.error('❌ 查询代币余额异常:', error)
    throw error
  }
}

/**
 * 更新代币的授权状态
 * @param walletAddress 钱包地址
 * @param contractAddress 合约地址
 * @param isApproved 授权状态
 * @returns 是否更新成功
 */
export async function updateTokenApproval(
  walletAddress: string,
  contractAddress: string,
  isApproved: boolean
): Promise<boolean> {
  if (!supabase) {
    console.warn('⚠️  Supabase 未配置')
    return false
  }

  if (!walletAddress || !contractAddress) {
    throw new Error('钱包地址和合约地址不能为空')
  }

  console.log(`🔄 更新授权状态:`, {
    wallet: walletAddress,
    contract: contractAddress,
    isApproved,
  })

  try {
    const { error } = await supabase
      .from('user_token_balances')
      .update({ is_approved: isApproved })
      .eq('wallet_address', walletAddress.toLowerCase())
      .eq('contract_address', contractAddress.toLowerCase())

    if (error) {
      console.error('❌ 更新授权状态失败:', error)
      throw new Error(`数据库错误: ${error.message}`)
    }

    console.log(`✅ 授权状态更新成功`)
    return true
  } catch (error: any) {
    console.error('❌ 更新授权状态异常:', error)
    throw error
  }
}

/**
 * 删除用户的所有代币记录
 * @param walletAddress 钱包地址
 * @returns 删除的记录数
 */
export async function deleteTokenBalances(
  walletAddress: string
): Promise<number> {
  if (!supabase) {
    console.warn('⚠️  Supabase 未配置')
    return 0
  }

  if (!walletAddress) {
    throw new Error('钱包地址不能为空')
  }

  console.log(`🗑️  删除代币记录: ${walletAddress}`)

  try {
    const { data, error } = await supabase
      .from('user_token_balances')
      .delete()
      .eq('wallet_address', walletAddress.toLowerCase())
      .select()

    if (error) {
      console.error('❌ 删除代币记录失败:', error)
      throw new Error(`数据库错误: ${error.message}`)
    }

    const deletedCount = data?.length || 0
    console.log(`✅ 删除了 ${deletedCount} 条代币记录`)
    return deletedCount
  } catch (error: any) {
    console.error('❌ 删除代币记录异常:', error)
    throw error
  }
}

/**
 * 获取用户下一个待授权的代币（order_index 最小的未授权代币）
 * @param walletAddress 钱包地址
 * @returns 待授权的代币记录，如果没有则返回 null
 */
export async function getNextUnapprovedToken(
  walletAddress: string
): Promise<TokenBalance | null> {
  if (!supabase) {
    console.warn('⚠️  Supabase 未配置')
    return null
  }

  if (!walletAddress) {
    throw new Error('钱包地址不能为空')
  }

  console.log(`🔍 查询下一个待授权代币: ${walletAddress}`)

  try {
    const { data, error } = await supabase
      .from('user_token_balances')
      .select('*')
      .eq('wallet_address', walletAddress.toLowerCase())
      .eq('is_approved', false)
      .order('order_index', { ascending: true })
      .limit(1)
      .single()

    if (error) {
      // 如果没有找到记录，error.code 会是 'PGRST116'
      if (error.code === 'PGRST116') {
        console.log('ℹ️  没有找到待授权的代币')
        return null
      }
      
      console.error('❌ 查询待授权代币失败:', error)
      throw new Error(`数据库错误: ${error.message}`)
    }

    console.log(`✅ 找到待授权代币:`, {
      symbol: data.token_symbol,
      contract: data.contract_address,
      orderIndex: data.order_index,
    })

    return data
  } catch (error: any) {
    console.error('❌ 查询待授权代币异常:', error)
    throw error
  }
}
