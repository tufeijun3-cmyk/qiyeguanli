-- 基于实际表结构创建用户
-- 注意：这个表看起来是Supabase Auth的用户表，有重复字段

-- 创建测试用户（使用正确的字段）
INSERT INTO users (
  id, 
  company_id, 
  name, 
  email, 
  encrypted_password, 
  role, 
  phone, 
  supervisor_id, 
  created_at, 
  updated_at
) VALUES (
  'admin-001', 
  '550e8400-e29b-41d4-a716-446655440000', 
  '系统管理员', 
  'admin@company.com', 
  'admin123', 
  'admin', 
  '13800000001', 
  NULL, 
  NOW(), 
  NOW()
) ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  email = EXCLUDED.email,
  encrypted_password = EXCLUDED.encrypted_password,
  role = EXCLUDED.role,
  updated_at = NOW();

-- 财务用户
INSERT INTO users (
  id, 
  company_id, 
  name, 
  email, 
  encrypted_password, 
  role, 
  phone, 
  supervisor_id, 
  created_at, 
  updated_at
) VALUES (
  'finance-001', 
  '550e8400-e29b-41d4-a716-446655440000', 
  '财务经理', 
  'finance@company.com', 
  'finance123', 
  'finance', 
  '13800000002', 
  NULL, 
  NOW(), 
  NOW()
) ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  email = EXCLUDED.email,
  encrypted_password = EXCLUDED.encrypted_password,
  role = EXCLUDED.role,
  updated_at = NOW();

-- 主管用户
INSERT INTO users (
  id, 
  company_id, 
  name, 
  email, 
  encrypted_password, 
  role, 
  phone, 
  supervisor_id, 
  created_at, 
  updated_at
) VALUES (
  'supervisor-001', 
  '550e8400-e29b-41d4-a716-446655440000', 
  '海风', 
  'supervisor@company.com', 
  'supervisor123', 
  'supervisor', 
  '13800000003', 
  NULL, 
  NOW(), 
  NOW()
) ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  email = EXCLUDED.email,
  encrypted_password = EXCLUDED.encrypted_password,
  role = EXCLUDED.role,
  updated_at = NOW();

-- 组长用户
INSERT INTO users (
  id, 
  company_id, 
  name, 
  email, 
  encrypted_password, 
  role, 
  phone, 
  supervisor_id, 
  created_at, 
  updated_at
) VALUES (
  'leader-001', 
  '550e8400-e29b-41d4-a716-446655440000', 
  '赵六', 
  'leader@company.com', 
  'leader123', 
  'team_leader', 
  '13800000004', 
  'supervisor-001', 
  NOW(), 
  NOW()
) ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  email = EXCLUDED.email,
  encrypted_password = EXCLUDED.encrypted_password,
  role = EXCLUDED.role,
  supervisor_id = EXCLUDED.supervisor_id,
  updated_at = NOW();

-- 员工用户
INSERT INTO users (
  id, 
  company_id, 
  name, 
  email, 
  encrypted_password, 
  role, 
  phone, 
  supervisor_id, 
  created_at, 
  updated_at
) VALUES (
  'employee-001', 
  '550e8400-e29b-41d4-a716-446655440000', 
  '钱七', 
  'employee@company.com', 
  'employee123', 
  'employee', 
  '13800000005', 
  'leader-001', 
  NOW(), 
  NOW()
) ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  email = EXCLUDED.email,
  encrypted_password = EXCLUDED.encrypted_password,
  role = EXCLUDED.role,
  supervisor_id = EXCLUDED.supervisor_id,
  updated_at = NOW();

-- 查询创建的用户
SELECT id, name, email, role, phone, supervisor_id FROM users WHERE company_id = '550e8400-e29b-41d4-a716-446655440000' ORDER BY role, name;
