-- 赵六团队修复决策
-- 基于查询结果：钱七属于海风团队，赵六没有团队

-- 第一步: 确认当前情况
SELECT '当前情况确认:' as step;
SELECT 
    u.name as user_name,
    u.role,
    t.name as team_name,
    leader.name as leader_name
FROM users u
LEFT JOIN teams t ON u.team_id = t.id
LEFT JOIN users leader ON t.leader_id = leader.id
WHERE u.name LIKE '%赵%' OR u.name LIKE '%钱%' OR u.name LIKE '%海%'
ORDER BY u.name;

-- 第二步: 查看所有员工，看哪些可以分配给赵六
SELECT '可分配给赵六的员工:' as step;
SELECT 
    id,
    name,
    role,
    team_id,
    CASE 
        WHEN team_id IS NULL THEN '无团队'
        ELSE '有团队'
    END as team_status
FROM users 
WHERE role = 'employee'
ORDER BY team_status, name;

-- 第三步: 查看所有组长
SELECT '所有组长:' as step;
SELECT 
    u.id,
    u.name,
    u.role,
    t.name as team_name,
    t.id as team_id
FROM users u
LEFT JOIN teams t ON t.leader_id = u.id
WHERE u.role = 'team_leader'
ORDER BY u.name;

-- ===== 修复方案 =====
-- 根据上面的查询结果，选择以下方案之一：

-- 方案1: 为赵六创建团队，分配无团队员工
-- 1. 创建赵六团队
-- INSERT INTO teams (id, name, leader_id, created_at)
-- VALUES (gen_random_uuid(), '赵六团队', '550e8400-e29b-41d4-a716-446655440013', NOW());

-- 2. 获取团队ID
-- SELECT id FROM teams WHERE leader_id = '550e8400-e29b-41d4-a716-446655440013';

-- 3. 分配无团队员工（替换为实际员工ID）
-- UPDATE users SET team_id = '团队ID' WHERE id = '员工ID';

-- 方案2: 将钱七转移到赵六团队（会影响海风团队）
-- 1. 创建赵六团队
-- INSERT INTO teams (id, name, leader_id, created_at)
-- VALUES (gen_random_uuid(), '赵六团队', '550e8400-e29b-41d4-a716-446655440013', NOW());

-- 2. 获取团队ID
-- SELECT id FROM teams WHERE leader_id = '550e8400-e29b-41d4-a716-446655440013';

-- 3. 转移钱七（需要钱七的实际用户ID）
-- UPDATE users SET team_id = '团队ID' WHERE name LIKE '%钱%' OR name LIKE '%7%' OR name LIKE '%qi%';

-- 方案3: 如果赵六不应该有团队，需要修改系统逻辑
-- 这种情况下，需要确认赵六的角色定位和权限

