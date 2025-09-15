-- 简单验证赵六团队客户关系

-- 查询1: 赵六团队的所有成员
SELECT '赵六团队所有成员:' as query;
SELECT 
    u.name,
    u.role
FROM users u
LEFT JOIN teams t ON u.team_id = t.id
WHERE t.leader_id = '550e8400-e29b-41d4-a716-446655440013'
ORDER BY u.role, u.name;

-- 查询2: 钱七的当前归属
SELECT '钱七当前归属:' as query;
SELECT 
    u.name as user_name,
    t.name as team_name,
    leader.name as leader_name
FROM users u
LEFT JOIN teams t ON u.team_id = t.id
LEFT JOIN users leader ON t.leader_id = leader.id
WHERE u.name LIKE '%钱%' OR u.name LIKE '%7%' OR u.name LIKE '%qi%';

-- 查询3: 钱七的客户
SELECT '钱七的客户:' as query;
SELECT 
    c.name as customer_name,
    c.contact,
    u.name as owner_name
FROM customers c
LEFT JOIN users u ON c.owner_id = u.id
WHERE u.name LIKE '%钱%' OR u.name LIKE '%7%' OR u.name LIKE '%qi%';

-- 查询4: 赵六应该看到的客户
SELECT '赵六应该看到的客户:' as query;
SELECT 
    c.name as customer_name,
    c.contact,
    u.name as owner_name
FROM customers c
LEFT JOIN users u ON c.owner_id = u.id
LEFT JOIN teams t ON u.team_id = t.id
WHERE t.leader_id = '550e8400-e29b-41d4-a716-446655440013'
   OR c.owner_id = '550e8400-e29b-41d4-a716-446655440013'
ORDER BY u.name, c.name;

-- 查询5: 客户李四信息
SELECT '客户李四信息:' as query;
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
WHERE c.name LIKE '%李%' OR c.name LIKE '%4%' OR c.name LIKE '%si%';

