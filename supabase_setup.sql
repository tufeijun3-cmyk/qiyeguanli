-- 企业管理系统数据库表结构
-- 在Supabase SQL编辑器中执行此脚本

-- 创建公司表
CREATE TABLE companies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- 创建用户角色枚举
CREATE TYPE user_role AS ENUM ('employee','team_leader','supervisor','finance','admin');

-- 创建用户表
CREATE TABLE users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  auth_uid uuid, -- supabase auth user id
  company_id uuid REFERENCES companies(id) ON DELETE CASCADE,
  name text NOT NULL,
  email text,
  phone text,
  role user_role DEFAULT 'employee',
  supervisor_id uuid REFERENCES users(id), -- 指向上级（组长或主管）
  team_id uuid, -- 指向小组
  base_salary numeric DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

-- 创建团队表
CREATE TABLE teams (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid REFERENCES companies(id) ON DELETE CASCADE,
  name text NOT NULL,
  leader_id uuid REFERENCES users(id),
  created_at timestamptz DEFAULT now()
);

-- 创建设备表
CREATE TABLE devices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid REFERENCES companies(id),
  user_id uuid REFERENCES users(id),
  type text, -- phone/laptop/tablet
  vendor text,
  sn text,
  assigned_at timestamptz,
  returned_at timestamptz
);

-- 创建账号表
CREATE TABLE accounts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id),
  platform text, -- wechat/whatsapp/email/other
  account_identifier text,
  created_at timestamptz DEFAULT now()
);

-- 创建客户表
CREATE TABLE customers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid REFERENCES companies(id),
  name text,
  contact text,
  source text,
  owner_id uuid REFERENCES users(id),
  created_at timestamptz DEFAULT now()
);

-- 创建客户跟进表
CREATE TABLE followups (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id uuid REFERENCES customers(id),
  user_id uuid REFERENCES users(id),
  followup_at timestamptz DEFAULT now(),
  channel text,
  note text,
  outcome text -- contacted/lead/lost/won
);

-- 创建支出申请表
CREATE TABLE expenses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid REFERENCES companies(id),
  created_by uuid REFERENCES users(id),
  team_id uuid REFERENCES teams(id),
  amount numeric NOT NULL,
  currency text DEFAULT 'CNY',
  purpose text,
  attachments jsonb,
  applied_at timestamptz DEFAULT now(),
  status text DEFAULT 'submitted', -- submitted/waiting_leader/waiting_supervisor/waiting_finance/paid/rejected
  leader_decision jsonb,
  supervisor_decision jsonb,
  finance_decision jsonb,
  used_amount numeric DEFAULT 0,
  notes text
);

-- 创建审批历史表
CREATE TABLE approvals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  expense_id uuid REFERENCES expenses(id) ON DELETE CASCADE,
  action_by uuid REFERENCES users(id),
  action text, -- approve/reject/request_change
  comment text,
  created_at timestamptz DEFAULT now()
);

-- 创建考勤表
CREATE TABLE attendance (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id),
  date date,
  clock_in timestamptz,
  clock_out timestamptz,
  source text,
  notes text
);

-- 创建工资表
CREATE TABLE payrolls (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid REFERENCES companies(id),
  user_id uuid REFERENCES users(id),
  period text, -- YYYY-MM
  base_salary numeric,
  overtime numeric,
  commission numeric,
  social_security numeric,
  tax numeric,
  net_pay numeric,
  generated_at timestamptz DEFAULT now(),
  status text DEFAULT 'draft' -- draft/checked/paid
);

-- 创建预算表
CREATE TABLE budgets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid REFERENCES companies(id),
  team_id uuid REFERENCES teams(id),
  period text, -- YYYY-MM
  allocated numeric,
  created_at timestamptz DEFAULT now()
);

-- 创建AI审核表
CREATE TABLE ai_reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  resource_type text, -- expense/payroll/followup
  resource_id uuid,
  model text,
  decision text, -- approve/suspect/reject
  score numeric,
  reason text,
  raw_response jsonb,
  created_at timestamptz DEFAULT now()
);

