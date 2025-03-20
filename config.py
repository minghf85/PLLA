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
    def update_tile_state(self, mother_language, tile_type, tile_instance):
        """更新磁贴配置"""
        try:
            if tile_type == 'chat_tile':
                # 更新聊天磁贴配置
                self.config['Learn_config']['chat_tile'] = tile_instance
                
            elif tile_type == 'function':
                # 直接全量更新功能磁贴配置
                functions = []
                for func_tile in tile_instance:
                    functions.append({
                        'name': func_tile['name'],
                        'tile': func_tile['tile']
                    })
                self.config['Learn_config']['function_tiles'] = functions
                    
            else:
                # 确保语言配置存在
                if mother_language not in self.config['Learn_config']:
                    self.config['Learn_config'][mother_language] = {
                        'contacts': [],
                        'scenes': []
                    }
                
                if tile_type == 'contact':
                    # 直接全量更新联系人列表
                    contacts = []
                    for tile in tile_instance:
                        contacts.append({
                            'name': tile['name'],
                            'target_language': tile['target_language'],
                            'prompt': tile['prompt'],
                            'speed': tile['speed'],
                            'voice_engine': tile['voice_engine'],
                            'icon': tile['icon'],
                            'tile': tile['tile']
                        })
                    self.config['Learn_config'][mother_language]['contacts'] = contacts
                    
                elif tile_type == 'scenario':
                    # 直接全量更新场景列表
                    scenes = []
                    for tile in tile_instance:
                        scenes.append({
                            'name': tile['name'],
                            'prompt': tile['prompt'],
                            'tile': tile['tile']
                        })
                    self.config['Learn_config'][mother_language]['scenes'] = scenes
                else:
                    raise ValueError(f"未知的磁贴类型: {tile_type}")
            
            return self.save_config()
        except Exception as e:
            print(f"错误：更新磁贴配置时发生异常: {str(e)}")
            return False

    
class Platform:
    def __init__(self):
        self.url = None
        self.model = None
        self.api_key = None
        self.load_config()

    def load_config(self):
        with open('config.json', 'r', encoding='utf-8') as f:
            self.config = json.load(f)
            # 获取第一个平台的配置
            first_platform = list(self.config['LLM_config'].keys())[0]
            self.url = self.config['LLM_config'][first_platform]['url']
            self.model = self.config['LLM_config'][first_platform]['model'] 
            self.api_key = self.config['LLM_config'][first_platform]['api_key']

class Input_config:
    def __init__(self):
        self.contact_name = None
        self.contact_prompt = None
        self.scene_name = None
        self.scene_prompt = None
        self.history = None
        self.load_config()

    def load_config(self):
        #从当前ChatTile中获取
        pass
