-- 快速修复赵六团队问题
-- 执行步骤:
-- 1. 先运行查询部分查看数据
-- 2. 再运行修复部分

-- ===== 第一步: 查看当前数据 =====
SELECT '当前团队数据:' as step;
SELECT id, name, leader_id FROM teams;

SELECT '当前用户数据:' as step;
SELECT id, name, role, team_id FROM users WHERE role IN ('team_leader', 'employee');

-- ===== 第二步: 创建赵六的团队 =====
SELECT '创建赵六团队...' as step;
INSERT INTO teams (id, name, leader_id, created_at)
VALUES (gen_random_uuid(), '赵六团队', '550e8400-e29b-41d4-a716-446655440013', NOW());

-- ===== 第三步: 获取新团队ID =====
SELECT '新团队ID:' as step;
SELECT id FROM teams WHERE leader_id = '550e8400-e29b-41d4-a716-446655440013';

-- ===== 第四步: 手动分配员工 =====
-- 注意: 需要根据实际的钱七用户ID来执行
-- 请先运行上面的查询，找到钱七的实际用户ID，然后执行下面的更新
-- UPDATE users SET team_id = '新团队ID' WHERE id = '钱七的用户ID';

-- ===== 第五步: 验证结果 =====
SELECT '修复后验证:' as step;
SELECT 
    t.name as team_name,
    t.leader_id,
    u.name as member_name,
    u.role
FROM teams t
LEFT JOIN users u ON u.team_id = t.id
WHERE t.leader_id = '550e8400-e29b-41d4-a716-446655440013';

