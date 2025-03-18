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

    def get_learn_config(self, lang):
        return self.config.get('Learn_config', {}).get(lang, {})

    def get_engine_config(self):
        return self.config.get('Engine_config', {})

    def get_chat_config(self):
        return self.config.get('Learn_config', {}).get('chat', {}).get('chat_tile', {})

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

    def get_grid_config(self, lang='zh'):
        """获取网格配置"""
        return {
            'tile_size': 120,
            'gap_size': 10
        }

    def update_tile_state(self, tile_id, state):
        """更新磁贴状态"""
        try:
            # 移除width和height，只保留position和size
            state = {
                'position': state.get('position'),
                'size': state.get('size')
            }
            
            if tile_id == 'chat_tile':
                if 'chat_tile' not in self.config['Learn_config']['zh']:
                    self.config['Learn_config']['zh']['chat_tile'] = {}
                self.config['Learn_config']['zh']['chat_tile']['tile'] = state
            else:
                # 添加对tile_id格式的验证
                if '_' not in tile_id:
                    raise ValueError(f"无效的tile_id格式: {tile_id}")
                    
                tile_type, name = tile_id.split('_', 1)
                if tile_type == 'contact':
                    self.config['Learn_config']['zh']['contact'][name]['tile'] = state
                elif tile_type == 'scenario':
                    self.config['Learn_config']['zh']['scene'][name]['tile'] = state
                elif tile_type == 'function':
                    self.config['Learn_config']['zh']['function_tiles'][name]['tile'] = state
                else:
                    raise ValueError(f"未知的磁贴类型: {tile_type}")
            
            return self.save_config()
        except Exception as e:
            print(f"错误：更新磁贴状态时发生异常: {str(e)}")
            return False

    def add_chat_tile(self, chat_data):
        try:
            chat_tile = {
                'title': chat_data['title'],
                'content': chat_data['content'],
                'tile': {
                    'position': chat_data['tile']['position'],
                    'size': chat_data['tile']['size'],
                    'width': chat_data['tile']['width'],
                    'height': chat_data['tile']['height']
                }
            }
            self.config['Learn_config']['zh']['chat']['chat_tile'] = chat_tile
            return self.save_config()
        except Exception as e:
            print(f"错误：添加聊天磁贴时发生异常: {str(e)}")
            return False

    def get_chat_tile_config(self):
        """获取聊天磁贴配置"""
        return self.config.get('Learn_config', {}).get('zh', {}).get('chat_tile', {})