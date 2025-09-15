-- 检查赵六的团队结构

-- 1. 查看赵六的用户信息
SELECT 
    id,
    name,
    email,
    role,
    team_id,
    supervisor_id
FROM users 
WHERE name = '赵六' AND role = 'team_leader';

-- 2. 查看赵六是否有团队记录
SELECT 
    t.id,
    t.name,
    t.leader_id,
    u.name as leader_name
FROM teams t
JOIN users u ON t.leader_id = u.id
WHERE u.name = '赵六';

-- 3. 查看赵六的下级员工（应该有钱七）
SELECT 
    u.id,
    u.name,
    u.email,
    u.role,
    u.team_id,
    u.supervisor_id,
    t.name as team_name,
    (SELECT name FROM users WHERE id = u.supervisor_id) as supervisor_name
FROM users u
LEFT JOIN teams t ON u.team_id = t.id
WHERE u.supervisor_id = (
    SELECT id FROM users WHERE name = '赵六' AND role = 'team_leader'
);

-- 4. 查看钱七的申请（如果有的话）
SELECT 
    e.id,
    e.amount,
    e.status,
    e.applied_at,
    e.purpose,
    e.notes,
    u.name as creator_name,
    u.role as creator_role
FROM expenses e
JOIN users u ON e.created_by = u.id
WHERE u.name = '钱七'
ORDER BY e.applied_at DESC;
