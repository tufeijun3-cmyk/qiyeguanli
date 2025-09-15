-- 安全清理脚本 - 处理所有外键约束
-- 在Supabase SQL编辑器中执行此脚本

-- 这个脚本会安全地删除所有测试数据，处理所有外键约束

-- 开始事务，确保要么全部成功，要么全部回滚
BEGIN;

-- 1. 删除所有跟进记录（解除对客户的引用）
DELETE FROM followups;

-- 2. 删除所有客户记录（解除对用户的引用）
DELETE FROM customers;

-- 3. 删除所有审批记录（解除对支出的引用）
DELETE FROM approvals;

-- 4. 删除所有支出申请
DELETE FROM expenses;

-- 5. 删除所有设备记录
DELETE FROM devices;

-- 6. 删除所有考勤记录
DELETE FROM attendance;

-- 7. 删除所有工资记录
DELETE FROM payrolls;

-- 8. 删除所有预算记录
DELETE FROM budgets;

-- 9. 删除所有AI审核记录
DELETE FROM ai_reviews;

-- 10. 删除所有审计日志
DELETE FROM audit_logs;

-- 11. 删除所有账号记录
DELETE FROM accounts;

-- 12. 删除所有团队记录
DELETE FROM teams;

-- 13. 删除所有用户记录
DELETE FROM users;

-- 14. 删除所有公司记录
DELETE FROM companies;

-- 提交事务
COMMIT;

-- 显示清理结果
SELECT '清理完成！所有测试数据已被安全删除。' as message;

