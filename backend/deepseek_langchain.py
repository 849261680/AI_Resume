import json
import requests
from typing import Dict, Any, List, Optional, Mapping


class LLM:
    """基础LLM类"""
    
    @property
    def _llm_type(self) -> str:
        pass
    
    def _call(
        self,
        prompt: str,
        stop: Optional[List[str]] = None,
    ) -> str:
        pass


class BaseModel:
    """基础模型类"""
    pass


def Field(description=None):
    """字段定义函数"""
    return None


class PromptTemplate:
    """提示模板类"""
    
    def __init__(self, template, input_variables, partial_variables=None):
        self.template = template
        self.input_variables = input_variables
        self.partial_variables = partial_variables or {}


class PydanticOutputParser:
    """Pydantic输出解析器"""
    
    def __init__(self, pydantic_object):
        self.pydantic_object = pydantic_object
    
    def parse(self, text):
        """解析文本为结构化对象"""
        # 简单实现，实际使用时需要更完善的逻辑
        import json
        try:
            return json.loads(text)
        except:
            return text
    
    def get_format_instructions(self):
        """获取格式说明"""
        return "请以JSON格式返回数据，包含以下字段：summary, keywords, suggestions"


class LLMChain:
    """LLM链类"""
    
    def __init__(self, llm, prompt):
        self.llm = llm
        self.prompt = prompt
    
    def run(self, **kwargs):
        """运行链"""
        # 简单实现
        formatted_prompt = self.prompt.template
        for key, value in kwargs.items():
            if key in self.prompt.input_variables:
                formatted_prompt = formatted_prompt.replace(f"{{{key}}}", value)
                
        for key, value in self.prompt.partial_variables.items():
            formatted_prompt = formatted_prompt.replace(f"{{{key}}}", value)
                
        return self.llm._call(formatted_prompt)


class KeywordsModel(BaseModel):
    summary: str = Field(description="简历的简短摘要，不超过150字")
    keywords: List[str] = Field(description="从简历中提取的5-10个关键技能和经验")
    suggestions: List[str] = Field(description="改进简历的3-5条具体建议")


class DeepSeekLLM(LLM):
    """DeepSeek API的LangChain LLM适配器"""
    
    api_key: str = None
    base_url: str = "https://api.deepseek.com/v1"
    model_name: str = "deepseek-chat"
    temperature: float = 0.5
    max_tokens: int = 800
    
    @property
    def _llm_type(self) -> str:
        return "deepseek"
    
    def _call(
        self,
        prompt: str,
        stop: Optional[List[str]] = None,
    ) -> str:
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


class ResumeAnalyzer:
    """使用LangChain处理简历分析的类"""
    
    def __init__(self, api_key: str):
        """初始化简历分析器"""
        self.llm = DeepSeekLLM(api_key=api_key)
        
        # 定义输出格式
        self.output_parser = PydanticOutputParser(pydantic_object=KeywordsModel)
        
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
            partial_variables={"format_instructions": self.output_parser.get_format_instructions()}
        )
        
        # 创建分析链
        self.chain = LLMChain(llm=self.llm, prompt=self.prompt)
    
    def analyze_resume(self, resume_text: str) -> Dict[str, Any]:
        """分析简历内容"""
        try:
            # 运行LangChain分析链
            result = self.chain.run(resume_text=resume_text)
            
            # 解析结构化输出
            try:
                parsed_output = self.output_parser.parse(result)
                return {
                    "summary": parsed_output.get("summary", ""),
                    "keywords": parsed_output.get("keywords", []),
                    "suggestions": parsed_output.get("suggestions", [])
                }
            except Exception as parse_error:
                print(f"解析DeepSeek输出时出错: {parse_error}")
                
                # 尝试从文本中提取JSON部分
                try:
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
                except Exception:
                    pass
                
                # 如果都失败，返回一个基本结果
                return {
                    "summary": "无法从API响应中解析有效的摘要内容。",
                    "keywords": [],
                    "suggestions": ["API返回的数据格式有误，无法提取有效建议。"]
                }
                
        except Exception as e:
            print(f"LangChain分析简历过程中出错: {e}")
            return {
                "summary": f"分析过程中出错: {str(e)}",
                "keywords": [],
                "suggestions": ["服务暂时不可用，请稍后重试"]
            } 