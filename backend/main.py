import io
import os
from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional
import uvicorn
from docx import Document
from PyPDF2 import PdfReader
from dotenv import load_dotenv
import sys
import os.path

# 添加当前目录到模块搜索路径
sys.path.append(os.path.dirname(os.path.abspath(__file__)))
# 从包装器导入DeepSeekWrapper
from deepseek_wrapper import DeepSeekWrapper

# 加载环境变量
load_dotenv()


# 配置 DeepSeekWrapper 客户端
deepseek_api_key = os.getenv("DEEPSEEK_API_KEY")
if not deepseek_api_key:
    print("警告：未找到 DEEPSEEK_API_KEY 环境变量。请设置该变量以使用 DeepSeek 功能。")
    deepseek_wrapper = None
else:
    deepseek_wrapper = DeepSeekWrapper(api_key=deepseek_api_key)

app = FastAPI(title="AI简历优化助手")

# 配置CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "https://ai-resume-analyzer.vercel.app",  # Vercel前端地址(示例)
        "http://localhost:3000",                  # 本地前端开发地址
        "*"                                       # 允许所有来源(生产环境可能需要限制)
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class ResumeAnalysis(BaseModel):
    summary: str # 摘要字段
    keywords: List[str]
    suggestions: List[str]

# 添加API前缀，匹配前端的请求路径
@app.post("/api/analyze", response_model=ResumeAnalysis)
async def analyze_resume(file: UploadFile = File(...)):
    if deepseek_wrapper is None:
        raise HTTPException(status_code=503, detail="DeepSeek 服务不可用，请检查 API 密钥配置。")

    try:
        content_bytes = await file.read()
        text_content = ""
        file_extension = file.filename.split('.')[-1].lower()

        # --- 文件解析逻辑 ---
        if file_extension == 'docx':
            try:
                doc = Document(io.BytesIO(content_bytes))
                text_content = "\n".join([para.text for para in doc.paragraphs])
            except Exception as e:
                raise HTTPException(status_code=400, detail=f"无法解析 DOCX 文件: {e}")
        elif file_extension == 'pdf':
            try:
                reader = PdfReader(io.BytesIO(content_bytes))
                text_content = "\n".join([page.extract_text() for page in reader.pages if page.extract_text()]) # 过滤空页面
            except Exception as e:
                raise HTTPException(status_code=400, detail=f"无法解析 PDF 文件: {e}")
        elif file_extension == 'txt':
             try:
                 text_content = content_bytes.decode('utf-8')
             except UnicodeDecodeError:
                 try:
                     text_content = content_bytes.decode('latin-1') # 尝试其他编码
                 except Exception as e:
                     raise HTTPException(status_code=400, detail=f"无法解码 TXT 文件: {e}")
        else:
            raise HTTPException(status_code=400, detail="不支持的文件类型，请上传 .docx, .pdf 或 .txt 文件")
        # --- 文件解析逻辑结束 ---

        if not text_content.strip():
             raise HTTPException(status_code=400, detail="无法从文件中提取有效文本内容。")

        # --- 使用 DeepSeekWrapper 进行分析 ---
        try:
            # 调用 DeepSeekWrapper 客户端分析简历
            analysis_result = deepseek_wrapper.analyze_resume(text_content)
            
            # 提取分析结果
            summary = analysis_result.get("summary", "未能生成摘要")
            keywords = analysis_result.get("keywords", [])
            suggestions = analysis_result.get("suggestions", [])
            
            return ResumeAnalysis(
                summary=summary,
                keywords=keywords,
                suggestions=suggestions
            )
        except Exception as e:
            print(f"调用 DeepSeek 分析服务时出错: {e}")
            raise HTTPException(status_code=500, detail=f"调用 DeepSeek 分析服务时出错: {e}")
        # --- DeepSeek 分析结束 ---

    except HTTPException as http_exc:
        # 重新抛出已知的 HTTP 异常
        raise http_exc
    except Exception as e:
        # 捕获其他意外错误
        print(f"处理简历时发生意外错误: {e}")
        raise HTTPException(status_code=500, detail=f"处理简历时发生意外错误: {e}")

# 保留原始路径，以兼容可能的直接调用
@app.post("/analyze", response_model=ResumeAnalysis)
async def analyze_resume_compat(file: UploadFile = File(...)):
    """兼容原始API路径的端点"""
    return await analyze_resume(file)

@app.get("/")
async def read_root():
    return {"message": "欢迎使用AI简历优化助手 (类LangChain风格实现)"}

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)