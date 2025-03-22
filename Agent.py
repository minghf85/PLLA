from openai import OpenAI
from prompt import *
import ollama

class PLLAgent:
    """PLLAgent是基于LLM的Agent，personal language learning agent，用于执行各种任务。输出为markdown格式"""
    
    def __init__(self, platform, Input_config=None):
        self.Input_config = Input_config
        self.platform = platform
        self.client = OpenAI(api_key=self.platform.api_key, base_url=self.platform.url)
    
    def gen_normal_response(self, prompt, historys=[]):
        """根据prompt和history生成一般标准回复，也用于生成翻译语音生成"""
        try:
            # 构建消息列表
            if isinstance(historys, str):
                messages = [
                    {"role": "system", "content": prompt},
                    {"role": "user", "content": historys}
                ]
            elif isinstance(historys, list):
                # 确保历史消息列表中的每个消息都有正确的格式
                if historys and isinstance(historys[0], dict):
                    messages = [{"role": "system", "content": prompt}] + historys
                else:
                    # 如果历史消息不是字典格式，将其转换为正确的格式
                    formatted_historys = [
                        {"role": "user" if i % 2 == 0 else "assistant", "content": msg}
                        for i, msg in enumerate(historys)
                    ]
                    messages = [{"role": "system", "content": prompt}] + formatted_historys
            else:
                raise ValueError("historys must be string or list")

            print(f"Sending request to model: {self.platform.model}")
            print(f"Messages: {messages}")

            response = self.client.chat.completions.create(
                model=self.platform.model,
                messages=messages,
                stream=True
            )
            
            for chunk in response:
                if chunk.choices[0].delta.content is not None:
                    yield chunk.choices[0].delta.content

        except Exception as e:
            print(f"Error in gen_normal_response: {str(e)}")
            print(f"Error type: {type(e)}")
            import traceback
            print(f"Traceback: {traceback.format_exc()}")
            yield "抱歉，发生了错误，请稍后重试。"

    def gen_help_user_response(self,  M_lang, T_lang, historys=[]):
        #反转historys的内容,user的输入变成的输入，ai的输入变成用户的输入
        historys = self.reverse_roles(historys)

        try:
            # 构建系统提示词
            system_prompt = f"""用户的母语是{M_lang}，目标学习语言是{T_lang}。帮助用户回答不懂不会的问题。"""

            # 调用标准响应生成方法
            for token in self.gen_normal_response(system_prompt, historys):
                yield token

        except Exception as e:
            print(f"Error in gen_help_user_response: {str(e)}")
            yield "抱歉，生成帮助回答时发生错误。"

    def gen_aimsg_analysis(self,  M_lang, T_lang, sentence):
        """为句子语法和特殊词语做说明以及注音"""
        try:
            # 构建系统提示词
            if M_lang == "zh" and T_lang == "en":
                system_prompt = zh2en
            elif M_lang == "zh" and T_lang == "ja":
                system_prompt = zh2ja
            elif M_lang == "en" and T_lang == "zh":
                system_prompt = en2zh

            # 调用标准响应生成方法
            for token in self.gen_normal_response(system_prompt, sentence):
                yield token

        except Exception as e:
            print(f"Error in gen_analysis: {str(e)}")
            yield "抱歉，生成分析时发生错误。"
    def gen_usermsg_analysis(self, M_lang, T_lang, sentence):
        """为句子语法和特殊词语做说明以及注音"""
        try:
            # 构建系统提示词
            system_prompt = f"""这名用户的母语是{M_lang}，目标学习语言是{T_lang}。帮助用户分析他说的话是否符合语法和当地特色，并打分。"""

            # 调用标准响应生成方法  
            for token in self.gen_normal_response(system_prompt, sentence):
                yield token

        except Exception as e:
            print(f"Error in gen_user_analysis: {str(e)}")
            yield "抱歉，生成用户分析时发生错误。"
    def gen_translation(self, M_lang, T_lang, sentence):
        """生成翻译"""
        try:
            # 构建系统提示词
            system_prompt = f"""你是一个专业翻译。请将以下{T_lang}句子翻译成{M_lang}。
请遵循以下规则：
1. 保持原文的意思和语气
2. 使用地道的目标语言表达
3. 对于特殊表达提供额外说明
4. 只生成翻译，不要生成其他内容
"""

            # 调用标准响应生成方法
            for token in self.gen_normal_response(system_prompt, sentence):
                yield token

        except Exception as e:
            print(f"Error in gen_translation: {str(e)}")
            yield "抱歉，生成翻译时发生错误。"
    def reverse_roles(history):
        """将历史消息中的user和assistant角色互换"""
        reversed_history = []
        for msg in history:
            new_role = "assistant" if msg["role"] == "user" else "user"
            reversed_history.append({
                "role": new_role,
                "content": msg["content"]
            })
        return reversed_history

    
    
    
    
