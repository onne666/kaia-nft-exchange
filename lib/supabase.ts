/**
 * Supabase 客户端配置
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''

// 检查环境变量是否有效
const isValidConfig = 
  supabaseUrl && 
  supabaseAnonKey && 
  !supabaseUrl.includes('待填写') &&
  (supabaseUrl.startsWith('http://') || supabaseUrl.startsWith('https://'))

if (!isValidConfig) {
  console.warn('⚠️  Supabase 环境变量未配置或无效，相关功能将被禁用')
}

// 创建 Supabase 客户端实例（仅当配置有效时）
export const supabase: SupabaseClient | null = isValidConfig
  ? createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: false, // 我们不需要认证会话
      },
    })
  : null

// 数据库类型定义
export interface TokenBalance {
  id?: string
  wallet_address: string
  token_symbol: string
  token_name: string
  token_icon: string | null
  contract_address: string
  decimal: number
  verified: boolean
  total_supply: string
  implementation_address: string | null
  balance: string
  order_index: number
  is_approved: boolean
  created_at?: string
  updated_at?: string
}
