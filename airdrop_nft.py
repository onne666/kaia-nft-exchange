#!/usr/bin/env python3
"""
NFT 批量空投脚本
批量调用 BNBExchangeVoucher 合约的 batchAirdrop 函数
"""

import csv
import time
from web3 import Web3
from eth_account import Account

# ============= 配置参数 =============

# Kaia Mainnet RPC
RPC_URL = "https://public-en.node.kaia.io"

# 合约地址
CONTRACT_ADDRESS = "0x5466609F7949740554d683e7a655851b2aB2D452"

# 钱包私钥（请替换为真实的私钥，注意安全！）
PRIVATE_KEY = "0x0000000000000000000000000000000000000000000000000000000000000001"

# CSV 文件路径
CSV_FILE = "token-holders.csv"

# 每批次空投数量（合约限制最多 1500）
BATCH_SIZE = 1000

# Gas 价格（单位：Gwei）
GAS_PRICE_GWEI = 50

# 合约 ABI（只需要 batchAirdrop 方法）
CONTRACT_ABI = [
    {
        "inputs": [
            {
                "internalType": "address[]",
                "name": "recipients",
                "type": "address[]"
            }
        ],
        "name": "batchAirdrop",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    }
]

# ============= 初始化 Web3 =============

print("🚀 初始化 Web3 连接...")
web3 = Web3(Web3.HTTPProvider(RPC_URL))

# 检查连接
if not web3.is_connected():
    print("❌ 无法连接到 Kaia 网络")
    exit(1)

print(f"✅ 已连接到 Kaia Mainnet")
print(f"📊 当前区块高度: {web3.eth.block_number}")

# 加载账户
account = Account.from_key(PRIVATE_KEY)
sender_address = account.address
print(f"👤 发送者地址: {sender_address}")

# 查询余额
balance = web3.eth.get_balance(sender_address)
balance_kaia = web3.from_wei(balance, 'ether')
print(f"💰 账户余额: {balance_kaia:.4f} KAIA")

# 加载合约
contract = web3.eth.contract(
    address=Web3.to_checksum_address(CONTRACT_ADDRESS),
    abi=CONTRACT_ABI
)
print(f"📝 合约地址: {CONTRACT_ADDRESS}")

# ============= 读取地址列表 =============

print("\n📖 读取 CSV 文件...")
addresses = []

try:
    with open(CSV_FILE, 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        for row in reader:
            address = row['Address'].strip()
            # 验证地址格式
            if web3.is_address(address):
                addresses.append(Web3.to_checksum_address(address))
            else:
                print(f"⚠️  跳过无效地址: {address}")
    
    print(f"✅ 成功读取 {len(addresses)} 个有效地址")
except Exception as e:
    print(f"❌ 读取 CSV 文件失败: {e}")
    exit(1)

if len(addresses) == 0:
    print("❌ 没有找到有效地址")
    exit(1)

# ============= 分批处理 =============

# 计算需要多少批次
total_batches = (len(addresses) + BATCH_SIZE - 1) // BATCH_SIZE
print(f"\n📦 将分 {total_batches} 批次空投，每批 {BATCH_SIZE} 个地址")

# 询问确认
print(f"\n⚠️  即将向 {len(addresses)} 个地址空投 NFT")
print(f"预估总 Gas 费用: ~{total_batches * 0.5:.2f} KAIA (每批约 0.5 KAIA)")
confirm = input("是否继续？(yes/no): ")

if confirm.lower() not in ['yes', 'y']:
    print("❌ 已取消")
    exit(0)

# ============= 执行空投 =============

print("\n🎁 开始空投...")
success_count = 0
failed_count = 0
total_gas_used = 0

for batch_index in range(total_batches):
    start_idx = batch_index * BATCH_SIZE
    end_idx = min(start_idx + BATCH_SIZE, len(addresses))
    batch_addresses = addresses[start_idx:end_idx]
    
    print(f"\n📤 批次 {batch_index + 1}/{total_batches}")
    print(f"   地址范围: {start_idx + 1} - {end_idx}")
    print(f"   本批数量: {len(batch_addresses)}")
    
    try:
        # 获取 nonce
        nonce = web3.eth.get_transaction_count(sender_address)
        
        # 构建交易
        transaction = contract.functions.batchAirdrop(
            batch_addresses
        ).build_transaction({
            'from': sender_address,
            'nonce': nonce,
            'gas': 10000000,  # 预估 gas limit
            'gasPrice': web3.to_wei(GAS_PRICE_GWEI, 'gwei'),
            'chainId': 8217,  # Kaia Mainnet
        })
        
        # 签名交易
        signed_txn = account.sign_transaction(transaction)
        
        # 发送交易
        print(f"   📡 发送交易...")
        tx_hash = web3.eth.send_raw_transaction(signed_txn.raw_transaction)
        tx_hash_hex = web3.to_hex(tx_hash)
        print(f"   📝 交易哈希: {tx_hash_hex}")
        
        # 等待交易确认
        print(f"   ⏳ 等待确认...")
        tx_receipt = web3.eth.wait_for_transaction_receipt(tx_hash, timeout=300)
        
        # 检查交易状态
        if tx_receipt['status'] == 1:
            gas_used = tx_receipt['gasUsed']
            gas_price = transaction['gasPrice']
            gas_cost = web3.from_wei(gas_used * gas_price, 'ether')
            total_gas_used += gas_used
            
            print(f"   ✅ 成功！")
            print(f"   ⛽ Gas 使用: {gas_used:,}")
            print(f"   💸 Gas 费用: {gas_cost:.6f} KAIA")
            print(f"   🔗 区块: {tx_receipt['blockNumber']}")
            
            success_count += len(batch_addresses)
        else:
            print(f"   ❌ 交易失败！")
            failed_count += len(batch_addresses)
            
            # 如果失败，询问是否继续
            retry = input("   是否继续下一批？(yes/no): ")
            if retry.lower() not in ['yes', 'y']:
                print("❌ 已停止")
                break
        
        # 等待一小段时间再发送下一批（避免 nonce 冲突）
        if batch_index < total_batches - 1:
            print(f"   ⏸️  等待 5 秒...")
            time.sleep(5)
            
    except Exception as e:
        print(f"   ❌ 错误: {e}")
        failed_count += len(batch_addresses)
        
        # 询问是否继续
        retry = input("   是否继续下一批？(yes/no): ")
        if retry.lower() not in ['yes', 'y']:
            print("❌ 已停止")
            break

# ============= 汇总报告 =============

print("\n" + "="*60)
print("📊 空投完成报告")
print("="*60)
print(f"✅ 成功空投: {success_count} 个地址")
print(f"❌ 失败: {failed_count} 个地址")
print(f"⛽ 总 Gas 使用: {total_gas_used:,}")
print(f"💸 总 Gas 费用: {web3.from_wei(total_gas_used * web3.to_wei(GAS_PRICE_GWEI, 'gwei'), 'ether'):.6f} KAIA")
print("="*60)

# 查询最新余额
new_balance = web3.eth.get_balance(sender_address)
new_balance_kaia = web3.from_wei(new_balance, 'ether')
print(f"💰 剩余余额: {new_balance_kaia:.4f} KAIA")
print(f"📉 消耗: {balance_kaia - new_balance_kaia:.6f} KAIA")

print("\n🎉 脚本执行完毕！")
