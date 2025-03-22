from RealtimeSTT import AudioToTextRecorder
import pyaudio as pa
import threading
from queue import Queue
import json

recorder_config = {
        'spinner': False,
        'model': 'large-v3',
        #'realtime_model_type': 'medium.en',
        'realtime_model_type': 'tiny',
        'language': 'en',
        'silero_sensitivity': 0.2,
        'webrtc_sensitivity': 3,
        'post_speech_silence_duration': 0.4,
        'min_length_of_recording': 0.3,
        'min_gap_between_recordings': 0.5,
        'enable_realtime_transcription': True,
        'realtime_processing_pause': 0.05,
        'silero_deactivity_detection': True,
        'early_transcription_on_silence': 0,
        'beam_size': 5,
        'beam_size_realtime': 1,
        'batch_size': 4,
        'realtime_batch_size': 4,
        'no_log_file': True,
        'initial_prompt_realtime': (
            "End incomplete sentences with ellipses.\n"
            "Examples:\n"
            "Complete: The sky is blue.\n"
            "Incomplete: When the sky...\n"
            "Complete: She walked home.\n"
            "Incomplete: Because he...\n"
        )
    }

stt_config = {
    'spinner': False,
    'model': 'large-v2',
    'realtime_model_type': 'tiny',
    'language': 'ja',
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
}

class WebSTTThread:
    def __init__(self, config=stt_config):
        """
        初始化 WebSTTThread
        :param config: STT 配置
        """
        self.config = config.copy()
        self.config.update({'on_realtime_transcription_update': self.process_text})
        self.config.update({'input_device_index': self.get_default_microphone_index()})
        self.running = False  # 初始化时设为 False
        self.paused = True
        self.is_testing = False
        self.recorder = None
        self.last_text = ""
        self.current_text = ""  # 添加当前文本缓存
        self.text_queue = Queue()
        
        # 创建事件用于控制
        self.ready_event = threading.Event()
        self.pause_event = threading.Event()
        
        # 线程在初始化时不创建，而是在 start 时创建
        self.thread = None

    def start(self):
        """启动线程"""
        if self.thread is None or not self.thread.is_alive():
            self.running = True
            self.thread = threading.Thread(target=self.run, daemon=True)
            self.thread.start()

    def stop(self):
        """停止线程"""
        if self.thread and self.thread.is_alive():
            self.running = False
            if self.recorder:
                try:
                    self.recorder.stop()
                except Exception as e:
                    print(f"Error stopping recorder: {e}")
            try:
                self.thread.join(timeout=1.0)
            except Exception as e:
                print(f"Error joining thread: {e}")
            self.thread = None
            self.ready_event.clear()

    def run(self):
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
                        if result and result != self.last_text:
                            # 找出新增的文本部分
                            new_text = ""
                            if len(result) > len(self.last_text):
                                if result.startswith(self.last_text):
                                    new_text = result[len(self.last_text):]
                                else:
                                    new_text = result
                            else:
                                new_text = result
                            
                            # 更新最后的文本
                            self.last_text = result
                            
                            # 只有当有新文本时才放入队列
                            if new_text:
                                self.text_queue.put({
                                    'type': 'final',
                                    'text': new_text,
                                    'full_text': result
                                })
                    else:
                        threading.Event().wait(0.1)
                        
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

    def get_default_microphone_index(self):
        """获取默认麦克风索引"""
        audio_interface = pa.PyAudio()
        default_device = audio_interface.get_default_input_device_info()
        return default_device['index']

    def process_text(self, text):
        """处理实时转录的文本"""
        if text != self.current_text and not self.is_testing:
            # 找出新增的文本部分
            new_text = ""
            if len(text) > len(self.current_text):
                # 如果新文本更长，获取增加的部分
                if text.startswith(self.current_text):
                    new_text = text[len(self.current_text):]
                else:
                    # 如果文本完全改变，将整个文本作为新文本
                    new_text = text
            else:
                # 如果新文本更短或完全不同，将整个文本作为新文本
                new_text = text
            
            # 更新当前文本
            self.current_text = text
            
            # 只有当有新文本时才放入队列
            if new_text:
                self.text_queue.put({
                    'type': 'interim',
                    'text': new_text,
                    'full_text': text  # 同时保存完整文本
                })

    def get_text(self):
        """获取队列中的文本"""
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

    def is_ready(self):
        """检查 STT 是否就绪"""
        if self.recorder:
            if self.recorder.is_running:
                if self.running:
                    return True
                else:
                    return False
            else:
                return False
        else:
            return False

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
