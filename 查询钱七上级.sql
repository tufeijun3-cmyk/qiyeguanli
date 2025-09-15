-- 查询钱七的上级和团队关系
-- 这个查询能帮我们了解当前的组织结构

-- 第一步: 查找所有包含"钱"或"7"的用户
SELECT '=== 查找钱七用户 ===' as info;
SELECT id, name, email, role, team_id, supervisor_id FROM users 
WHERE name LIKE '%钱%' OR name LIKE '%7%' OR name LIKE '%qi%'
ORDER BY name;

-- 第二步: 查看钱七的客户数据
SELECT '=== 钱七的客户数据 ===' as info;
SELECT 
    c.id,
    c.name as customer_name,
    c.contact,
    c.owner_id,
    u.name as owner_name,
    u.role as owner_role
FROM customers c
LEFT JOIN users u ON c.owner_id = u.id
WHERE u.name LIKE '%钱%' OR u.name LIKE '%7%' OR u.name LIKE '%qi%'
ORDER BY c.name;

-- 第三步: 查看钱七的团队信息（如果有team_id）
SELECT '=== 钱七的团队信息 ===' as info;
SELECT 
    u.id as user_id,
    u.name as user_name,
    u.role,
    u.team_id,
    t.name as team_name,
    t.leader_id,
    leader.name as leader_name
FROM users u
LEFT JOIN teams t ON u.team_id = t.id
LEFT JOIN users leader ON t.leader_id = leader.id
WHERE u.name LIKE '%钱%' OR u.name LIKE '%7%' OR u.name LIKE '%qi%';

-- 第四步: 查看钱七的主管信息（如果有supervisor_id）
SELECT '=== 钱七的主管信息 ===' as info;
SELECT 
    u.id as user_id,
    u.name as user_name,
    u.role,
    u.supervisor_id,
    supervisor.name as supervisor_name,
    supervisor.role as supervisor_role
FROM users u
LEFT JOIN users supervisor ON u.supervisor_id = supervisor.id
WHERE u.name LIKE '%钱%' OR u.name LIKE '%7%' OR u.name LIKE '%qi%';

-- 第五步: 查看所有团队和组长信息
SELECT '=== 所有团队信息 ===' as info;
SELECT 
    t.id as team_id,
    t.name as team_name,
    t.leader_id,
    leader.name as leader_name,
    leader.role as leader_role
FROM teams t
LEFT JOIN users leader ON t.leader_id = leader.id
ORDER BY t.name;

-- 第六步: 查看所有用户的团队归属情况
SELECT '=== 所有用户团队归属 ===' as info;
SELECT 
    u.id,
    u.name,
    u.role,
    u.team_id,
    t.name as team_name,
    t.leader_id,
    leader.name as leader_name
FROM users u
LEFT JOIN teams t ON u.team_id = t.id
LEFT JOIN users leader ON t.leader_id = leader.id
ORDER BY u.role, u.name;

