from RealtimeSTT import AudioToTextRecorder
import threading
from queue import Queue
import json

''' # 创建配置
config = {
    'input_device_index': 1,
    'language': language,
    'model': "large-v3",
    'device': "cuda",
    "silero_sensitivity":0.2,
    "webrtc_sensitivity":3,
    "post_speech_silence_duration":0.4, 
    "min_length_of_recording":0.3, 
    "min_gap_between_recordings":1, 
    "enable_realtime_transcription" : True,
    "realtime_processing_pause" : 0.05, 
    "realtime_model_type" : "tiny"
}'''

class WebSTTThread:
    def __init__(self, config):
        """
        初始化 WebSTTThread
        :param config: STT 配置
        """
        self.config = config.copy()
        self.config.update({'on_realtime_transcription_update': self.process_text})
        self.running = True
        self.paused = True
        self.is_testing = False
        self.recorder = None
        self.last_text = ""
        
        # 用于存储实时转录文本的队列
        self.text_queue = Queue()
        
        # 创建事件用于控制
        self.ready_event = threading.Event()
        self.pause_event = threading.Event()
        
        # 创建处理线程
        self.thread = threading.Thread(target=self._run, daemon=True)
        self.thread.start()

    def _run(self):
        """线程主运行函数"""
        try:
            if not self.recorder:
                # 创建录音器
                self.recorder = AudioToTextRecorder(**self.config)
                
                # 等待 recorder 就绪
                while not self.recorder.is_running:
                    if not self.running:
                        return
                    threading.Event().wait(0.1)
                
                # 发送就绪信号
                self.ready_event.set()
                
                # 主循环
                while self.running:
                    if not self.paused:
                        # 获取识别结果
                        result = self.recorder.text()
                        if result:
                            self.text_queue.put({
                                'type': 'final',
                                'text': result
                            })
                    else:
                        threading.Event().wait(0.1)
                        
        except Exception as e:
            print(f"Error in WebSTT Thread: {e}")
            self.text_queue.put({
                'type': 'error',
                'text': str(e)
            })

    def process_text(self, text):
        """处理实时转录的文本"""
        if text != self.last_text and not self.is_testing:
            self.last_text = text
            # 将实时文本放入队列
            self.text_queue.put({
                'type': 'interim',
                'text': text
            })

    def get_text(self):
        """获取队列中的文本，用于 Flask 路由"""
        try:
            text_data = self.text_queue.get_nowait()
            return json.dumps(text_data)
        except:
            return json.dumps({'type': 'empty'})

    def pause(self):
        """暂停录音"""
        if self.recorder:
            self.paused = True
            self.recorder.stop()
            self.pause_event.set()

    def resume(self):
        """恢复录音"""
        self.paused = False
        self.pause_event.clear()

    def stop(self):
        """停止线程"""
        self.running = False
        if self.recorder:
            self.recorder.stop()
        self.thread.join(timeout=1.0)

    def is_ready(self):
        """检查 STT 是否就绪"""
        return self.ready_event.is_set()

    def get_status(self):
        """获取当前状态"""
        return {
            'ready': self.is_ready(),
            'paused': self.paused,
            'running': self.running
        }
