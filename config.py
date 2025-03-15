import json

class Config:
    def __init__(self):
        self.config = None
        self.load_config()

    def load_config(self):
        try:
            with open('config.json', 'r', encoding='utf-8') as f:
                self.config = json.load(f)
            return self.config
        except FileNotFoundError:
            print("错误：找不到config.json文件")
            return {}
        except json.JSONDecodeError:
            print("错误：config.json文件格式不正确")
            return {}
        except Exception as e:
            print(f"错误：读取配置文件时发生异常: {str(e)}")
            return {}

    def save_config(self):
        try:
            with open('config.json', 'w', encoding='utf-8') as f:
                json.dump(self.config, f, indent=4, ensure_ascii=False)
            return True
        except Exception as e:
            print(f"错误：保存配置文件时发生异常: {str(e)}")
            return False

    def get_learn_config(self, lang):
        return self.config.get('Learn_config', {}).get(lang, {})

    def get_engine_config(self):
        return self.config.get('Engine_config', {})

    def add_contact(self, lang, contact_data):
        try:
            contacts = self.config['Learn_config'][lang]['contact']
            contacts[contact_data['name']] = {
                'T_lang': contact_data['T_lang'],
                'prompt': contact_data['prompt'],
                'referance': '',
                'scene': '',
                'speed': 1.0,
                'voice_engine': contact_data['voice_engine'],
                'icon': contact_data.get('icon', 'default_avatar.png')
            }
            return self.save_config()
        except Exception as e:
            print(f"错误：添加联系人时发生异常: {str(e)}")
            return False

    def add_scene(self, lang, scene_data):
        try:
            scenes = self.config['Learn_config'][lang]['scene']
            scenes[scene_data['name']] = {
                'scene_name': scene_data['name'],
                'scene_prompt': scene_data.get('prompt', ''),
                'scene_referance': ''
            }
            return self.save_config()
        except Exception as e:
            print(f"错误：添加场景时发生异常: {str(e)}")
            return False