-- 修复赵六团队关系
-- 根据查询结果：钱七属于海风团队，赵六没有团队

-- 第一步: 查看当前所有用户和团队关系
SELECT '=== 当前所有用户团队关系 ===' as info;
SELECT 
    u.id,
    u.name,
    u.role,
    u.team_id,
    t.name as team_name,
    leader.name as leader_name
FROM users u
LEFT JOIN teams t ON u.team_id = t.id
LEFT JOIN users leader ON t.leader_id = leader.id
ORDER BY u.role, u.name;

-- 第二步: 查看所有团队信息
SELECT '=== 所有团队信息 ===' as info;
SELECT 
    t.id,
    t.name,
    t.leader_id,
    leader.name as leader_name
FROM teams t
LEFT JOIN users leader ON t.leader_id = leader.id
ORDER BY t.name;

-- 第三步: 查看赵六的详细信息
SELECT '=== 赵六详细信息 ===' as info;
SELECT id, name, role, team_id, supervisor_id FROM users 
WHERE id = '550e8400-e29b-41d4-a716-446655440013';

-- 第四步: 查看钱七的详细信息
SELECT '=== 钱七详细信息 ===' as info;
SELECT id, name, role, team_id, supervisor_id FROM users 
WHERE name LIKE '%钱%' OR name LIKE '%7%' OR name LIKE '%qi%';

-- 第五步: 查看钱七的客户
SELECT '=== 钱七的客户 ===' as info;
SELECT 
    c.id,
    c.name as customer_name,
    c.contact,
    u.name as owner_name
FROM customers c
LEFT JOIN users u ON c.owner_id = u.id
WHERE u.name LIKE '%钱%' OR u.name LIKE '%7%' OR u.name LIKE '%qi%';

-- ===== 修复方案选择 =====

-- 方案A: 为赵六创建新团队，将钱七转移过来
-- 注意: 这会影响海风团队的完整性

-- 方案B: 保持现有结构，为赵六分配其他员工
-- 注意: 需要确认赵六应该管理哪些员工

-- 方案C: 如果赵六不应该有团队，修改系统逻辑
-- 注意: 需要确认赵六的角色定位

-- 请根据实际需求选择执行以下方案之一：

-- ===== 方案A: 转移钱七到赵六团队 =====
-- 1. 为赵六创建团队
-- INSERT INTO teams (id, name, leader_id, created_at)
-- VALUES (gen_random_uuid(), '赵六团队', '550e8400-e29b-41d4-a716-446655440013', NOW());

-- 2. 获取新团队ID
-- SELECT id FROM teams WHERE leader_id = '550e8400-e29b-41d4-a716-446655440013';

-- 3. 将钱七转移到赵六团队
-- UPDATE users SET team_id = '新团队ID' WHERE name LIKE '%钱%' OR name LIKE '%7%' OR name LIKE '%qi%';

-- ===== 方案B: 为赵六分配其他员工 =====
-- 1. 为赵六创建团队
-- INSERT INTO teams (id, name, leader_id, created_at)
-- VALUES (gen_random_uuid(), '赵六团队', '550e8400-e29b-41d4-a716-446655440013', NOW());

-- 2. 查看哪些员工没有团队
-- SELECT id, name, role FROM users WHERE role = 'employee' AND team_id IS NULL;

-- 3. 将无团队员工分配给赵六
-- UPDATE users SET team_id = '新团队ID' WHERE id = '员工ID';

-- ===== 验证修复结果 =====
-- 执行完修复后，运行以下查询验证：
-- SELECT 
--     u.name as user_name,
--     t.name as team_name,
--     leader.name as leader_name
-- FROM users u
-- LEFT JOIN teams t ON u.team_id = t.id
-- LEFT JOIN users leader ON t.leader_id = leader.id
-- WHERE u.name LIKE '%赵%' OR u.name LIKE '%钱%' OR u.name LIKE '%海%'
-- ORDER BY u.name;

