-- 检查海风组长的团队结构问题

-- 1. 查看海风的用户信息
SELECT 
    id,
    name,
    email,
    role,
    team_id,
    supervisor_id
FROM users 
WHERE name = '海风' AND role = 'team_leader';

-- 2. 查看所有团队信息
SELECT 
    id,
    name,
    leader_id,
    (SELECT name FROM users WHERE id = teams.leader_id) as leader_name
FROM teams;

-- 3. 查看海风团队下的员工
SELECT 
    u.id,
    u.name,
    u.email,
    u.role,
    u.team_id,
    t.name as team_name,
    t.leader_id
FROM users u
LEFT JOIN teams t ON u.team_id = t.id
WHERE t.leader_id = (SELECT id FROM users WHERE name = '海风' AND role = 'team_leader');

-- 4. 查看所有待审批的申请
SELECT 
    e.id,
    e.amount,
    e.status,
    e.applied_at,
    u.name as creator_name,
    u.role as creator_role,
    t.name as team_name
FROM expenses e
JOIN users u ON e.created_by = u.id
LEFT JOIN teams t ON u.team_id = t.id
WHERE e.status = 'waiting_leader'
ORDER BY e.applied_at DESC;
