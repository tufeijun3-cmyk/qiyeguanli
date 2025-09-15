-- 验证赵六团队客户关系
-- 基于查询结果：赵六团队已创建，leader_id = 550e8400-e29b-41d4-a716-446655440013

-- 第一步: 查看赵六团队的所有成员
SELECT '=== 赵六团队所有成员 ===' as info;
SELECT 
    u.id,
    u.name,
    u.role,
    u.team_id,
    t.name as team_name
FROM users u
LEFT JOIN teams t ON u.team_id = t.id
WHERE t.leader_id = '550e8400-e29b-41d4-a716-446655440013'
ORDER BY u.role, u.name;

-- 第二步: 查看钱七的当前归属
SELECT '=== 钱七当前归属 ===' as info;
SELECT 
    u.id,
    u.name,
    u.role,
    u.team_id,
    t.name as team_name,
    leader.name as leader_name
FROM users u
LEFT JOIN teams t ON u.team_id = t.id
LEFT JOIN users leader ON t.leader_id = leader.id
WHERE u.name LIKE '%钱%' OR u.name LIKE '%7%' OR u.name LIKE '%qi%';

-- 第三步: 查看钱七的客户数据
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

-- 第四步: 查看赵六应该能看到的所有客户
SELECT '=== 赵六应该看到的客户 ===' as info;
SELECT 
    c.id,
    c.name as customer_name,
    c.contact,
    c.owner_id,
    u.name as owner_name,
    u.role as owner_role,
    t.name as team_name
FROM customers c
LEFT JOIN users u ON c.owner_id = u.id
LEFT JOIN teams t ON u.team_id = t.id
WHERE t.leader_id = '550e8400-e29b-41d4-a716-446655440013'
   OR c.owner_id = '550e8400-e29b-41d4-a716-446655440013'
ORDER BY u.name, c.name;

-- 第五步: 验证客户李四的具体信息
SELECT '=== 客户李四信息 ===' as info;
SELECT 
    c.id,
    c.name as customer_name,
    c.contact,
    c.owner_id,
    u.name as owner_name,
    u.role as owner_role,
    t.name as team_name,
    leader.name as leader_name
FROM customers c
LEFT JOIN users u ON c.owner_id = u.id
LEFT JOIN teams t ON u.team_id = t.id
LEFT JOIN users leader ON t.leader_id = leader.id
WHERE c.name LIKE '%李%' OR c.name LIKE '%4%' OR c.name LIKE '%si%'
ORDER BY c.name;

-- 第六步: 检查所有客户数据（用于对比）
SELECT '=== 所有客户数据 ===' as info;
SELECT 
    c.id,
    c.name as customer_name,
    c.contact,
    c.owner_id,
    u.name as owner_name,
    u.role as owner_role,
    t.name as team_name,
    leader.name as leader_name
FROM customers c
LEFT JOIN users u ON c.owner_id = u.id
LEFT JOIN teams t ON u.team_id = t.id
LEFT JOIN users leader ON t.leader_id = leader.id
WHERE c.is_deleted = false
ORDER BY u.name, c.name;