-- 创建审计日志表
CREATE TABLE audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid,
  user_id uuid,
  action text,
  target_type text,
  target_id uuid,
  details jsonb,
  created_at timestamptz DEFAULT now()
);

-- 创建索引
CREATE INDEX idx_expenses_status ON expenses(status);
CREATE INDEX idx_followups_user ON followups(user_id);
CREATE INDEX idx_users_company ON users(company_id);
CREATE INDEX idx_users_role ON users(role);

-- 插入示例数据
INSERT INTO companies (id, name) VALUES 
('550e8400-e29b-41d4-a716-446655440000', '示例科技有限公司');

INSERT INTO teams (id, company_id, name) VALUES 
('550e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440000', '技术部'),
('550e8400-e29b-41d4-a716-446655440002', '550e8400-e29b-41d4-a716-446655440000', '销售部');

INSERT INTO users (id, company_id, name, email, role, team_id, base_salary) VALUES 
('550e8400-e29b-41d4-a716-446655440010', '550e8400-e29b-41d4-a716-446655440000', '张三', 'zhangsan@example.com', 'employee', '550e8400-e29b-41d4-a716-446655440001', 8000),
('550e8400-e29b-41d4-a716-446655440011', '550e8400-e29b-41d4-a716-446655440000', '李四', 'lisi@example.com', 'team_leader', '550e8400-e29b-41d4-a716-446655440001', 12000),
('550e8400-e29b-41d4-a716-446655440012', '550e8400-e29b-41d4-a716-446655440000', '王五', 'wangwu@example.com', 'supervisor', '550e8400-e29b-41d4-a716-446655440001', 15000),
('550e8400-e29b-41d4-a716-446655440013', '550e8400-e29b-41d4-a716-446655440000', '赵六', 'zhaoliu@example.com', 'finance', '550e8400-e29b-41d4-a716-446655440001', 10000),
('550e8400-e29b-41d4-a716-446655440014', '550e8400-e29b-41d4-a716-446655440000', '钱七', 'qianqi@example.com', 'admin', '550e8400-e29b-41d4-a716-446655440001', 20000);

-- 更新团队领导
UPDATE teams SET leader_id = '550e8400-e29b-41d4-a716-446655440011' WHERE id = '550e8400-e29b-41d4-a716-446655440001';

-- 插入示例支出申请
INSERT INTO expenses (id, company_id, created_by, team_id, amount, purpose, status) VALUES 
('550e8400-e29b-41d4-a716-446655440020', '550e8400-e29b-41d4-a716-446655440000', '550e8400-e29b-41d4-a716-446655440010', '550e8400-e29b-41d4-a716-446655440001', 500, '出差北京参加技术会议', 'submitted'),
('550e8400-e29b-41d4-a716-446655440021', '550e8400-e29b-41d4-a716-446655440000', '550e8400-e29b-41d4-a716-446655440010', '550e8400-e29b-41d4-a716-446655440001', 200, '购买办公用品', 'submitted');

-- 插入示例客户
INSERT INTO customers (id, company_id, name, contact, source, owner_id) VALUES 
('550e8400-e29b-41d4-a716-446655440030', '550e8400-e29b-41d4-a716-446655440000', 'ABC公司', 'contact@abc.com', '网站咨询', '550e8400-e29b-41d4-a716-446655440010'),
('550e8400-e29b-41d4-a716-446655440031', '550e8400-e29b-41d4-a716-446655440000', 'XYZ企业', 'info@xyz.com', '朋友介绍', '550e8400-e29b-41d4-a716-446655440010');

-- 插入示例设备
INSERT INTO devices (id, company_id, user_id, type, vendor, sn, assigned_at) VALUES 
('550e8400-e29b-41d4-a716-446655440040', '550e8400-e29b-41d4-a716-446655440000', '550e8400-e29b-41d4-a716-446655440010', 'laptop', 'Apple', 'MBP2023001', now()),
('550e8400-e29b-41d4-a716-446655440041', '550e8400-e29b-41d4-a716-446655440000', '550e8400-e29b-41d4-a716-446655440010', 'phone', 'iPhone', 'IPH2023001', now());
