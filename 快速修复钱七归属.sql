-- 快速修复钱七归属到赵六团队

-- 步骤1: 获取赵六团队ID
SELECT '赵六团队ID:' as step;
SELECT id FROM teams WHERE leader_id = '550e8400-e29b-41d4-a716-446655440013';

-- 步骤2: 获取钱七用户ID
SELECT '钱七用户ID:' as step;
SELECT id, name FROM users WHERE name LIKE '%钱%' OR name LIKE '%7%' OR name LIKE '%qi%';

-- 步骤3: 手动更新钱七的团队归属
-- 注意: 请将下面的 'TEAM_ID' 和 'USER_ID' 替换为实际的UUID
-- 从步骤1和步骤2的结果中复制
-- 
-- 格式示例:
-- UPDATE users SET team_id = '实际的团队ID' WHERE id = '钱七的用户ID';

-- 步骤4: 验证更新结果
SELECT '更新后验证:' as step;
SELECT 
    u.name as user_name,
    t.name as team_name,
    leader.name as leader_name
FROM users u
LEFT JOIN teams t ON u.team_id = t.id
LEFT JOIN users leader ON t.leader_id = leader.id
WHERE u.name LIKE '%钱%' OR u.name LIKE '%7%' OR u.name LIKE '%qi%';

-- 步骤5: 验证赵六团队成员
SELECT '赵六团队成员:' as step;
SELECT 
    u.name,
    u.role
FROM users u
LEFT JOIN teams t ON u.team_id = t.id
WHERE t.leader_id = '550e8400-e29b-41d4-a716-446655440013'
ORDER BY u.role, u.name;

