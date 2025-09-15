-- 简单查询所有员工数据

-- 查询1: 所有用户
SELECT '所有用户:' as query;
SELECT id, name, role, team_id, supervisor_id FROM users ORDER BY role, name;

-- 查询2: 所有团队
SELECT '所有团队:' as query;
SELECT 
    t.id,
    t.name as team_name,
    leader.name as leader_name
FROM teams t
LEFT JOIN users leader ON t.leader_id = leader.id
ORDER BY t.name;

-- 查询3: 用户团队关系
SELECT '用户团队关系:' as query;
SELECT 
    u.name as user_name,
    u.role,
    t.name as team_name,
    leader.name as leader_name
FROM users u
LEFT JOIN teams t ON u.team_id = t.id
LEFT JOIN users leader ON t.leader_id = leader.id
ORDER BY u.role, u.name;

-- 查询4: 客户归属
SELECT '客户归属:' as query;
SELECT 
    c.name as customer_name,
    c.contact,
    u.name as owner_name,
    t.name as team_name,
    leader.name as leader_name
FROM customers c
LEFT JOIN users u ON c.owner_id = u.id
LEFT JOIN teams t ON u.team_id = t.id
LEFT JOIN users leader ON t.leader_id = leader.id
WHERE c.is_deleted = false
ORDER BY u.name, c.name;

