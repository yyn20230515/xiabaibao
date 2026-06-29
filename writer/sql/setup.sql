-- ============================================
-- 虾虾写作助手 - 数据库初始化 SQL
-- 在 Supabase SQL Editor 中执行
-- ============================================

-- 1. 对话表
CREATE TABLE IF NOT EXISTS writer_conversations (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  title TEXT NOT NULL DEFAULT '新对话',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. 消息表
CREATE TABLE IF NOT EXISTS writer_messages (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  conversation_id BIGINT REFERENCES writer_conversations(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. 文件夹表
CREATE TABLE IF NOT EXISTS writer_folders (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. 文件表
CREATE TABLE IF NOT EXISTS writer_files (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  folder_id BIGINT REFERENCES writer_folders(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  content TEXT NOT NULL DEFAULT '',
  size INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. 文件分片表（用于大文件断点续传）
CREATE TABLE IF NOT EXISTS writer_file_chunks (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  file_id BIGINT REFERENCES writer_files(id) ON DELETE CASCADE,
  chunk_index INT NOT NULL,
  content TEXT NOT NULL,
  uploaded_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(file_id, chunk_index)
);

-- 启用 RLS
ALTER TABLE writer_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE writer_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE writer_folders ENABLE ROW LEVEL SECURITY;
ALTER TABLE writer_files ENABLE ROW LEVEL SECURITY;
ALTER TABLE writer_file_chunks ENABLE ROW LEVEL SECURITY;

-- 允许所有操作（单用户应用）
CREATE POLICY "Allow all" ON writer_conversations FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all" ON writer_messages FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all" ON writer_folders FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all" ON writer_files FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all" ON writer_file_chunks FOR ALL USING (true) WITH CHECK (true);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_writer_messages_conv ON writer_messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_writer_files_folder ON writer_files(folder_id);
CREATE INDEX IF NOT EXISTS idx_writer_file_chunks_file ON writer_file_chunks(file_id);
