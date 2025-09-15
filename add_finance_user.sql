-- 添加财务角色用户
-- 在Supabase SQL编辑器中执行此脚本

-- 插入财务用户
INSERT INTO users (
  id, 
  company_id, 
  name, 
  email, 
  phone, 
  role, 
  team_id, 
  base_salary
) VALUES (
  '550e8400-e29b-41d4-a716-446655440015',  -- 新的财务用户ID
  '550e8400-e29b-41d4-a716-446655440000',  -- 公司ID
  '财务小王',                               -- 财务人员姓名
  'finance@example.com',                    -- 邮箱
  '13800138000',                           -- 电话
  'finance',                               -- 财务角色
  '550e8400-e29b-41d4-a716-446655440001',  -- 技术部团队ID
  12000                                    -- 基本工资
);

-- 验证插入结果
SELECT id, name, email, role, team_id, base_salary 
FROM users 
WHERE role = 'finance';
