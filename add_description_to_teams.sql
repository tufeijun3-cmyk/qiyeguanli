-- 为 teams 表添加 description 字段
ALTER TABLE teams ADD COLUMN IF NOT EXISTS description TEXT;

-- 为 teams 表添加其他可能缺失的字段
ALTER TABLE teams ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
ALTER TABLE teams ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- 如果 leader_id 字段不存在，添加它
ALTER TABLE teams ADD COLUMN IF NOT EXISTS leader_id UUID;

-- 添加外键约束（如果存在 users 表）
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'users') THEN
        -- 删除可能存在的旧约束
        IF EXISTS (SELECT 1 FROM information_schema.table_constraints 
                   WHERE constraint_name = 'fk_teams_leader_id' AND table_name = 'teams') THEN
            ALTER TABLE teams DROP CONSTRAINT fk_teams_leader_id;
        END IF;
        
        -- 添加新的外键约束
        ALTER TABLE teams 
        ADD CONSTRAINT fk_teams_leader_id 
        FOREIGN KEY (leader_id) REFERENCES users(id) ON DELETE SET NULL;
    END IF;
END $$;
