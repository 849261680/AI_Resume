# AI简历分析助手部署文档

## 项目概述

AI简历分析助手是一个利用DeepSeek AI API分析简历并提供优化建议的应用。项目采用前后端分离架构，本文档详细介绍如何使用Vercel和Railway进行部署。

## 部署架构

```
                    +----------------+
                    |                |
 用户 ------------>  |  Vercel (前端)  |
                    |                |
                    +--------+-------+
                             |
                             | API请求
                             v
                    +----------------+
                    |                |
                    | Railway (后端)  | ------> DeepSeek API
                    |                |
                    +----------------+
```

## 前提条件

- GitHub账号
- DeepSeek API密钥
- Railway账号
- Vercel账号
- Node.js环境（用于本地测试）

## 后端部署 (Railway)

### 1. 准备文件

在项目根目录创建`Procfile`文件（无扩展名）:
```
web: cd backend && uvicorn main:app --host 0.0.0.0 --port $PORT
```

### 2. CORS配置

修改`backend/main.py`，添加CORS中间件支持：

```python
from fastapi.middleware.cors import CORSMiddleware

app.add_middleware(
    CORSMiddleware,
    allow_origins=["https://your-app-name.vercel.app", "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

### 3. Railway部署

1. 访问[Railway](https://railway.app/)并登录
2. 点击"New Project" → "Deploy from GitHub repo"
3. 授权并选择GitHub仓库
4. 配置环境变量：
   - `DEEPSEEK_API_KEY=您的API密钥`
   - `PORT=8000`
5. 等待部署完成
6. 点击"Settings" → "Domains"，获取并记录应用URL

## 前端部署 (Vercel)

### 1. API配置

在`frontend`目录中创建`.env.production`文件：
```
VITE_API_URL=https://your-railway-app-url.railway.app
```

确保前端代码中使用环境变量获取API URL：

```js
// 例如在api.js文件中
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

export const analyzeResume = async (resumeText) => {
  const response = await fetch(`${API_URL}/analyze`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ resume_text: resumeText }),
  });
  return response.json();
};
```

### 2. Vercel部署

1. 访问[Vercel](https://vercel.com/)并登录
2. 点击"New Project" → "Import Git Repository"
3. 选择您的GitHub仓库
4. 配置部署设置：
   - Framework Preset: 选择`Create React App`或其他适合的前端框架
   - Root Directory: `frontend`（如果前端代码在此目录下）
   - Build Command: `npm run build`
   - Output Directory: `dist`（对于Vite项目）或`build`（对于CRA项目）
5. 点击"Deploy"并等待部署完成

## 环境变量配置

### Railway环境变量

| 变量名 | 描述 | 示例 |
|-------|------|------|
| DEEPSEEK_API_KEY | DeepSeek API密钥 | sk-xxxxx |
| PORT | 应用运行端口 | 8000 |

### Vercel环境变量

| 变量名 | 描述 | 示例 |
|-------|------|------|
| VITE_API_URL | 后端API地址 | https://your-app.railway.app |

## 部署测试

1. 访问Vercel生成的URL
2. 上传或输入简历内容
3. 测试分析功能是否正常工作
4. 检查API响应速度和稳定性

## 故障排除

### 常见问题

1. **CORS错误**:
   - 检查后端CORS配置是否包含正确的前端URL
   - 确认前端API调用URL格式正确

2. **API连接失败**:
   - 验证环境变量`VITE_API_URL`设置正确
   - 检查Railway应用是否正常运行

3. **DeepSeek API错误**:
   - 确认`DEEPSEEK_API_KEY`有效且未过期
   - 检查API用量限制

## 维护与更新

### 更新流程

1. 将更改推送至GitHub仓库
2. Vercel和Railway会自动检测更改并重新部署
3. 监控部署日志确保更新成功

### 性能监控

- 使用Railway提供的监控工具跟踪API性能
- 考虑添加第三方监控服务（如New Relic, Sentry）

## 安全与合规

- 定期更新依赖包
- 确保API密钥不被提交到版本控制系统
- 考虑添加速率限制防止API滥用

## 参考资源

- [Railway文档](https://docs.railway.app/)
- [Vercel文档](https://vercel.com/docs)
- [FastAPI文档](https://fastapi.tiangolo.com/)
- [React部署指南](https://create-react-app.dev/docs/deployment/)

---

本文档适用于最新版本的AI简历分析助手项目。如有问题或需要更新，请提交issue或PR。 