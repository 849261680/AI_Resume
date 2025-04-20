# AI简历优化助手

一个基于人工智能的简历优化和分析工具，帮助求职者创建更专业、更有竞争力的简历。

## 主要功能

- 简历解析和分析
- 关键词提取和优化建议
- 内容优化和改进建议
- 简历模板推荐
- 实时编辑和预览

## 技术架构

### 后端
- FastAPI框架
- GPT集成
- 自然语言处理
- 简历解析引擎

### 前端
- React
- TypeScript
- 现代化UI组件
- 响应式设计

## 安装和运行

1. 安装依赖：
```bash
pip install -r requirements.txt
```

2. 启动后端服务：
```bash
uvicorn main:app --reload
```

3. 启动前端开发服务器：
```bash
cd frontend
npm install
npm run dev
```

## 项目结构

```
/
├── backend/           # 后端代码
│   ├── main.py       # 主应用入口
│   ├── models/       # 数据模型
│   ├── services/     # 业务逻辑
│   └── utils/        # 工具函数
├── frontend/         # 前端代码
│   ├── src/          # 源代码
│   ├── public/       # 静态资源
│   └── package.json  # 依赖配置
└── requirements.txt  # Python依赖
```