-- 简单修复数据不一致问题

-- 分析1: 当前客户归属情况
SELECT '当前客户归属:' as analysis;
SELECT 
    c.name as customer_name,
    c.contact,
    owner.name as owner_name,
    t.name as team_name,
    leader.name as leader_name
FROM customers c
LEFT JOIN users owner ON c.owner_id = owner.id
LEFT JOIN teams t ON owner.team_id = t.id
LEFT JOIN users leader ON t.leader_id = leader.id
WHERE c.is_deleted = false
ORDER BY owner.name, c.name;

-- 分析2: 员工团队归属情况
SELECT '员工团队归属:' as analysis;
SELECT 
    u.name as employee_name,
    u.role,
    t.name as team_name,
    leader.name as leader_name
FROM users u
LEFT JOIN teams t ON u.team_id = t.id
LEFT JOIN users leader ON t.leader_id = leader.id
WHERE u.role IN ('employee', 'team_leader')
ORDER BY u.role, u.name;

-- 问题分析
SELECT '问题分析:' as analysis;
SELECT 
    '客户李四归属钱七，但钱七在赵六团队，所以赵六应该能看到李四' as issue_1
UNION ALL
SELECT 
    '客户张三归属海风1，但海风1在海风团队，所以海风应该能看到张三' as issue_2
UNION ALL
SELECT 
    '客户王五、赵六、钱七归属超级管理员，但超级管理员在技术部，这可能是测试数据' as issue_3;

-- 验证赵六应该看到的客户
SELECT '赵六应该看到的客户:' as analysis;
SELECT 
    c.name as customer_name,
    c.contact,
    owner.name as owner_name
FROM customers c
LEFT JOIN users owner ON c.owner_id = owner.id
LEFT JOIN teams t ON owner.team_id = t.id
WHERE t.leader_id = '550e8400-e29b-41d4-a716-446655440013'
   OR c.owner_id = '550e8400-e29b-41d4-a716-446655440013'
ORDER BY owner.name, c.name;

