-- 清理测试数据脚本（修复版）
-- 在Supabase SQL编辑器中执行此脚本

-- 注意：这个脚本会删除所有测试数据，请谨慎使用！
-- 修复了外键约束问题，按正确顺序删除

-- 1. 首先删除所有相关的跟进记录
DELETE FROM followups WHERE customer_id IN (
  SELECT id FROM customers WHERE company_id = '550e8400-e29b-41d4-a716-446655440000'
);

-- 2. 删除所有客户记录（必须先删除，因为用户表被客户表引用）
DELETE FROM customers WHERE company_id = '550e8400-e29b-41d4-a716-446655440000';

-- 3. 删除所有审批记录
DELETE FROM approvals WHERE expense_id IN (
  SELECT id FROM expenses WHERE company_id = '550e8400-e29b-41d4-a716-446655440000'
);

-- 4. 删除所有支出申请
DELETE FROM expenses WHERE company_id = '550e8400-e29b-41d4-a716-446655440000';

-- 5. 删除所有设备记录
DELETE FROM devices WHERE company_id = '550e8400-e29b-41d4-a716-446655440000';

-- 6. 删除所有考勤记录
DELETE FROM attendance WHERE user_id IN (
  SELECT id FROM users WHERE company_id = '550e8400-e29b-41d4-a716-446655440000'
);

-- 7. 删除所有工资记录
DELETE FROM payrolls WHERE company_id = '550e8400-e29b-41d4-a716-446655440000';

-- 8. 删除所有预算记录
DELETE FROM budgets WHERE company_id = '550e8400-e29b-41d4-a716-446655440000';

-- 9. 删除所有AI审核记录
DELETE FROM ai_reviews;

-- 10. 删除所有审计日志
DELETE FROM audit_logs;

-- 11. 删除所有账号记录
DELETE FROM accounts WHERE user_id IN (
  SELECT id FROM users WHERE company_id = '550e8400-e29b-41d4-a716-446655440000'
);

-- 12. 删除所有团队记录（必须先删除，因为用户表被团队表引用）
DELETE FROM teams WHERE company_id = '550e8400-e29b-41d4-a716-446655440000';

-- 13. 删除所有用户记录（现在可以安全删除，因为客户记录已删除）
DELETE FROM users WHERE company_id = '550e8400-e29b-41d4-a716-446655440000';

-- 14. 最后删除公司记录
DELETE FROM companies WHERE id = '550e8400-e29b-41d4-a716-446655440000';

-- 显示清理结果
SELECT '清理完成！所有测试数据已被删除。' as message;
