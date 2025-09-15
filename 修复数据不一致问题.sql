-- 修复员工表和客户表数据不一致问题
-- 问题：客户表中的owner_id指向的用户，与员工表中的团队归属不匹配

-- 第一步: 查看当前数据不一致情况
SELECT '=== 数据不一致分析 ===' as info;
SELECT 
    c.name as customer_name,
    c.contact,
    c.owner_id,
    owner.name as owner_name,
    owner.role as owner_role,
    t.name as owner_team_name,
    leader.name as owner_leader_name,
    owner.supervisor_id,
    supervisor.name as supervisor_name
FROM customers c
LEFT JOIN users owner ON c.owner_id = owner.id
LEFT JOIN teams t ON owner.team_id = t.id
LEFT JOIN users leader ON t.leader_id = leader.id
LEFT JOIN users supervisor ON owner.supervisor_id = supervisor.id
WHERE c.is_deleted = false
ORDER BY owner.name, c.name;

-- 第二步: 查看员工表中的团队归属关系
SELECT '=== 员工团队归属关系 ===' as info;
SELECT 
    u.name as employee_name,
    u.role,
    u.team_id,
    t.name as team_name,
    leader.name as leader_name,
    u.supervisor_id,
    supervisor.name as supervisor_name
FROM users u
LEFT JOIN teams t ON u.team_id = t.id
LEFT JOIN users leader ON t.leader_id = leader.id
LEFT JOIN users supervisor ON u.supervisor_id = supervisor.id
WHERE u.role IN ('employee', 'team_leader')
ORDER BY u.role, u.name;

-- 第三步: 识别需要修复的客户数据
SELECT '=== 需要修复的客户数据 ===' as info;
SELECT 
    c.id as customer_id,
    c.name as customer_name,
    c.owner_id,
    owner.name as current_owner,
    owner.role as owner_role,
    t.name as current_team,
    leader.name as current_leader,
    -- 根据员工表，客户应该归属到谁
    CASE 
        WHEN owner.name = '钱七' THEN '赵六团队'
        WHEN owner.name = '李四' THEN '赵六团队'
        WHEN owner.name = '张三' THEN '海风团队'
        ELSE '未知'
    END as should_be_team,
    CASE 
        WHEN owner.name = '钱七' THEN '赵六'
        WHEN owner.name = '李四' THEN '赵六'
        WHEN owner.name = '张三' THEN '海风'
        ELSE '未知'
    END as should_be_leader
FROM customers c
LEFT JOIN users owner ON c.owner_id = owner.id
LEFT JOIN teams t ON owner.team_id = t.id
LEFT JOIN users leader ON t.leader_id = leader.id
WHERE c.is_deleted = false
ORDER BY owner.name, c.name;

-- 第四步: 验证修复后的数据一致性
-- 注意: 修复后执行此查询验证
SELECT '=== 修复后验证 ===' as info;
SELECT 
    c.name as customer_name,
    c.contact,
    owner.name as owner_name,
    owner.role as owner_role,
    t.name as team_name,
    leader.name as leader_name
FROM customers c
LEFT JOIN users owner ON c.owner_id = owner.id
LEFT JOIN teams t ON owner.team_id = t.id
LEFT JOIN users leader ON t.leader_id = leader.id
WHERE c.is_deleted = false
ORDER BY owner.name, c.name;

