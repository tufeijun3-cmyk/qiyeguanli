-- 检查申请状态和待审批数据

-- 1. 查看所有申请的状态
SELECT 
    status,
    COUNT(*) as count
FROM expenses 
GROUP BY status
ORDER BY status;

-- 2. 查看海风1的申请详情
SELECT 
    e.id,
    e.amount,
    e.status,
    e.applied_at,
    e.purpose,
    e.notes,
    u.name as creator_name,
    u.role as creator_role,
    t.name as team_name
FROM expenses e
JOIN users u ON e.created_by = u.id
LEFT JOIN teams t ON u.team_id = t.id
WHERE u.name = '海风1'
ORDER BY e.applied_at DESC;

-- 3. 查看所有待审批的申请（不同状态值）
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
WHERE e.status IN ('waiting_leader', 'pending', '待审批', '待审核')
ORDER BY e.applied_at DESC;

-- 4. 查看海风的下级员工
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
    SELECT id FROM users WHERE name = '海风' AND role = 'team_leader'
)
OR u.team_id = (
    SELECT id FROM teams WHERE leader_id = (
        SELECT id FROM users WHERE name = '海风' AND role = 'team_leader'
    )
);
