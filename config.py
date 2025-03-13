import json

class Concact_Persons:
    def __init__(self, parent_lang):
        self.parent_lang = parent_lang
        self.config = None  # 用于存储加载的配置

    def load_config(self):
        try:
            with open('config.json', 'r', encoding='utf-8') as f:
                self.config = json.load(f)
            return self.config.get(self.parent_lang, {})
        except FileNotFoundError:
            print("错误：找不到config.json文件")
            return {}
        except json.JSONDecodeError:
            print("错误：config.json文件格式不正确")
            return {}
        except Exception as e:
            print(f"错误：读取配置文件时发生异常: {str(e)}")
            return {}