-- 添加密码字段到users表
ALTER TABLE users ADD COLUMN IF NOT EXISTS password VARCHAR(255);

-- 创建测试用户（包含密码字段）
INSERT INTO users (
  id,
  company_id,
  name,
  email,
  password,
  role, 
  phone, 
  supervisor_id, 
  created_at
) VALUES (
  'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 
  '550e8400-e29b-41d4-a716-446655440000', 
  '系统管理员', 
  'admin@company.com', 
  'admin123',
  'admin', 
  '13800000001', 
  NULL, 
  NOW()
) ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  email = EXCLUDED.email,
  password = EXCLUDED.password,
  role = EXCLUDED.role,
  created_at = NOW();

-- 财务用户
INSERT INTO users (
  id, 
  company_id, 
  name, 
  email, 
  password,
  role, 
  phone, 
  supervisor_id, 
  created_at
) VALUES (
  'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a12', 
  '550e8400-e29b-41d4-a716-446655440000', 
  '财务经理', 
  'finance@company.com', 
  'finance123',
  'finance', 
  '13800000002', 
  NULL, 
  NOW()
) ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  email = EXCLUDED.email,
  password = EXCLUDED.password,
  role = EXCLUDED.role,
  created_at = NOW();

-- 主管用户
INSERT INTO users (
  id, 
  company_id, 
  name, 
  email, 
  password,
  role, 
  phone, 
  supervisor_id, 
  created_at
) VALUES (
  'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a13', 
  '550e8400-e29b-41d4-a716-446655440000', 
  '海风', 
  'supervisor@company.com', 
  'supervisor123',
  'supervisor', 
  '13800000003', 
  NULL, 
  NOW()
) ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  email = EXCLUDED.email,
  password = EXCLUDED.password,
  role = EXCLUDED.role,
  created_at = NOW();

-- 组长用户
INSERT INTO users (
  id, 
  company_id, 
  name, 
  email, 
  password,
  role, 
  phone, 
  supervisor_id, 
  created_at
) VALUES (
  'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a14', 
  '550e8400-e29b-41d4-a716-446655440000', 
  '赵六', 
  'leader@company.com', 
  'leader123',
  'team_leader', 
  '13800000004', 
  'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a13', 
  NOW()
) ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  email = EXCLUDED.email,
  password = EXCLUDED.password,
  role = EXCLUDED.role,
  supervisor_id = EXCLUDED.supervisor_id,
  created_at = NOW();

-- 员工用户
INSERT INTO users (
  id, 
  company_id, 
  name, 
  email, 
  password,
  role, 
  phone, 
  supervisor_id, 
  created_at
) VALUES (
  'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a15', 
  '550e8400-e29b-41d4-a716-446655440000', 
  '钱七', 
  'employee@company.com', 
  'employee123',
  'employee', 
  '13800000005', 
  'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a14', 
  NOW()
) ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  email = EXCLUDED.email,
  password = EXCLUDED.password,
  role = EXCLUDED.role,
  supervisor_id = EXCLUDED.supervisor_id,
  created_at = NOW();

-- 查询创建的用户
SELECT id, name, email, role, phone, supervisor_id FROM users WHERE company_id = '550e8400-e29b-41d4-a716-446655440000' ORDER BY role, name;
