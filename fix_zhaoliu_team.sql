-- 修复赵六团队客户显示问题
-- 问题: 赵六没有对应的团队，导致看不到下级员工的客户

-- 1. 查看现有团队数据
SELECT '=== 现有团队数据 ===' as info;
SELECT id, name, leader_id, created_at FROM teams;

-- 2. 查看所有用户数据
SELECT '=== 所有用户数据 ===' as info;
SELECT id, name, email, role, team_id FROM users ORDER BY role, name;

-- 3. 查看赵六的详细信息
SELECT '=== 赵六详细信息 ===' as info;
SELECT id, name, email, role, team_id FROM users WHERE id = '550e8400-e29b-41d4-a716-446655440013';

-- 4. 查看钱七的详细信息
SELECT '=== 钱七详细信息 ===' as info;
SELECT id, name, email, role, team_id FROM users WHERE name LIKE '%钱%' OR name LIKE '%7%';

-- 5. 查看所有员工（可能的下级）
SELECT '=== 所有员工 ===' as info;
SELECT id, name, email, role, team_id FROM users WHERE role = 'employee';

-- 6. 为赵六创建新团队
SELECT '=== 为赵六创建新团队 ===' as info;
INSERT INTO teams (id, name, leader_id, created_at)
VALUES (gen_random_uuid(), '赵六团队', '550e8400-e29b-41d4-a716-446655440013', NOW());

-- 7. 获取刚创建的团队ID
SELECT '=== 新创建的团队ID ===' as info;
SELECT id, name, leader_id FROM teams WHERE leader_id = '550e8400-e29b-41d4-a716-446655440013';

-- 8. 将钱七分配到赵六的团队（需要先找到钱七的用户ID）
-- 注意: 需要根据实际的钱七用户ID来更新
-- UPDATE users SET team_id = (SELECT id FROM teams WHERE leader_id = '550e8400-e29b-41d4-a716-446655440013') 
-- WHERE name = '钱七' OR name LIKE '%钱%';

-- 9. 验证修复结果
SELECT '=== 修复后验证 ===' as info;
SELECT 
    t.id as team_id,
    t.name as team_name,
    t.leader_id,
    u.id as user_id,
    u.name as user_name,
    u.role
FROM teams t
LEFT JOIN users u ON u.team_id = t.id
WHERE t.leader_id = '550e8400-e29b-41d4-a716-446655440013'
ORDER BY u.role, u.name;

