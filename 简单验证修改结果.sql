-- 简单验证钱七归属修改结果

-- 查询1: 钱七的当前归属
SELECT '钱七当前归属:' as query;
SELECT 
    u.name as user_name,
    u.role,
    t.name as team_name,
    leader.name as leader_name
FROM users u
LEFT JOIN teams t ON u.team_id = t.id
LEFT JOIN users leader ON t.leader_id = leader.id
WHERE u.name LIKE '%钱%' OR u.name LIKE '%7%' OR u.name LIKE '%qi%';

-- 查询2: 赵六的团队信息
SELECT '赵六团队信息:' as query;
SELECT 
    t.name as team_name,
    leader.name as leader_name,
    leader.id as leader_id
FROM teams t
LEFT JOIN users leader ON t.leader_id = leader.id
WHERE t.leader_id = '550e8400-e29b-41d4-a716-446655440013';

-- 查询3: 赵六团队的所有成员
SELECT '赵六团队所有成员:' as query;
SELECT 
    u.name,
    u.role
FROM users u
LEFT JOIN teams t ON u.team_id = t.id
WHERE t.leader_id = '550e8400-e29b-41d4-a716-446655440013'
ORDER BY u.role, u.name;

-- 查询4: 钱七的客户
SELECT '钱七的客户:' as query;
SELECT 
    c.name as customer_name,
    c.contact,
    u.name as owner_name
FROM customers c
LEFT JOIN users u ON c.owner_id = u.id
WHERE u.name LIKE '%钱%' OR u.name LIKE '%7%' OR u.name LIKE '%qi%';

-- 查询5: 赵六应该看到的客户
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

