"use client"

import { useEffect, useState } from "react"
import { X } from "lucide-react"
import { QRCodeSVG } from "qrcode.react"

interface QRCodeModalProps {
  isOpen: boolean
  onClose: () => void
  qrData: string
  walletName: string
  onTimeout?: () => void
  timeoutSeconds?: number
}

export function QRCodeModal({ 
  isOpen, 
  onClose, 
  qrData, 
  walletName,
  onTimeout,
  timeoutSeconds = 60 
}: QRCodeModalProps) {
  const [remainingTime, setRemainingTime] = useState(timeoutSeconds)
  const [isTimedOut, setIsTimedOut] = useState(false)

  useEffect(() => {
    if (!isOpen) {
      setRemainingTime(timeoutSeconds)
      setIsTimedOut(false)
      return
    }

    const interval = setInterval(() => {
      setRemainingTime((prev) => {
        if (prev <= 1) {
          clearInterval(interval)
          setIsTimedOut(true)
          onTimeout?.()
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(interval)
  }, [isOpen, timeoutSeconds, onTimeout])

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* 背景遮罩 */}
      <div 
        className="absolute inset-0 bg-black/80 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* 弹窗内容 */}
      <div className="relative w-full max-w-md bg-[#1a1a1a] rounded-3xl p-8 shadow-2xl">
        {/* 关闭按钮 */}
        <button
          onClick={onClose}
          className="absolute top-6 right-6 text-gray-400 hover:text-white transition-colors"
        >
          <X className="w-6 h-6" />
        </button>

        {/* 加载动画 */}
        <div className="flex justify-center mb-6">
          <div className="relative w-16 h-16">
            {/* 旋转的圆弧 */}
            <svg 
              className="w-16 h-16 animate-spin" 
              viewBox="0 0 64 64"
              style={{ animationDuration: '1.5s' }}
            >
              <circle
                cx="32"
                cy="32"
                r="28"
                fill="none"
                stroke="#a3e635"
                strokeWidth="4"
                strokeLinecap="round"
                strokeDasharray="140 140"
                strokeDashoffset="40"
              />
            </svg>
          </div>
        </div>

        {/* 标题 */}
        <h2 className="text-2xl font-bold text-white text-center mb-2">
          Please Scan the QR
        </h2>
        <p className="text-2xl font-bold text-white text-center mb-6">
          to connect wallet
        </p>

        {/* 倒计时 */}
        <div className="text-center mb-6">
          <p className={`text-lg font-semibold ${
            remainingTime <= 10 ? 'text-red-400 animate-pulse' : 'text-[#a3e635]'
          }`}>
            {remainingTime}s remaining...
          </p>
        </div>

        {/* 二维码 */}
        <div className="flex justify-center mb-6">
          <div className="p-4 bg-white rounded-2xl border-4 border-red-500">
            {qrData ? (
              <QRCodeSVG
                value={qrData}
                size={320}
                level="H"
                includeMargin={false}
              />
            ) : (
              <div className="w-80 h-80 flex items-center justify-center bg-gray-100">
                <div className="text-gray-400">生成二维码中...</div>
              </div>
            )}
          </div>
        </div>

        {/* 底部提示 */}
        <div className="text-center">
          <p className="text-sm text-gray-400 leading-relaxed">
            Automatic timeout will occur<br />
            if you are unable to confirm within {timeoutSeconds} secs.
          </p>
        </div>

        {/* 超时提示 */}
        {isTimedOut && (
          <div className="mt-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
            <p className="text-red-400 text-sm text-center">
              ⏱️ 二维码已过期，请重新尝试
            </p>
          </div>
        )}

        {/* 钱包名称提示 */}
        <div className="mt-4 text-center">
          <p className="text-xs text-gray-500">
            使用 <span className="text-[#a3e635] font-semibold">{walletName}</span> App 扫描
          </p>
        </div>
      </div>
    </div>
  )
}
