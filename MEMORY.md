# MEMORY.md - 长期记忆

## 人物别名

- **小百** = "给百宝箱开发这个同事"
  - 以后用户说"让小百干活"或"派小百做xxx"，就是指派发给子代理（subagent）去完成任务
  - 子代理默认使用模型: xfyun/astron-code-latest（中文支持好，不会报 ByteString 编码错误）

## 技术配置

- 子代理模型: `xfyun/astron-code-latest`（讯飞 Astron Code）
  - 原因: 智谱模型会报 "Cannot convert argument to a ByteString because the character at index 7 has a value of 20320 which is greater than 255." 错误
  - 讯飞模型对中文支持更好，无此问题

## ⚠️ 重要工作流程

### 提交代码前必写更新日志

**每次提交代码前，必须先往百宝箱日常记录写入更新日志！**

流程：
1. 完成代码修改
2. **写入更新日志** → Supabase `dailylog` 表
3. 再执行 git commit + push

更新日志内容：
- 日期、时间、修改内容摘要
- 涉及的文件/模块
- 功能说明或bug修复说明

**不写更新日志就不提交代码！这是硬性规定。**
