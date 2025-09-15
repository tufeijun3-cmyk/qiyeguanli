-- 只清理客户相关数据的脚本
-- 在Supabase SQL编辑器中执行此脚本

-- 这个脚本只会删除客户和相关的跟进记录，保留其他数据

-- 1. 删除所有跟进记录（解除外键约束）
DELETE FROM followups;

-- 2. 删除所有客户记录
DELETE FROM customers;

-- 显示清理结果
SELECT '客户数据清理完成！' as message;

