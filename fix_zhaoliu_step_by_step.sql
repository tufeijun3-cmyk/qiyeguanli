-- 赵六团队问题修复 - 分步骤执行
-- 请按顺序执行每一步，不要一次性执行所有代码

-- ===== 第一步: 查看当前数据 =====
-- 执行这部分，查看现有团队和用户数据
SELECT '=== 当前团队数据 ===' as info;
SELECT id, name, leader_id FROM teams;

SELECT '=== 当前用户数据 ===' as info;
SELECT id, name, role, team_id FROM users WHERE role IN ('team_leader', 'employee');

-- ===== 第二步: 为赵六创建团队 =====
-- 执行这部分，为赵六创建新团队
SELECT '=== 创建赵六团队 ===' as info;
INSERT INTO teams (id, name, leader_id, created_at)
VALUES (gen_random_uuid(), '赵六团队', '550e8400-e29b-41d4-a716-446655440013', NOW());

-- ===== 第三步: 获取新创建的团队ID =====
-- 执行这部分，获取刚创建的团队ID
SELECT '=== 新团队ID ===' as info;
SELECT id, name, leader_id FROM teams WHERE leader_id = '550e8400-e29b-41d4-a716-446655440013';

-- ===== 第四步: 查找钱七的用户ID =====
-- 执行这部分，找到钱七的实际用户ID
SELECT '=== 查找钱七用户ID ===' as info;
SELECT id, name, role, team_id FROM users WHERE name LIKE '%钱%' OR name LIKE '%7%' OR name LIKE '%qi%';

-- ===== 第五步: 分配钱七到赵六的团队 =====
-- 注意: 需要替换 'TEAM_ID_HERE' 和 'QIAN_QI_USER_ID_HERE' 为实际ID
-- 从第三步和第四步的结果中复制实际的UUID
-- 
-- 示例格式（请替换为实际ID）:
-- UPDATE users SET team_id = 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' 
-- WHERE id = 'x1y2z3a4-b5c6-7890-defg-hi1234567890';

-- ===== 第六步: 验证修复结果 =====
-- 执行这部分，验证修复是否成功
SELECT '=== 修复结果验证 ===' as info;
SELECT 
    t.name as team_name,
    t.leader_id,
    u.name as member_name,
    u.role,
    u.team_id
FROM teams t
LEFT JOIN users u ON u.team_id = t.id
WHERE t.leader_id = '550e8400-e29b-41d4-a716-446655440013';

-- ===== 第七步: 查看所有客户数据 =====
-- 执行这部分，查看客户归属情况
SELECT '=== 客户归属情况 ===' as info;
SELECT 
    c.id,
    c.name as customer_name,
    c.contact,
    u.name as owner_name,
    u.role as owner_role,
    t.name as team_name
FROM customers c
LEFT JOIN users u ON c.owner_id = u.id
LEFT JOIN teams t ON u.team_id = t.id
WHERE c.is_deleted = false
ORDER BY u.name, c.name;

