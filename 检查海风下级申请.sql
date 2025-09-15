-- 检查海风下级员工的申请记录

-- 1. 查看海风的下级员工
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
);

-- 2. 查看海风1的所有申请
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
WHERE u.name = '海风1'
ORDER BY e.applied_at DESC;

-- 3. 查看张三的所有申请
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
WHERE u.name = '张三'
ORDER BY e.applied_at DESC;

-- 4. 查看所有待审批的申请
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
WHERE e.status IN ('waiting_leader', 'pending', '待审批', '待审核')
ORDER BY e.applied_at DESC;
