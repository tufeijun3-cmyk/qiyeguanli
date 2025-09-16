-- 创建测试用户数据
-- 注意：实际项目中密码应该加密存储

-- 管理员用户
INSERT INTO users (
  id, 
  company_id, 
  name, 
  email, 
  password, 
  role, 
  phone, 
  department, 
  position, 
  supervisor_id, 
  is_active, 
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
  'IT部门', 
  '系统管理员', 
  NULL, 
  true, 
  NOW(), 
  NOW()
) ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  email = EXCLUDED.email,
  password = EXCLUDED.password,
  role = EXCLUDED.role,
  updated_at = NOW();

-- 财务用户
INSERT INTO users (
  id, 
  company_id, 
  name, 
  email, 
  password, 
  role, 
  phone, 
  department, 
  position, 
  supervisor_id, 
  is_active, 
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
  '财务部', 
  '财务经理', 
  NULL, 
  true, 
  NOW(), 
  NOW()
) ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  email = EXCLUDED.email,
  password = EXCLUDED.password,
  role = EXCLUDED.role,
  updated_at = NOW();

-- 主管用户
INSERT INTO users (
  id, 
  company_id, 
  name, 
  email, 
  password, 
  role, 
  phone, 
  department, 
  position, 
  supervisor_id, 
  is_active, 
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
  '销售部', 
  '销售主管', 
  NULL, 
  true, 
  NOW(), 
  NOW()
) ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  email = EXCLUDED.email,
  password = EXCLUDED.password,
  role = EXCLUDED.role,
  updated_at = NOW();

-- 组长用户
INSERT INTO users (
  id, 
  company_id, 
  name, 
  email, 
  password, 
  role, 
  phone, 
  department, 
  position, 
  supervisor_id, 
  is_active, 
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
  '销售部', 
  '销售组长', 
  'supervisor-001', 
  true, 
  NOW(), 
  NOW()
) ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  email = EXCLUDED.email,
  password = EXCLUDED.password,
  role = EXCLUDED.role,
  supervisor_id = EXCLUDED.supervisor_id,
  updated_at = NOW();

-- 员工用户
INSERT INTO users (
  id, 
  company_id, 
  name, 
  email, 
  password, 
  role, 
  phone, 
  department, 
  position, 
  supervisor_id, 
  is_active, 
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
  '销售部', 
  '销售代表', 
  'leader-001', 
  true, 
  NOW(), 
  NOW()
) ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  email = EXCLUDED.email,
  password = EXCLUDED.password,
  role = EXCLUDED.role,
  supervisor_id = EXCLUDED.supervisor_id,
  updated_at = NOW();

-- 添加更多员工用户
INSERT INTO users (
  id, 
  company_id, 
  name, 
  email, 
  password, 
  role, 
  phone, 
  department, 
  position, 
  supervisor_id, 
  is_active, 
  created_at, 
  updated_at
) VALUES 
('employee-002', '550e8400-e29b-41d4-a716-446655440000', '张三', 'zhangsan@company.com', 'employee123', 'employee', '13800000006', '销售部', '销售代表', 'leader-001', true, NOW(), NOW()),
('employee-003', '550e8400-e29b-41d4-a716-446655440000', '李四', 'lisi@company.com', 'employee123', 'employee', '13800000007', '销售部', '销售代表', 'leader-001', true, NOW(), NOW()),
('employee-004', '550e8400-e29b-41d4-a716-446655440000', '王五', 'wangwu@company.com', 'employee123', 'employee', '13800000008', '销售部', '销售代表', 'leader-001', true, NOW(), NOW())
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  email = EXCLUDED.email,
  password = EXCLUDED.password,
  role = EXCLUDED.role,
  supervisor_id = EXCLUDED.supervisor_id,
  updated_at = NOW();

-- 查询创建的用户
SELECT id, name, email, role, department, position, supervisor_id FROM users WHERE company_id = '550e8400-e29b-41d4-a716-446655440000' ORDER BY role, name;
