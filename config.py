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
    def update_tile_state(self, mother_language, tile_id, state):
        """更新磁贴状态"""
        try:
            # 移除width和height，只保留position和size
            state = {
                'position': state.get('position'),
                'size': state.get('size')
            }
            
            # 将 position 从 translate3d 格式转换为数组格式
            if state['position']:
                # 从 translate3d(Xpx, Ypx, Zpx) 提取数值
                pos_string = state['position']
                # 提取括号内的内容
                pos_string = pos_string[pos_string.find('(')+1:pos_string.find(')')]
                # 分割并清理每个值
                pos_parts = [part.strip().replace('px', '') for part in pos_string.split(',')]
                # 转换为浮点数
                pos_values = [float(x) for x in pos_parts]
                
                # 获取网格大小
                grid_size = float(self.config.get('grid_config', {}).get('tile_size', 120))
                
                # 使用round确保正确的四舍五入，并转换为整数
                state['position'] = [
                    int(round(pos_values[0]/grid_size)),
                    int(round(pos_values[1]/grid_size)),
                    int(pos_values[2])
                ]
                
                # 验证计算结果
                print(f"Position conversion:{tile_id}, raw:{pos_string} -> values:{pos_values} -> final:{state['position']}")
            
            if tile_id == 'chat_tile':
                self.config['Learn_config']['chat_tile']['tile'] = state
            else:
                # 添加对tile_id格式的验证
                if '_' not in tile_id:
                    raise ValueError(f"无效的tile_id格式: {tile_id}")
                    
                tile_type, name = tile_id.split('_', 1)
                
                if tile_type == 'function':
                    # 在function_tiles数组中查找并更新对应的功能磁贴
                    for func_tile in self.config['Learn_config']['function_tiles']:
                        if func_tile['name'] == name:
                            func_tile['tile'] = state
                            break
                else:
                    # 确保语言配置存在
                    if mother_language not in self.config['Learn_config']:
                        self.config['Learn_config'][mother_language] = {
                            'contacts': [],
                            'scenes': []
                        }
                    
                    if tile_type == 'contact':
                        # 在contacts数组中查找并更新对应的联系人
                        for contact in self.config['Learn_config'][mother_language]['contacts']:
                            if contact['name'] == name:
                                contact['tile'] = state
                                break
                    elif tile_type == 'scenario':
                        # 在scenes数组中查找并更新对应的场景
                        for scene in self.config['Learn_config'][mother_language]['scenes']:
                            if scene['name'] == name:
                                scene['tile'] = state
                                break
                    else:
                        raise ValueError(f"未知的磁贴类型: {tile_type}")
            
            return self.save_config()
        except Exception as e:
            print(f"错误：更新磁贴状态时发生异常: {str(e)}")
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
