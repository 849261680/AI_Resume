# AI简历优化助手
🎯 在线 Demo: [https://ai345.vercel.app](https://ai345.vercel.app)  
📄 项目作者: [彭世雄](https://psx1.vercel.app)  
📌 说明：本项目由我独立设计并实现，旨在构建一个可部署、可演示的AI简历优化系统，用于展示我在 AI 应用开发（前端 + 后端 + 大模型调用）方向的工程能力

## 项目简介
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
- 类LangChain架构实现
- DeepSeek AI API集成
- 结构化输出解析
- 自然语言处理
- 简历解析引擎

### 前端
- React
- TypeScript
- 现代化UI组件
- 响应式设计

## 技术亮点

- **类LangChain架构**：实现了与LangChain类似的架构设计，包括提示模板、格式化输出等核心功能
- **可扩展的AI模型接口**：通过模块化设计，可轻松切换不同的AI服务提供商
- **强类型结构化输出**：自定义输出解析器，确保AI返回数据的一致性和可靠性
- **模块化提示模板**：实现了类似PromptTemplate的功能，支持变量替换和模板复用

## 安装和运行

1. 安装依赖：
```bash
pip install -r requirements.txt
```

2. 启动后端服务：
```bash
uvicorn backend.main:app --reload
```

3. 启动前端开发服务器：
```bash
cd frontend
npm install
npm run dev
```

## 环境变量

请创建一个`.env`文件，并设置以下环境变量：

```
DEEPSEEK_API_KEY=你的DeepSeek_API密钥
```

## 项目结构

```
/
├── backend/                       # 后端代码
│   ├── main.py                   # 主应用入口
│   ├── deepseek_wrapper.py       # 类LangChain风格实现
│   ├── requirements-render.txt   # 部署依赖
├── frontend/                     # 前端代码
│   ├── src/                      # 源代码
│   ├── public/                   # 静态资源
│   └── package.json              # 依赖配置
└── requirements.txt              # Python依赖
```