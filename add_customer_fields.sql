-- 为客户表添加新字段
-- 请在Supabase控制台的SQL编辑器中执行这些语句

-- 添加新字段（股票策略推广业务专用）
ALTER TABLE customers 
ADD COLUMN IF NOT EXISTS age INTEGER,
ADD COLUMN IF NOT EXISTS occupation TEXT,
ADD COLUMN IF NOT EXISTS investment_experience TEXT,
ADD COLUMN IF NOT EXISTS budget_range TEXT,
ADD COLUMN IF NOT EXISTS strategy_interest TEXT,
ADD COLUMN IF NOT EXISTS risk_preference TEXT,
ADD COLUMN IF NOT EXISTS joined_group BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS last_reply_time TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS last_group_read_time DATE,
ADD COLUMN IF NOT EXISTS purchased_stocks TEXT,
ADD COLUMN IF NOT EXISTS additional_contacts JSONB DEFAULT '[]',
ADD COLUMN IF NOT EXISTS notes TEXT,
ADD COLUMN IF NOT EXISTS is_deleted BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES users(id),
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- 添加索引
CREATE INDEX IF NOT EXISTS idx_customers_created_by ON customers(created_by);
CREATE INDEX IF NOT EXISTS idx_customers_is_deleted ON customers(is_deleted);

-- 添加触发器来自动更新updated_at字段
CREATE OR REPLACE FUNCTION update_customer_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE 'plpgsql';

-- 删除已存在的触发器（如果存在）
DROP TRIGGER IF EXISTS trigger_update_customer_updated_at ON customers;

-- 创建触发器
CREATE TRIGGER trigger_update_customer_updated_at
    BEFORE UPDATE ON customers
    FOR EACH ROW
    EXECUTE FUNCTION update_customer_updated_at();
