-- 检查 teams 表的实际结构
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'teams'
ORDER BY ordinal_position;
