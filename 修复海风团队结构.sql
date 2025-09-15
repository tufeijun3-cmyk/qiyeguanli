-- 修复海风组长的团队结构问题

-- 1. 首先查看海风的用户信息
SELECT 
    id,
    name,
    email,
    role,
    team_id,
    supervisor_id
FROM users 
WHERE name = '海风' AND role = 'team_leader';

-- 2. 为海风创建团队记录（如果不存在）
INSERT INTO teams (id, name, leader_id, created_at, updated_at)
SELECT 
    gen_random_uuid(),
    '海风团队',
    u.id,
    NOW(),
    NOW()
FROM users u
WHERE u.name = '海风' AND u.role = 'team_leader'
AND NOT EXISTS (
    SELECT 1 FROM teams t WHERE t.leader_id = u.id
);

-- 3. 更新海风的team_id（如果为空）
UPDATE users 
SET team_id = (
    SELECT id FROM teams WHERE leader_id = users.id
)
WHERE name = '海风' AND role = 'team_leader' AND team_id IS NULL;

-- 4. 将海风1分配到海风团队
UPDATE users 
SET team_id = (
    SELECT id FROM teams WHERE leader_id = (
        SELECT id FROM users WHERE name = '海风' AND role = 'team_leader'
    )
),
supervisor_id = (
    SELECT id FROM users WHERE name = '海风' AND role = 'team_leader'
)
WHERE name = '海风1' AND role = 'employee';

-- 5. 验证修复结果
SELECT 
    '海风组长信息' as info,
    u.id,
    u.name,
    u.role,
    u.team_id,
    t.name as team_name,
    t.leader_id
FROM users u
LEFT JOIN teams t ON u.team_id = t.id
WHERE u.name = '海风' AND u.role = 'team_leader'

UNION ALL

SELECT 
    '海风团队成员' as info,
    u.id,
    u.name,
    u.role,
    u.team_id,
    t.name as team_name,
    t.leader_id
FROM users u
LEFT JOIN teams t ON u.team_id = t.id
WHERE u.supervisor_id = (
    SELECT id FROM users WHERE name = '海风' AND role = 'team_leader'
);
