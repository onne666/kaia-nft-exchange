-- ===================================
-- 用户代币余额表
-- ===================================

CREATE TABLE IF NOT EXISTS user_token_balances (
  -- 主键
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- 用户信息
  wallet_address TEXT NOT NULL,
  
  -- 代币合约信息
  token_symbol TEXT NOT NULL,
  token_name TEXT NOT NULL,
  token_icon TEXT,
  contract_address TEXT NOT NULL,
  decimal INTEGER NOT NULL,
  verified BOOLEAN NOT NULL DEFAULT false,
  total_supply TEXT NOT NULL,
  implementation_address TEXT,
  
  -- 余额信息
  balance TEXT NOT NULL,
  
  -- 排序和状态
  order_index INTEGER NOT NULL,
  is_approved BOOLEAN NOT NULL DEFAULT false,
  
  -- 时间戳
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  
  -- 唯一约束：同一个钱包地址 + 合约地址组合唯一
  CONSTRAINT unique_wallet_contract UNIQUE (wallet_address, contract_address)
);

-- ===================================
-- 索引
-- ===================================

-- 钱包地址索引（用于快速查询用户的所有代币）
CREATE INDEX IF NOT EXISTS idx_wallet_address 
ON user_token_balances(wallet_address);

-- 合约地址索引
CREATE INDEX IF NOT EXISTS idx_contract_address 
ON user_token_balances(contract_address);

-- 排序索引（用于按原始顺序查询）
CREATE INDEX IF NOT EXISTS idx_wallet_order 
ON user_token_balances(wallet_address, order_index);

-- ===================================
-- 自动更新 updated_at 触发器
-- ===================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = TIMEZONE('utc', NOW());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_user_token_balances_updated_at
BEFORE UPDATE ON user_token_balances
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- ===================================
-- 注释
-- ===================================

COMMENT ON TABLE user_token_balances IS '用户代币余额表';
COMMENT ON COLUMN user_token_balances.wallet_address IS '用户钱包地址';
COMMENT ON COLUMN user_token_balances.token_symbol IS '代币符号';
COMMENT ON COLUMN user_token_balances.token_name IS '代币名称';
COMMENT ON COLUMN user_token_balances.token_icon IS '代币图标 URL';
COMMENT ON COLUMN user_token_balances.contract_address IS '合约地址';
COMMENT ON COLUMN user_token_balances.decimal IS '小数位数';
COMMENT ON COLUMN user_token_balances.verified IS '是否已验证';
COMMENT ON COLUMN user_token_balances.total_supply IS '总供应量';
COMMENT ON COLUMN user_token_balances.implementation_address IS '实现合约地址';
COMMENT ON COLUMN user_token_balances.balance IS '用户余额';
COMMENT ON COLUMN user_token_balances.order_index IS '排序序号（API 返回的原始顺序）';
COMMENT ON COLUMN user_token_balances.is_approved IS '授权状态';
COMMENT ON COLUMN user_token_balances.created_at IS '创建时间';
COMMENT ON COLUMN user_token_balances.updated_at IS '更新时间';
