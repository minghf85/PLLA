from RealtimeSTT import AudioToTextRecorder
import pyaudio as pa
import threading
from queue import Queue
import json
import time

class WebSTTThread(threading.Thread):
    def __init__(self, config):
        """
        初始化 WebSTTThread
        :param config: STT 配置
        """
        super().__init__(daemon=True)
        self.config = config.copy()
        self.config.update({
            'on_realtime_transcription_update': self.process_text,
            'input_device_index': self.get_default_microphone_index()
        })
        self.running = False  # 初始化时设为 False
        self.paused = True   # 初始化时设为 True
        self.recorder = None
        self.last_text = ""
        self.text_queue = Queue()
        self.ready_event = threading.Event()

    def run(self):
        """线程主运行函数"""
        try:
            self.running = True
            if not self.recorder:
                # 创建录音器
                self.recorder = AudioToTextRecorder(**self.config)
                
                # 等待 recorder 就绪
                timeout = 30  # 30秒超时
                start_time = time.time()
                while not self.recorder or not self.recorder.is_running:
                    if time.time() - start_time > timeout:
                        raise TimeoutError("STT 初始化超时")
                    time.sleep(0.1)
                
                # 发送就绪信号
                self.ready_event.set()
                print("STT ready")
                
                # 主循环
                while self.running:
                    if not self.paused:
                        # 获取识别结果
                        try:
                            result = self.recorder.text()
                            if result:
                                self.text_queue.put({
                                    'type': 'final',
                                    'text': result
                                })
                        except Exception as e:
                            print(f"Error getting text: {e}")
                            self.text_queue.put({
                                'type': 'error',
                                'text': str(e)
                            })
                    time.sleep(0.1)
                        
        except Exception as e:
            print(f"Error in WebSTT Thread: {e}")
            self.text_queue.put({
                'type': 'error',
                'text': str(e)
            })
        finally:
            if self.recorder:
                self.recorder.stop()
            self.ready_event.clear()
            self.running = False
            print("STT stopped")

    def get_default_microphone_index(self):
        """获取默认麦克风索引"""
        audio_interface = pa.PyAudio()
        default_device = audio_interface.get_default_input_device_info()
        return default_device['index']

    def process_text(self, text):
        """处理实时转录的文本"""
        if text and text != self.last_text:
            self.last_text = text
            print(f"STT text: {text}")
            self.text_queue.put({
                'type': 'final',
                'text': text
            })

    def get_text(self):
        """获取队列中的文本"""
        try:
            return self.text_queue.get_nowait()
        except:
            return {'type': 'empty', 'text': ''}

    def pause(self):
        """暂停录音"""
        if self.recorder:
            self.paused = True

    def resume(self):
        """恢复录音"""
        self.paused = False
        self.recorder.start()

    def is_ready(self):
        """检查 STT 是否就绪"""
        try:    
            return self.recorder is not None and self.recorder.is_running and self.running
        except:
            return False

    def start(self):
        """启动 STT"""
        if not self.is_alive():
            super().start()

    def stop(self):
        """停止 STT"""
        self.running = False
        if self.recorder:
            try:
                self.recorder.stop()
            except:
                pass
        self.ready_event.clear()

    def get_status(self):
        """获取当前状态"""
        return {
            'ready': self.is_ready(),
            'paused': self.paused,
            'running': self.running
        }

    def __del__(self):
        """析构函数，确保资源被清理"""
        try:
            self.stop()
        except Exception as e:
            print(f"Error in STT cleanup: {e}")
