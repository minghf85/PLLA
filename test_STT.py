import requests
import json
import time
import threading

class STTTester:
    def __init__(self, base_url="http://127.0.0.1:8000"):
        self.base_url = base_url
        self.running = False
        self.text_thread = None

    def start_stt(self, model="large-v2", language="ja"):
        """启动语音识别"""
        try:
            response = requests.get(
                f"{self.base_url}/stt/start",
                params={"model": model, "target_language": language}
            )
            result = response.json()
            
            if result["status"] == "started":
                print(f"语音识别已启动")
                print(f"配置: {result['config']}")
                return True
            else:
                print(f"启动失败: {result.get('message', '未知错误')}")
                return False
                
        except Exception as e:
            print(f"启动错误: {str(e)}")
            return False

    def stop_stt(self):
        """停止语音识别"""
        try:
            response = requests.get(f"{self.base_url}/stt/stop")
            result = response.json()
            print(f"语音识别已停止: {result['status']}")
        except Exception as e:
            print(f"停止错误: {str(e)}")

    def get_text(self):
        """获取识别文本"""
        try:
            response = requests.get(f"{self.base_url}/stt/text")
            text_data = response.text
            
            # 如果返回的是空字符串或无效JSON，直接返回
            if not text_data or text_data.strip() == '':
                return
            
            try:
                result = json.loads(text_data)
                
                # 检查返回的数据类型
                if isinstance(result, str):
                    # 如果返回的是字符串，尝试再次解析
                    result = json.loads(result)
                
                # 处理不同类型的响应
                if isinstance(result, dict):
                    if 'type' in result:
                        if result['type'] == 'interim':
                            print(f"\r实时识别: {result['text']}", end='', flush=True)
                        elif result['type'] == 'final':
                            print(f"\n最终识别: {result['text']}")
                        elif result['type'] == 'error':
                            print(f"\n错误: {result['text']}")
                        elif result['type'] == 'empty':
                            pass  # 忽略空响应
                    else:
                        print(f"\r识别结果: {result}", end='', flush=True)
                else:
                    print(f"\r识别结果: {result}", end='', flush=True)
                
            except json.JSONDecodeError as e:
                print(f"\n解析JSON错误: {str(e)}")
                print(f"原始数据: {text_data}")
            
        except Exception as e:
            print(f"\n获取文本错误: {str(e)}")
            time.sleep(1)  # 发生错误时稍微等待一下

    def start_listening(self):
        """开始监听识别结果"""
        self.running = True
        self.text_thread = threading.Thread(target=self._listen_loop)
        self.text_thread.daemon = True
        self.text_thread.start()

    def stop_listening(self):
        """停止监听"""
        self.running = False
        if self.text_thread:
            self.text_thread.join()

    def _listen_loop(self):
        """监听循环"""
        while self.running:
            self.get_text()
            time.sleep(0.1)  # 避免请求过于频繁

def main():
    print("语音识别测试程序")
    print("=" * 50)
    
    tester = STTTester()
    
    try:
        # 启动语音识别
        if tester.start_stt(language="ja"):  # 可以修改语言：ja, en, zh 等
            print("\n开始监听...")
            print("按 Ctrl+C 停止")
            
            # 开始监听识别结果
            tester.start_listening()
            
            # 等待用户中断
            while True:
                time.sleep(0.1)
                
    except KeyboardInterrupt:
        print("\n\n停止测试...")
    finally:
        # 清理资源
        tester.stop_listening()
        tester.stop_stt()
        print("测试结束")

if __name__ == "__main__":
    main()
