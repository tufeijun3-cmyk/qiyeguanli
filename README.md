# 企业管理系统

一个基于React + Supabase的现代化企业管理系统，包含财务管理、人事管理、客户管理等核心功能。

## 功能特性

### 🏢 多角色管理
- **超级管理员**: 系统管理、用户管理、客户管理
- **主管**: 团队管理、审批流程
- **组长**: 团队申请审批、客户跟踪
- **员工**: 申请提交、客户管理
- **财务**: 财务审批、报表管理

### 💰 财务管理
- 费用申请与审批
- 多级审批流程
- 费用分类管理
- 财务报表统计

### 👥 人事管理
- 员工信息管理
- 团队组织结构
- 薪资管理
- 权限控制

### 📊 客户管理
- 客户信息录入
- 投资偏好跟踪
- 股票购买记录
- 群组状态管理
- 跟进记录

### 📱 设备管理
- 设备申请与分配
- 设备状态跟踪
- 维护记录

## 技术栈

- **前端**: React 18 + Vite
- **UI框架**: Tailwind CSS
- **后端**: Supabase (PostgreSQL + Auth + Storage)
- **图标**: Lucide React
- **部署**: Render

## 快速开始

### 环境要求
- Node.js 18+
- npm 或 yarn

### 安装依赖
```bash
npm install
```

### 环境配置
创建 `.env.local` 文件：
```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 开发运行
```bash
npm run dev
```

### 构建生产版本
```bash
npm run build
```

### 预览生产版本
```bash
npm run preview
```

## 部署

### Render部署
1. 将代码推送到Git仓库
2. 在Render中连接Git仓库
3. 选择Static Site类型
4. 配置环境变量
5. 部署

### 环境变量
- `VITE_SUPABASE_URL`: Supabase项目URL
- `VITE_SUPABASE_ANON_KEY`: Supabase匿名密钥

## 数据库结构

### 核心表
- `users`: 用户信息
- `teams`: 团队信息
- `expenses`: 费用申请
- `customers`: 客户信息
- `followups`: 客户跟进
- `devices`: 设备信息

## 项目结构

```
src/
├── components/          # React组件
│   ├── AdminView.jsx   # 管理员界面
│   ├── LeaderView.jsx  # 组长界面
│   ├── EmployeeDashboard.jsx # 员工界面
│   └── FinanceView.jsx # 财务界面
├── supabase.js         # Supabase客户端
├── App.jsx            # 主应用组件
├── main.jsx           # 应用入口
└── index.css          # 全局样式
```

## 开发指南

### 代码规范
- 使用ESLint进行代码检查
- 使用Prettier进行代码格式化
- 遵循React最佳实践

### 提交规范
- feat: 新功能
- fix: 修复bug
- docs: 文档更新
- style: 代码格式调整
- refactor: 代码重构
- test: 测试相关
- chore: 构建过程或辅助工具的变动

## 许可证

MIT License

## 联系方式

如有问题，请提交Issue或联系开发团队。