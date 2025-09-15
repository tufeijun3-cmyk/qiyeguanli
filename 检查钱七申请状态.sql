-- 检查钱七的申请状态

-- 1. 查看钱七的所有申请
SELECT 
    e.id,
    e.amount,
    e.status,
    e.applied_at,
    e.purpose,
    e.notes,
    u.name as creator_name,
    u.role as creator_role,
    u.supervisor_id,
    (SELECT name FROM users WHERE id = u.supervisor_id) as supervisor_name
FROM expenses e
JOIN users u ON e.created_by = u.id
WHERE u.name = '钱七'
ORDER BY e.applied_at DESC;

-- 2. 查看所有申请的状态分布
SELECT 
    status,
    COUNT(*) as count,
    STRING_AGG(DISTINCT u.name, ', ') as creators
FROM expenses e
JOIN users u ON e.created_by = u.id
GROUP BY status
ORDER BY status;

-- 3. 查看赵六的下级员工
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

-- 4. 查看赵六团队的所有申请
SELECT 
    e.id,
    e.amount,
    e.status,
    e.applied_at,
    u.name as creator_name,
    u.role as creator_role,
    u.supervisor_id,
    (SELECT name FROM users WHERE id = u.supervisor_id) as supervisor_name
FROM expenses e
JOIN users u ON e.created_by = u.id
WHERE u.supervisor_id = (
    SELECT id FROM users WHERE name = '赵六' AND role = 'team_leader'
)
ORDER BY e.applied_at DESC;
