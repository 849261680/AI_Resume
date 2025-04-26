import json
import requests
from typing import Dict, Any, List, Optional

class OutputFormatter:
    """格式化输出解析器，类似于LangChain的OutputParser"""
    
    def __init__(self):
        self.format_description = {
            "summary": "简历的简短摘要，不超过150字",
            "keywords": "从简历中提取的5-10个关键技能和经验",
            "suggestions": "改进简历的3-5条具体建议"
        }
    
    def get_format_instructions(self) -> str:
        """获取格式化指令"""
        return f"""
请按照以下JSON格式返回结果:
{{
    "summary": "简历的简短摘要，不超过150字",
    "keywords": ["技能1", "技能2", ...],
    "suggestions": ["建议1", "建议2", ...]
}}
务必确保返回的是有效的JSON格式。
"""

class PromptTemplate:
    """提示模板，类似于LangChain的PromptTemplate"""
    
    def __init__(self, template: str, input_variables: List[str], partial_variables: Dict[str, str] = None):
        self.template = template
        self.input_variables = input_variables
        self.partial_variables = partial_variables or {}
    
    def format(self, **kwargs) -> str:
        """格式化提示模板"""
        template = self.template
        
        # 首先替换部分变量
        for key, value in self.partial_variables.items():
            template = template.replace(f"{{{key}}}", value)
        
        # 然后替换输入变量
        for key in self.input_variables:
            if key in kwargs:
                template = template.replace(f"{{{key}}}", kwargs[key])
        
        return template

class DeepSeekWrapper:
    """DeepSeek API包装器，提供类似LangChain的接口但不依赖LangChain"""
    
    def __init__(self, api_key: str):
        """初始化DeepSeek包装器"""
        self.api_key = api_key
        self.base_url = "https://api.deepseek.com/v1"
        self.model_name = "deepseek-chat"
        self.temperature = 0.5
        self.max_tokens = 800
        
        # 创建输出格式化器
        self.output_formatter = OutputFormatter()
        
        # 创建提示模板
        self.template = """
请分析以下简历内容，并提供详细的反馈：

{format_instructions}

简历内容:
--- START ---
{resume_text}
--- END ---
"""
        
        self.prompt = PromptTemplate(
            template=self.template,
            input_variables=["resume_text"],
            partial_variables={"format_instructions": self.output_formatter.get_format_instructions()}
        )
    
    def _call_api(self, prompt: str) -> str:
        """调用DeepSeek API"""
        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json"
        }
        
        payload = {
            "model": self.model_name,
            "messages": [
                {"role": "system", "content": "你是一个专业的简历分析助手，擅长提取简历中的关键信息并给出改进建议。"},
                {"role": "user", "content": prompt}
            ],
            "temperature": self.temperature,
            "max_tokens": self.max_tokens
        }
        
        try:
            response = requests.post(
                f"{self.base_url}/chat/completions",
                headers=headers,
                data=json.dumps(payload),
                timeout=30
            )
            
            response.raise_for_status()
            result = response.json()
            
            return result["choices"][0]["message"]["content"]
            
        except Exception as e:
            print(f"调用DeepSeek API时出错: {e}")
            raise e
    
    def analyze_resume(self, resume_text: str) -> Dict[str, Any]:
        """分析简历内容"""
        try:
            # 格式化提示
            formatted_prompt = self.prompt.format(resume_text=resume_text)
            
            # 调用API
            result = self._call_api(formatted_prompt)
            
            # 解析结果
            try:
                # 尝试从文本中提取JSON部分
                json_start = result.find('{')
                json_end = result.rfind('}') + 1
                if json_start >= 0 and json_end > json_start:
                    json_str = result[json_start:json_end]
                    parsed_json = json.loads(json_str)
                    return {
                        "summary": parsed_json.get("summary", "未能生成摘要"),
                        "keywords": parsed_json.get("keywords", []),
                        "suggestions": parsed_json.get("suggestions", [])
                    }
                else:
                    raise ValueError("无法从响应中提取JSON内容")
            except Exception as parse_error:
                print(f"解析DeepSeek输出时出错: {parse_error}")
                
                # 如果解析失败，返回一个基本结果
                return {
                    "summary": "无法从API响应中解析有效的摘要内容。",
                    "keywords": [],
                    "suggestions": ["API返回的数据格式有误，无法提取有效建议。"]
                }
                
        except Exception as e:
            print(f"分析简历过程中出错: {e}")
            return {
                "summary": f"分析过程中出错: {str(e)}",
                "keywords": [],
                "suggestions": ["服务暂时不可用，请稍后重试"]
            } 