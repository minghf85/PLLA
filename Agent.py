import openai
import ollama
class PLLAgent:#PLLAgent是基于LLM的Agent，personal language learning agent，用于执行各种任务。
    def __init__(self, platform):
        self.platform = platform

    def run(self):
        pass

    def gen_response(self, prompt, historys):#根据prompt和history生成回复
        pass

    def gen_comment(self, prompt):#为句子语法和特殊词语做说明
        pass

    def gen_emphasis(self, prompt):#为重点部分添加强调
        pass

    def gen_translation(self, prompt):#生成翻译
        pass

    
    
    
    
