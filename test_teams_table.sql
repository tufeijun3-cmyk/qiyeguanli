-- 检查 teams 表是否存在
SELECT EXISTS (
   SELECT FROM information_schema.tables 
   WHERE table_schema = 'public' 
   AND table_name = 'teams'
);

-- 如果表存在，查看表结构
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'teams'
ORDER BY ordinal_position;

-- 查看 teams 表中的数据
SELECT * FROM teams LIMIT 5;
