-- 为expenses表添加财务相关字段
-- 在Supabase SQL编辑器中执行此脚本

-- 添加财务信息字段
ALTER TABLE expenses ADD COLUMN IF NOT EXISTS payment_method text;
ALTER TABLE expenses ADD COLUMN IF NOT EXISTS payee_name text;
ALTER TABLE expenses ADD COLUMN IF NOT EXISTS payee_contact text;
ALTER TABLE expenses ADD COLUMN IF NOT EXISTS payee_account text;
ALTER TABLE expenses ADD COLUMN IF NOT EXISTS payee_bank text;
ALTER TABLE expenses ADD COLUMN IF NOT EXISTS receipt_image_url text;
ALTER TABLE expenses ADD COLUMN IF NOT EXISTS receipt_file_name text;

-- 添加字段注释
COMMENT ON COLUMN expenses.payment_method IS '付款方式：银行转账/支付宝/微信支付/现金/支票';
COMMENT ON COLUMN expenses.payee_name IS '收款人姓名';
COMMENT ON COLUMN expenses.payee_contact IS '收款人联系方式';
COMMENT ON COLUMN expenses.payee_account IS '收款账号';
COMMENT ON COLUMN expenses.payee_bank IS '开户银行';
COMMENT ON COLUMN expenses.receipt_image_url IS '凭证图片URL';
COMMENT ON COLUMN expenses.receipt_file_name IS '凭证文件名';

-- 验证字段是否添加成功
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'expenses' 
AND column_name IN ('payment_method', 'payee_name', 'payee_contact', 'payee_account', 'payee_bank', 'receipt_image_url', 'receipt_file_name')
ORDER BY column_name;
