-- 简单查询钱七的上级关系

-- 查询1: 找到钱七用户
SELECT '钱七用户信息:' as query;
SELECT id, name, role, team_id, supervisor_id FROM users 
WHERE name LIKE '%钱%' OR name LIKE '%7%' OR name LIKE '%qi%';

-- 查询2: 查看钱七的客户
SELECT '钱七的客户:' as query;
SELECT 
    c.name as customer_name,
    c.contact,
    u.name as owner_name
FROM customers c
LEFT JOIN users u ON c.owner_id = u.id
WHERE u.name LIKE '%钱%' OR u.name LIKE '%7%' OR u.name LIKE '%qi%';

-- 查询3: 查看钱七的团队组长（通过team_id）
SELECT '钱七的团队组长:' as query;
SELECT 
    u.name as user_name,
    t.name as team_name,
    leader.name as leader_name,
    leader.id as leader_id
FROM users u
LEFT JOIN teams t ON u.team_id = t.id
LEFT JOIN users leader ON t.leader_id = leader.id
WHERE u.name LIKE '%钱%' OR u.name LIKE '%7%' OR u.name LIKE '%qi%';

-- 查询4: 查看钱七的直接主管（通过supervisor_id）
SELECT '钱七的直接主管:' as query;
SELECT 
    u.name as user_name,
    supervisor.name as supervisor_name,
    supervisor.id as supervisor_id,
    supervisor.role as supervisor_role
FROM users u
LEFT JOIN users supervisor ON u.supervisor_id = supervisor.id
WHERE u.name LIKE '%钱%' OR u.name LIKE '%7%' OR u.name LIKE '%qi%';

