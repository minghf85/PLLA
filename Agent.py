from openai import OpenAI
import ollama
class PLLAgent:#PLLAgent是基于LLM的Agent，personal language learning agent，用于执行各种任务。输出为markdown格式
    def __init__(self, platform, Input_config=None):
        self.Input_config = Input_config
        self.platform = platform
        self.client = OpenAI(api_key=self.platform.api_key, base_url=self.platform.url)
        self.messages = self.gen_messages(self.Input_config)

    def gen_messages(self, Input_config):
        #生成合适的prompt
        return f"你是一个智能AI助手，请用中文回答用户的问题。"
    
    def gen_normal_response(self, prompt, historys=[]):#根据prompt和history生成回复
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
        
    
    def gen_help_user_response(self, prompt="你是一个ai助手", historys=[]):#根据prompt生成帮助用户回复不懂不会回复的内容
        pass

    def gen_analysis(self, sentence):#为句子语法和特殊词语做说明
        #使用折叠文本形式
        # <details>
        #   <summary>分析</summary>
        #   此处可书写文本
        #   嗯，是可以书写文本的
        # </details>
        pass

    def gen_emphasis(self, prompt, sentence):#为重点词汇或风俗等添加发音或注释说明等等
        #形式如下面两种
        #这是一段文本，将鼠标放到<span title="这是一个提示说明"><u>这段文字</u></span>上查看提示。
        #<ruby>日本語 <rp>(</rp><rt>にほんご</rt><rp>)</rp></ruby>を<ruby>勉強 <rp>(</rp><rt>べんきょう</rt><rp>)</rp></ruby>しています。
        pass

    def gen_translation(self, M_lang, T_lang, sentence):#生成翻译
        prompt = f"请将以下句子翻译成{T_lang}：{sentence}"
        #使用折叠文本形式
        # <details>
        #   <summary>翻译</summary>
        #   此处可书写文本
        #   嗯，是可以书写文本的
        # </details>
        pass

    
    
    
    
