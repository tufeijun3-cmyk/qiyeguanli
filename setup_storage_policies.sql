-- 设置Supabase Storage访问策略
-- 在Supabase SQL编辑器中执行此脚本

-- 允许所有用户上传图片到images存储桶
CREATE POLICY "Allow public uploads" ON storage.objects
FOR INSERT WITH CHECK (bucket_id = 'images');

-- 允许所有用户查看images存储桶中的图片
CREATE POLICY "Allow public access" ON storage.objects
FOR SELECT USING (bucket_id = 'images');

-- 允许所有用户删除images存储桶中的图片
CREATE POLICY "Allow public deletes" ON storage.objects
FOR DELETE USING (bucket_id = 'images');

-- 验证策略是否创建成功
SELECT * FROM pg_policies WHERE tablename = 'objects' AND schemaname = 'storage';
