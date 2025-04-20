import json
import requests
from typing import Dict, Any, Optional, List

class DeepSeek:
    """DeepSeek API客户端，用于与DeepSeek API进行交互"""
    
    BASE_URL = "https://api.deepseek.com/v1"  # DeepSeek API基础URL
    
    def __init__(self, api_key: str):
        """
        初始化DeepSeek客户端
        
        Args:
            api_key: DeepSeek API密钥
        """
        self.api_key = api_key
        self.headers = {
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json"
        }
    
    def analyze_resume(self, resume_text: str) -> Dict[str, Any]:
        """
        分析简历内容
        
        Args:
            resume_text: 简历文本内容
            
        Returns:
            Dict 包含简历分析结果(摘要、关键词、建议)
        """
        try:
            # 构建分析简历的提示词
            prompt = f"""
            请分析以下简历内容，并提供:
            1. **简历内容摘要** (不超过150字)
            2. **关键技能提取** (列出5-10个最重要的技能关键词)
            3. **优化建议列表** (针对语言、结构、内容提出3-5条具体建议)

            简历内容:
            --- START ---
            {resume_text}
            --- END ---

            请按照以下JSON格式返回结果 (确保是有效的JSON):
            {{
                "summary": "<简历内容摘要>",
                "keywords": ["<关键词1>", "<关键词2>", ...],
                "suggestions": ["<建议1>", "<建议2>", ...]
            }}
            """
            
            # 向DeepSeek API发送请求
            response = self._call_completion_api(prompt)
            
            # 解析API返回的内容
            content = response.get("content", "")
            
            # 尝试从内容中提取JSON
            try:
                # 尝试直接解析完整JSON
                result = json.loads(content)
            except json.JSONDecodeError:
                # 如果不是有效JSON，尝试从文本中提取JSON部分
                try:
                    # 尝试找到JSON部分并解析
                    json_start = content.find('{')
                    json_end = content.rfind('}') + 1
                    if json_start >= 0 and json_end > json_start:
                        json_str = content[json_start:json_end]
                        result = json.loads(json_str)
                    else:
                        raise ValueError("无法从响应中提取JSON内容")
                except Exception:
                    # 如果仍然失败，创建一个基本结果
                    result = {
                        "summary": "无法从API响应中解析有效的摘要内容。",
                        "keywords": [],
                        "suggestions": ["API返回的数据格式有误，无法提取有效建议。"]
                    }
            
            # 确保结果包含所有需要的字段
            if not isinstance(result, dict):
                result = {}
            
            return {
                "summary": result.get("summary", "未能生成摘要"),
                "keywords": result.get("keywords", []),
                "suggestions": result.get("suggestions", [])
            }
            
        except Exception as e:
            print(f"调用DeepSeek API分析简历时出错: {e}")
            return {
                "summary": f"分析过程中出错: {str(e)}",
                "keywords": [],
                "suggestions": ["服务暂时不可用，请稍后重试"]
            }
    
    def _call_completion_api(self, prompt: str) -> Dict[str, Any]:
        """
        调用DeepSeek的文本生成API
        
        Args:
            prompt: 提示词
            
        Returns:
            Dict 包含API响应
        """
        try:
            payload = {
                "model": "deepseek-chat",  # 使用的模型，根据DeepSeek API实际支持的模型调整
                "messages": [
                    {"role": "system", "content": "你是一个专业的简历分析助手，擅长提取简历中的关键信息并给出改进建议。"},
                    {"role": "user", "content": prompt}
                ],
                "temperature": 0.5,
                "max_tokens": 800
            }
            
            response = requests.post(
                f"{self.BASE_URL}/chat/completions",
                headers=self.headers,
                data=json.dumps(payload),
                timeout=30
            )
            
            response.raise_for_status()  # 如果请求不成功则抛出异常
            result = response.json()
            
            # 提取回复内容
            try:
                content = result["choices"][0]["message"]["content"]
                return {"content": content}
            except (KeyError, IndexError):
                raise ValueError("API返回的数据格式不符合预期")
                
        except requests.exceptions.RequestException as e:
            print(f"请求DeepSeek API时出错: {e}")
            raise Exception(f"DeepSeek API请求失败: {str(e)}") 