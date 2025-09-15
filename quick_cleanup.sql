-- 快速清理脚本 - 只清理当前有问题的数据
-- 在Supabase SQL编辑器中执行此脚本

-- 这个脚本专门解决当前的外键约束问题

-- 1. 删除所有跟进记录
DELETE FROM followups;

-- 2. 删除所有客户记录
DELETE FROM customers;

-- 显示清理结果
SELECT '客户和跟进数据清理完成！' as message;

