-- 设置Supabase Storage
-- 在Supabase SQL编辑器中执行此脚本

-- 创建存储桶
INSERT INTO storage.buckets (id, name, public) VALUES ('images', 'images', true);

-- 设置存储桶策略，允许所有用户上传和查看图片
CREATE POLICY "Allow public uploads" ON storage.objects
FOR INSERT WITH CHECK (bucket_id = 'images');

CREATE POLICY "Allow public access" ON storage.objects
FOR SELECT USING (bucket_id = 'images');

-- 设置文件大小限制 (10MB)
UPDATE storage.buckets 
SET file_size_limit = 10485760 
WHERE id = 'images';

-- 验证设置
SELECT * FROM storage.buckets WHERE id = 'images';
