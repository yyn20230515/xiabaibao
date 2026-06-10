-- ============================================
-- 百宝箱农场功能扩展 - 数据库建表SQL
-- 执行前请确保已有 farm_plots 和 farm_inventory 表
-- ============================================

-- 1. 扩展 farm_plots 表：增加浇水/施肥字段
ALTER TABLE farm_plots
ADD COLUMN IF NOT EXISTS watered_at TIMESTAMPTZ DEFAULT NULL,
ADD COLUMN IF NOT EXISTS fertilized_at TIMESTAMPTZ DEFAULT NULL;

-- 2. 创建金币表
CREATE TABLE IF NOT EXISTS farm_coins (
  id INTEGER PRIMARY KEY DEFAULT 1,
  balance INTEGER DEFAULT 100,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 初始化金币（默认100金币）
INSERT INTO farm_coins (id, balance)
VALUES (1, 100)
ON CONFLICT (id) DO NOTHING;

-- 3. 为 farm_inventory 添加默认种子库存（新作物）
-- 现有作物库存保持不变，新作物初始为0
INSERT INTO farm_inventory (crop, count) VALUES
('sunflower', 0),
('corn', 0),
('pumpkin', 0),
('grape', 0),
('watermelon', 0),
('pineapple', 0),
('eggplant', 0),
('cherry', 0)
ON CONFLICT (crop) DO NOTHING;

-- ============================================
-- 新增作物说明（在代码中定义）
-- ============================================
-- sunflower: 向日葵 🌻 - 3小时 - 售价50金币
-- corn: 玉米 🌽 - 4小时 - 售价70金币
-- pumpkin: 南瓜 🎃 - 6小时 - 售价100金币
-- grape: 葡萄 🍇 - 8小时 - 售价150金币
-- watermelon: 西瓜 🍉 - 12小时 - 售价200金币
-- pineapple: 菠萝 🍍 - 18小时 - 售价300金币
-- eggplant: 茄子 🍆 - 24小时 - 售价400金币
-- cherry: 樱桃 🍒 - 30小时 - 售价500金币
-- ============================================
