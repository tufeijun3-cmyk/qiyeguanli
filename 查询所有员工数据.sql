-- 查询所有员工数据
-- 包括用户信息、团队归属、客户数据等

-- 查询1: 所有用户基本信息
SELECT '=== 所有用户基本信息 ===' as info;
SELECT 
    id,
    name,
    email,
    role,
    team_id,
    supervisor_id,
    created_at
FROM users 
ORDER BY role, name;

-- 查询2: 所有团队信息
SELECT '=== 所有团队信息 ===' as info;
SELECT 
    t.id,
    t.name as team_name,
    t.leader_id,
    leader.name as leader_name,
    leader.role as leader_role
FROM teams t
LEFT JOIN users leader ON t.leader_id = leader.id
ORDER BY t.name;

-- 查询3: 所有用户的团队归属关系
SELECT '=== 所有用户团队归属关系 ===' as info;
SELECT 
    u.id,
    u.name,
    u.role,
    u.team_id,
    t.name as team_name,
    leader.name as leader_name,
    leader.id as leader_id
FROM users u
LEFT JOIN teams t ON u.team_id = t.id
LEFT JOIN users leader ON t.leader_id = leader.id
ORDER BY u.role, u.name;

-- 查询4: 所有客户数据
SELECT '=== 所有客户数据 ===' as info;
SELECT 
    c.id,
    c.name as customer_name,
    c.contact,
    c.owner_id,
    u.name as owner_name,
    u.role as owner_role,
    t.name as owner_team_name,
    leader.name as owner_leader_name
FROM customers c
LEFT JOIN users u ON c.owner_id = u.id
LEFT JOIN teams t ON u.team_id = t.id
LEFT JOIN users leader ON t.leader_id = leader.id
WHERE c.is_deleted = false
ORDER BY u.name, c.name;

-- 查询5: 组织结构汇总
SELECT '=== 组织结构汇总 ===' as info;
SELECT 
    t.name as team_name,
    leader.name as leader_name,
    COUNT(u.id) as member_count,
    STRING_AGG(u.name, ', ') as members
FROM teams t
LEFT JOIN users leader ON t.leader_id = leader.id
LEFT JOIN users u ON u.team_id = t.id
GROUP BY t.id, t.name, leader.name
ORDER BY t.name;

