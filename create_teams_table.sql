-- 创建 teams 表（如果不存在）
CREATE TABLE IF NOT EXISTS teams (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    company_id UUID NOT NULL DEFAULT '550e8400-e29b-41d4-a716-446655440000',
    name VARCHAR(255) NOT NULL,
    description TEXT,
    leader_id UUID,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 添加外键约束（如果存在 users 表）
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'users') THEN
        ALTER TABLE teams 
        ADD CONSTRAINT fk_teams_leader_id 
        FOREIGN KEY (leader_id) REFERENCES users(id) ON DELETE SET NULL;
    END IF;
END $$;

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_teams_company_id ON teams(company_id);
CREATE INDEX IF NOT EXISTS idx_teams_leader_id ON teams(leader_id);

-- 插入一些示例团队数据
INSERT INTO teams (name, description, leader_id) VALUES
('技术部', '负责技术开发和维护', NULL),
('销售部', '负责产品销售和客户关系', NULL),
('财务部', '负责财务管理和会计', NULL),
('人事部', '负责人力资源管理', NULL)
ON CONFLICT (name) DO NOTHING;
