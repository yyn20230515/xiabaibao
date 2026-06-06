-- 📚 小说模块建表 SQL
-- 在 Supabase SQL Editor 中执行

-- 小说作品表
CREATE TABLE IF NOT EXISTS novels (
  id BIGSERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT DEFAULT '',
  cover TEXT DEFAULT '',
  sort_order INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 小说章节表
CREATE TABLE IF NOT EXISTS novel_chapters (
  id BIGSERIAL PRIMARY KEY,
  novel_id BIGINT REFERENCES novels(id) ON DELETE CASCADE,
  volume_name TEXT DEFAULT '',      -- 卷名（如"卷1·新手派遣员"）
  chapter_num INT DEFAULT 0,        -- 章节号
  title TEXT DEFAULT '',            -- 章节标题
  content TEXT NOT NULL,            -- 章节正文
  file_path TEXT DEFAULT '',        -- 原始文件路径（参考用）
  word_count INT DEFAULT 0,         -- 字数
  sort_order INT DEFAULT 0,         -- 排序
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 书评表
CREATE TABLE IF NOT EXISTS novel_reviews (
  id BIGSERIAL PRIMARY KEY,
  chapter_id BIGINT REFERENCES novel_chapters(id) ON DELETE CASCADE,
  author TEXT DEFAULT '主人',
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 索引
CREATE INDEX IF NOT EXISTS idx_novel_chapters_novel_id ON novel_chapters(novel_id);
CREATE INDEX IF NOT EXISTS idx_novel_chapters_sort ON novel_chapters(novel_id, sort_order);
CREATE INDEX IF NOT EXISTS idx_novel_reviews_chapter_id ON novel_reviews(chapter_id);

-- RLS（行级安全）- 允许公开读取，仅认证用户可写
ALTER TABLE novels ENABLE ROW LEVEL SECURITY;
ALTER TABLE novel_chapters ENABLE ROW LEVEL SECURITY;
ALTER TABLE novel_reviews ENABLE ROW LEVEL SECURITY;

-- 所有人都可读取
CREATE POLICY "novels_readable_by_all" ON novels FOR SELECT USING (true);
CREATE POLICY "chapters_readable_by_all" ON novel_chapters FOR SELECT USING (true);
CREATE POLICY "reviews_readable_by_all" ON novel_reviews FOR SELECT USING (true);

-- 所有人可插入书评
CREATE POLICY "reviews_insertable_by_all" ON novel_reviews FOR INSERT WITH CHECK (true);

-- 管理员可写入小说数据（通过 anon key + 自定义 header 或 service_role）
-- 注意：实际导入时需要临时放开或使用 service_role key
-- 如果使用 anon key 导入报错，先执行：
-- CREATE POLICY "novels_insertable_by_all" ON novels FOR INSERT WITH CHECK (true);
-- CREATE POLICY "chapters_insertable_by_all" ON novel_chapters FOR INSERT WITH CHECK (true);
-- 导入完成后删除这些 policy 或只保留 SELECT
