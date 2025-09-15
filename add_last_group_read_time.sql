-- 单独添加 last_group_read_time 字段
-- 请在Supabase控制台的SQL编辑器中执行这个语句

ALTER TABLE customers 
ADD COLUMN IF NOT EXISTS last_group_read_time DATE;

