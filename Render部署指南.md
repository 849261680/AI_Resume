# AI简历优化助手 - Render部署指南

## 第一步：准备工作

1. **注册Render账号**
   - 访问 https://render.com
   - 使用GitHub账号或邮箱注册

2. **创建GitHub仓库**
   - 创建一个新的GitHub仓库
   - 将整个项目推送到该仓库
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git remote add origin https://github.com/您的用户名/AI_jianli.git
   git push -u origin main
   ```

## 第二步：部署后端API

1. **在Render控制台点击"New Web Service"**

2. **连接GitHub仓库**
   - 选择"Connect GitHub"
   - 授权Render访问您的GitHub账号
   - 选择您刚刚创建的仓库

3. **配置后端服务**
   - Name: `resume-api`（或您喜欢的名称）
   - Region: Singapore（亚洲访问较快）
   - Root Directory: 留空（使用项目根目录）
   - Environment: Python
   - Build Command: `pip install -r backend/requirements-render.txt`
   - Start Command: `cd backend && uvicorn main:app --host 0.0.0.0 --port $PORT`

4. **设置环境变量**
   - 点击"Advanced"展开高级选项
   - 添加环境变量：
     * `DEEPSEEK_API_KEY`: [您的DeepSeek API密钥]
     * `PORT`: 8000

5. **点击"Create Web Service"**

## 第三步：部署前端应用

1. **在Render控制台点击"New Static Site"**

2. **连接同一GitHub仓库**

3. **配置静态站点**
   - Name: `resume-frontend`（或您喜欢的名称）
   - Region: Singapore
   - Root Directory: 留空
   - Build Command: `cd frontend && npm install && npm run build`
   - Publish Directory: `frontend/dist`

4. **设置环境变量**
   - 添加环境变量：
     * `VITE_API_URL`: [您的后端API URL，形如https://resume-api.onrender.com]

5. **点击"Create Static Site"**

## 第四步：配置API代理和CORS

1. **修改前端环境变量**
   - 在后端部署成功后，获取后端URL
   - 更新前端服务的`VITE_API_URL`环境变量

2. **添加重定向规则**
   - 在前端静态站点的"Redirects/Rewrites"部分
   - 添加规则：
     * Source: `/api/*`
     * Destination: `https://您的后端域名/api/*`
     * Action: Rewrite

## 第五步：测试部署

1. **访问前端应用URL**
   - 形如 https://resume-frontend.onrender.com

2. **测试上传功能**
   - 上传一个简历文件
   - 检查是否正常分析并显示结果

## 第六步：自定义域名（可选）

1. **在Render控制台的服务设置中**
   - 点击"Custom Domain"
   - 添加您自己的域名

2. **在您的域名DNS设置中**
   - 添加CNAME记录，指向Render提供的域名

## 常见问题解决

**问题1: 后端API返回404**
- 检查API路径是否正确，应为`/api/analyze`
- 检查前端代理配置是否正确

**问题2: 前端无法连接后端**
- 确认后端URL配置正确
- 检查CORS配置是否允许前端域名访问

**问题3: 部署失败**
- 检查构建日志中的错误信息
- 确保所有依赖版本兼容

**问题4: DeepSeek API调用失败**
- 检查API密钥是否正确设置
- 检查API调用格式是否符合DeepSeek要求

## 注意事项

1. **Render免费套餐限制**
   - 静态站点完全免费
   - Web服务有750小时免费额度（足够单个服务全月运行）
   - 免费Web服务在15分钟不活动后会休眠

2. **添加防休眠方案（可选）**
   - 使用第三方服务如UptimeRobot定期ping您的应用
   - 每14分钟ping一次可以防止服务休眠 