FROM python:3.9-slim

WORKDIR /app

# 复制依赖文件
COPY requirements-render.txt /app/

# 安装依赖
RUN pip install --no-cache-dir -r requirements-render.txt

# 复制应用代码
COPY . /app/

# 设置环境变量
ENV PYTHONPATH=/app
ENV PORT=8000

# 暴露端口
EXPOSE 8000

# 启动应用
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"] 