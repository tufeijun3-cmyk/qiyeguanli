-- 验证并修复员工归属问题
-- 问题：管理后台显示修改成功，但数据库实际没有更新

-- 第一步: 验证当前钱七的归属
SELECT '=== 钱七当前归属验证 ===' as info;
SELECT 
    u.id,
    u.name,
    u.role,
    u.team_id,
    t.name as team_name,
    leader.name as leader_name,
    leader.id as leader_id
FROM users u
LEFT JOIN teams t ON u.team_id = t.id
LEFT JOIN users leader ON t.leader_id = leader.id
WHERE u.name LIKE '%钱%' OR u.name LIKE '%7%' OR u.name LIKE '%qi%';

-- 第二步: 验证赵六团队信息
SELECT '=== 赵六团队信息验证 ===' as info;
SELECT 
    t.id as team_id,
    t.name as team_name,
    t.leader_id,
    leader.name as leader_name
FROM teams t
LEFT JOIN users leader ON t.leader_id = leader.id
WHERE t.leader_id = '550e8400-e29b-41d4-a716-446655440013';

-- 第三步: 手动修复钱七的归属（如果验证失败）
-- 注意: 需要替换为实际的团队ID和用户ID
-- 从第一步和第二步的结果中获取实际ID

-- 示例格式（请替换为实际ID）:
-- UPDATE users SET team_id = '赵六团队ID' WHERE id = '钱七用户ID';

-- 第四步: 验证修复结果
SELECT '=== 修复后验证 ===' as info;
SELECT 
    u.name as user_name,
    t.name as team_name,
    leader.name as leader_name
FROM users u
LEFT JOIN teams t ON u.team_id = t.id
LEFT JOIN users leader ON t.leader_id = leader.id
WHERE u.name LIKE '%钱%' OR u.name LIKE '%7%' OR u.name LIKE '%qi%';

-- 第五步: 验证赵六团队的所有成员
SELECT '=== 赵六团队所有成员 ===' as info;
SELECT 
    u.name,
    u.role,
    t.name as team_name
FROM users u
LEFT JOIN teams t ON u.team_id = t.id
WHERE t.leader_id = '550e8400-e29b-41d4-a716-446655440013'
ORDER BY u.role, u.name;

-- 第六步: 验证客户归属关系
SELECT '=== 客户归属关系验证 ===' as info;
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

