import json

class Concact_Persons:
    def __init__(self, parent_lang):
        self.parent_lang = parent_lang
        self.config = None  # 用于存储加载的配置

    def load_config(self):
        """
        加载并解析 config.json 文件
        """
        try:
            with open("config.json", "r", encoding="utf-8") as f:
                self.config = json.load(f)
            print("配置文件加载成功！")
        except FileNotFoundError:
            print("错误：未找到 config.json 文件！")
            self.config = None
        except json.JSONDecodeError:
            print("错误：config.json 文件格式不正确！")
            self.config = None

    def get_persons(self):
        """
        根据 parent_lang 获取对应语言的助手配置
        """
        if self.config is None:
            print("错误：配置文件未加载或加载失败！")
            return None

        if self.parent_lang not in self.config:
            print(f"错误：未找到语言 '{self.parent_lang}' 的配置！")
            return None

        return self.config[self.parent_lang]

    def get_person_details(self, person_name):
        """
        根据助手名称获取详细配置
        """
        if self.config is None:
            print("错误：配置文件未加载或加载失败！")
            return None

        if self.parent_lang not in self.config:
            print(f"错误：未找到语言 '{self.parent_lang}' 的配置！")
            return None

        persons = self.config[self.parent_lang]
        if person_name not in persons:
            print(f"错误：未找到助手 '{person_name}' 的配置！")
            return None

        return persons[person_name]


# 示例用法
if __name__ == "__main__":
    # 初始化对象，指定语言为 "zh"
    contact = Concact_Persons("zh")

    # 加载配置文件
    contact.load_config()

    # 获取 "zh" 语言下的所有助手配置
    persons = contact.get_persons()
    if persons:
        print("zh 语言下的助手配置：")
        print(json.dumps(persons, indent=4, ensure_ascii=False))

    # 获取 "佐藤" 助手的详细配置
    sato_details = contact.get_person_details("佐藤")
    if sato_details:
        print("\n佐藤助手的详细配置：")
        print(json.dumps(sato_details, indent=4, ensure_ascii=False))