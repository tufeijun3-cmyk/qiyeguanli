-- 更新客户表结构，添加新字段
-- 执行时间: 2025-01-12

-- 添加新字段到customers表
ALTER TABLE customers 
ADD COLUMN IF NOT EXISTS age INTEGER,
ADD COLUMN IF NOT EXISTS occupation TEXT,
ADD COLUMN IF NOT EXISTS budget_range TEXT,
ADD COLUMN IF NOT EXISTS additional_contacts JSONB DEFAULT '[]',
ADD COLUMN IF NOT EXISTS is_deleted BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS created_by uuid REFERENCES users(id),
ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now();

-- 添加索引以提高查询性能
CREATE INDEX IF NOT EXISTS idx_customers_owner_id ON customers(owner_id);
CREATE INDEX IF NOT EXISTS idx_customers_created_by ON customers(created_by);
CREATE INDEX IF NOT EXISTS idx_customers_is_deleted ON customers(is_deleted);

-- 添加触发器来自动更新updated_at字段
CREATE OR REPLACE FUNCTION update_customer_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS trigger_update_customer_updated_at ON customers;
CREATE TRIGGER trigger_update_customer_updated_at
    BEFORE UPDATE ON customers
    FOR EACH ROW
    EXECUTE FUNCTION update_customer_updated_at();

-- 添加注释
COMMENT ON COLUMN customers.age IS '客户年龄';
COMMENT ON COLUMN customers.occupation IS '客户职业';
COMMENT ON COLUMN customers.budget_range IS '资金预算范围';
COMMENT ON COLUMN customers.additional_contacts IS '额外联系方式（JSON数组）';
COMMENT ON COLUMN customers.is_deleted IS '是否已删除（软删除标记）';
COMMENT ON COLUMN customers.created_by IS '创建人ID';
COMMENT ON COLUMN customers.updated_at IS '最后更新时间';
