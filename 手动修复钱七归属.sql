-- 手动修复钱七归属到赵六团队
-- 问题：系统管理员修改没有生效，钱七仍在海风团队

-- 第一步: 确认当前状态
SELECT '=== 当前状态确认 ===' as info;
SELECT 
    u.name as user_name,
    t.name as team_name,
    leader.name as leader_name
FROM users u
LEFT JOIN teams t ON u.team_id = t.id
LEFT JOIN users leader ON t.leader_id = leader.id
WHERE u.name LIKE '%钱%' OR u.name LIKE '%7%' OR u.name LIKE '%qi%';

-- 第二步: 确认赵六团队ID
SELECT '=== 赵六团队ID ===' as info;
SELECT 
    t.id as team_id,
    t.name as team_name,
    leader.name as leader_name
FROM teams t
LEFT JOIN users leader ON t.leader_id = leader.id
WHERE t.leader_id = '550e8400-e29b-41d4-a716-446655440013';

-- 第三步: 确认钱七的用户ID
SELECT '=== 钱七用户ID ===' as info;
SELECT 
    id,
    name,
    role,
    team_id
FROM users 
WHERE name LIKE '%钱%' OR name LIKE '%7%' OR name LIKE '%qi%';

-- 第四步: 手动更新钱七的团队归属
-- 注意: 需要替换为实际的团队ID和用户ID
-- UPDATE users SET team_id = '赵六团队ID' WHERE id = '钱七用户ID';

-- 第五步: 验证更新结果
SELECT '=== 更新后验证 ===' as info;
SELECT 
    u.name as user_name,
    t.name as team_name,
    leader.name as leader_name
FROM users u
LEFT JOIN teams t ON u.team_id = t.id
LEFT JOIN users leader ON t.leader_id = leader.id
WHERE u.name LIKE '%钱%' OR u.name LIKE '%7%' OR u.name LIKE '%qi%';

-- 第六步: 验证赵六团队的所有成员
SELECT '=== 赵六团队所有成员 ===' as info;
SELECT 
    u.name,
    u.role,
    t.name as team_name
FROM users u
LEFT JOIN teams t ON u.team_id = t.id
WHERE t.leader_id = '550e8400-e29b-41d4-a716-446655440013'
ORDER BY u.role, u.name;

