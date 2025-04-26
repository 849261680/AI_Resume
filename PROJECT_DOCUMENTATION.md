# AI简历分析助手项目文档

## 1. 项目背景

AI简历分析助手是一个利用深度学习技术自动分析简历内容并提供专业优化建议的Web应用。该项目旨在帮助求职者快速获得客观的简历评估，了解自身优势和不足，从而提高简历质量和求职成功率。

项目采用前后端分离架构，结合DeepSeek AI大模型，实现了简历文档的智能解析和深度分析功能，为用户提供即时的简历反馈和优化方案。

## 2. 功能说明

- **简历文件上传**：支持PDF、DOCX和TXT格式的简历文件上传
- **自动内容提取**：自动从上传的简历文件中提取文本内容
- **智能分析处理**：利用DeepSeek AI大模型分析简历内容
- **结果可视化展示**：
  - 简历摘要：提供简洁的简历整体概括
  - 关键技能标签：识别并展示简历中的核心技能和优势
  - 优化建议列表：针对简历内容提供专业、可行的改进建议

## 3. 技术栈

### 前端
- **框架**：React 18
- **构建工具**：Vite
- **开发语言**：TypeScript
- **UI组件库**：Ant Design 4.x
- **HTTP客户端**：Axios
- **部署平台**：Vercel

### 后端
- **框架**：FastAPI
- **开发语言**：Python 3.9
- **文档处理**：python-docx, PyPDF2
- **API集成**：DeepSeek AI API
- **容器化**：Docker
- **部署平台**：Railway

### 部署架构
```
                +----------------+
                |                |
用户 ----------> |  Vercel (前端)  |
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

## 4. 遇到的问题和解决方法

### Docker配置与部署问题

**问题**：初始没有Dockerfile，导致无法在Railway上成功部署。

**解决方法**：
- 为前端和后端分别创建了Dockerfile
- 后端Dockerfile配置：
  ```dockerfile
  FROM python:3.9-slim
  WORKDIR /app
  COPY requirements-render.txt /app/
  RUN pip install --no-cache-dir -r requirements-render.txt
  COPY . /app/
  ENV PYTHONPATH=/app
  ENV PORT=8000
  EXPOSE 8000
  CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
  ```
- 前端Dockerfile采用多阶段构建，优化了部署效率。

### TypeScript类型错误

**问题**：在处理Axios错误时，TypeScript报错"err is of type 'unknown'"。

**解决方法**：
- 导入Axios错误类型：`import axios, { AxiosError } from 'axios'`
- 使用类型守卫正确处理错误：
  ```typescript
  if (axios.isAxiosError(err)) {
    const axiosError = err as AxiosError;
    // 处理Axios错误
  } else if (err instanceof Error) {
    // 处理普通JavaScript错误
  }
  ```
- 创建Vite环境类型声明文件，解决`import.meta.env`类型问题。

### 前后端通信问题(404错误)

**问题**：前端部署后无法连接到后端API，返回404错误。

**解决方法**：
- 在Vercel项目中添加环境变量`VITE_API_URL`，指向Railway后端URL
- 修改前端代码，显式使用环境变量作为API基础URL：
  ```typescript
  const apiUrl = import.meta.env.VITE_API_URL;
  const response = await axios.post(`${apiUrl}/api/analyze`, formData, {...});
  ```

### API密钥配置问题

**问题**：DeepSeek API服务不可用，提示检查API密钥配置。

**解决方法**：
- 在Railway项目中添加`DEEPSEEK_API_KEY`环境变量
- 设置正确的DeepSeek API密钥值，确保后端服务能够正常调用AI接口

### 网络访问限制问题

**问题**：应用在国内环境访问受限，需要"翻墙"才能使用。

**解决方案**：
- 短期：通过VPN或代理服务访问
- 长期：考虑将前端部署到对国内访问更友好的平台，如Cloudflare Pages或Netlify
- 进阶：为应用添加自定义域名，或将后端部署到香港/亚洲区域服务器

## 5. 未来改进方向

- **多语言支持**：添加中英文等多语言简历分析能力
- **行业特化分析**：针对不同行业提供定制化的简历分析和建议
- **简历模板推荐**：基于分析结果推荐适合的简历模板和格式
- **对比分析**：支持多个版本简历的对比分析
- **可访问性优化**：改善应用在国内环境的访问体验

---

项目地址：
- 前端：https://ai-resume-phi-two.vercel.app
- 后端：https://ai-resume-production-d33e.up.railway.app

*注：因部署平台限制，国内用户访问可能需要使用代理或VPN服务。* 