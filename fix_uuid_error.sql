-- 修复UUID错误 - 正确的执行方式
-- 请按顺序执行，不要一次性执行所有代码

-- 第一步: 查看钱七的用户ID
SELECT '查找钱七用户ID:' as step;
SELECT id, name, role, team_id FROM users WHERE name LIKE '%钱%' OR name LIKE '%7%' OR name LIKE '%qi%';

-- 第二步: 查看赵六的团队ID（如果已创建）
SELECT '查看赵六团队ID:' as step;
SELECT id, name, leader_id FROM teams WHERE leader_id = '550e8400-e29b-41d4-a716-446655440013';

-- 第三步: 如果团队不存在，创建团队
-- 注意: 如果第二步已经有结果，跳过这步
INSERT INTO teams (id, name, leader_id, created_at)
VALUES (gen_random_uuid(), '赵六团队', '550e8400-e29b-41d4-a716-446655440013', NOW());

-- 第四步: 再次查看团队ID
SELECT '确认团队ID:' as step;
SELECT id FROM teams WHERE leader_id = '550e8400-e29b-41d4-a716-446655440013';

-- 第五步: 手动更新钱七的团队ID
-- 注意: 请将下面的 'TEAM_UUID' 和 'QIAN_QI_UUID' 替换为实际的UUID
-- 从第一步和第四步的结果中复制
-- 
-- 格式示例:
-- UPDATE users SET team_id = '实际的团队UUID' WHERE id = '钱七的实际用户UUID';

-- 第六步: 验证结果
SELECT '验证修复结果:' as step;
SELECT 
    u.name as user_name,
    u.role,
    t.name as team_name,
    t.leader_id
FROM users u
LEFT JOIN teams t ON u.team_id = t.id
WHERE u.name LIKE '%钱%' OR t.leader_id = '550e8400-e29b-41d4-a716-446655440013';

