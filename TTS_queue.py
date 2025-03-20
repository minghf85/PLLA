import threading
from queue import Queue
import requests
import time
import os
import wave
from datetime import datetime
import pyaudio as pa

class AudioPlayer:
    def __init__(self, play_device=None):
        self.running = True
        self.audio_cache = Queue()
        self.cache_lock = threading.Lock()
        self.cache_event = threading.Event()
        self.p = pa.PyAudio()
        self.stream = None
        self.play_device = play_device
        self.setup_stream()
        self.error_count = 0
        self.max_errors = 3
        self.is_playing = False
        self.last_play_time = time.time()
        self.total_played = 0
        self.saved_audio = bytearray()  # 用于保存音频数据
        self.save_audio = False  # 是否保存音频数据的标志

    def setup_stream(self):
        try:
            if self.stream is not None:
                self.stream.stop_stream()
                self.stream.close()

            self.stream = self.p.open(
                format=self.p.get_format_from_width(2),
                channels=1,
                rate=32000,
                output=True,
                output_device_index=self.play_device
            )
        except Exception as e:
            print(f"设置音频流时出错: {e}")

    def add_audio_data(self, audio_data):
        with self.cache_lock:
            self.audio_cache.put(audio_data)
            if self.save_audio:
                self.saved_audio.extend(audio_data)
        self.cache_event.set()

    def get_cache_size(self):
        with self.cache_lock:
            return self.audio_cache.qsize()

    def run(self):
        while self.running:
            try:
                if self.audio_cache.empty():
                    self.cache_event.wait(timeout=0.1)
                    self.cache_event.clear()
                    continue

                with self.cache_lock:
                    if self.audio_cache.empty():
                        continue
                    audio_data = self.audio_cache.get()

                if audio_data:
                    self.stream.write(audio_data)
                    self.is_playing = True
                    self.last_play_time = time.time()
                    self.total_played += len(audio_data)
                else:
                    self.is_playing = False

            except Exception as e:
                print(f"音频播放错误: {e}")
                self.error_count += 1
                if self.error_count >= self.max_errors:
                    print("错误次数过多，重新设置音频流")
                    self.setup_stream()
                    self.error_count = 0
                time.sleep(0.1)

    def stop(self):
        self.running = False
        try:
            if self.stream is not None:
                self.stream.stop_stream()
                self.stream.close()
        except Exception as e:
            print(f"关闭音频流时出错: {e}")
        self.p.terminate()

    def wait_for_cache_empty(self):
        while self.get_cache_size() > 0:
            time.sleep(0.1)

    def clear(self):
        """清理所有音频缓存并重置音频流"""
        with self.cache_lock:
            while not self.audio_cache.empty():
                self.audio_cache.get()
        if self.stream:
            try:
                self.stream.stop_stream()
                self.stream.close()
                self.stream = None
                self.setup_stream()  # 重新初始化音频流
            except Exception as e:
                print(f"重置音频流时出错: {e}")
        self.is_playing = False
        self.cache_event.clear()

class GPT_SoVitsThread:
    def __init__(self, baseurl, tts_settings, play_device=None, save_wav=False):
        """
        初始化 GPT_SoVits TTS 系统
        :param baseurl: TTS 服务的基础 URL
        :param tts_settings: TTS 设置，包含所有必要的参数
        :param play_device: 播放设备索引，默认为 None 使用系统默认设备
        :param save_wav: 是否保存音频文件
        """
        self.baseurl = baseurl
        self.tts_settings = tts_settings
        self.text_queue = Queue()
        self.running = False
        self.audio_player = AudioPlayer(play_device)
        self.audio_thread = None
        self.tts_thread = None
        self.save_wav = save_wav
        self.text_ready = threading.Event()  # 添加事件标志

        # 如果需要保存音频，创建保存目录
        if self.save_wav:
            self.audio_dir = os.path.join("logs", "audio")
            os.makedirs(self.audio_dir, exist_ok=True)
            self.audio_player.save_audio = True

    def _save_current_audio(self):
        """保存当前音频"""
        if not self.save_wav or not self.audio_player.saved_audio:
            return

        try:
            # 生成文件名
            timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
            filename = os.path.join(self.audio_dir, f"gpt_sovits_{timestamp}.wav")

            # 创建 WAV 文件
            with wave.open(filename, 'wb') as wf:
                wf.setnchannels(1)  # 单声道
                wf.setsampwidth(2)  # 16 位采样
                wf.setframerate(32000)  # 采样率
                wf.writeframes(self.audio_player.saved_audio)
            print(f"音频已保存到: {filename}")

            # 清理已保存的音频数据
            self.audio_player.saved_audio = bytearray()

        except Exception as e:
            print(f"保存音频失败: {e}")

    def process_text(self):
        """处理文本并生成音频"""
        while self.running:
            try:
                if not self.text_queue.empty():
                    text = self.text_queue.get()
                    if text:
                        self._synthesize_text(text)
            except Exception as e:
                print(f"GPT_SoVits 处理错误: {e}")
                time.sleep(1)
            time.sleep(0.001)

    def _synthesize_text(self, text):
        """合成单个文本并播放"""
        try:
            print(f"正在合成文本: {text}")
            # 保存当前设置中的文本
            original_text = self.tts_settings.get("text")

            # 设置要合成的文本
            self.tts_settings["text"] = text

            # 发送请求
            response = requests.post(
                f"{self.baseurl}/tts",
                json=self.tts_settings,
                stream=True,
                headers={'Accept': 'audio/x-wav'}
            )

            if response.status_code == 200:
                first_chunk = True
                for chunk in response.iter_content(chunk_size=1024):
                    if not self.running:
                        break

                    if chunk:
                        if first_chunk and chunk.startswith(b'RIFF'):
                            chunk = chunk[44:]
                            first_chunk = False

                        if len(chunk) > 0:
                            if self.save_wav:
                                self.audio_player.save_audio = True
                            self.audio_player.add_audio_data(chunk)

                print(f"文本合成完成: {text}")

                # 如果不是流式输入，保存当前音频
                if self.save_wav:
                    print("保存音频...")
                    self._save_current_audio()

            else:
                print(f"语音合成失败: {response.text}")

            # 恢复原始文本设置
            self.tts_settings["text"] = original_text

        except Exception as e:
            print(f"处理文本时出错: {e}")

    def start(self):
        """启动 GPT_SoVits 系统"""
        if self.running:
            return

        self.running = True

        # 启动 TTS 线程
        self.tts_thread = threading.Thread(target=self.process_text)
        self.tts_thread.daemon = True
        self.tts_thread.start()

        # 清理之前的音频数据
        self.audio_player.saved_audio = bytearray()

        # 启动音频播放线程
        self.audio_thread = threading.Thread(target=self.audio_player.run)
        self.audio_thread.daemon = True
        self.audio_thread.start()

        print(f"音频保存状态: {'启用' if self.save_wav else '禁用'}")
        if self.save_wav:
            print(f"音频保存目录: {self.audio_dir}")

    def stop(self):
        """停止 GPT_SoVits 系统"""
        print("正在停止 GPT_SoVits 系统...")

        # 首先设置运行状态为 False
        self.running = False

        # 立即清空文本队列
        while not self.text_queue.empty():
            try:
                self.text_queue.get_nowait()
            except:
                pass

        # 完全清理和重置音频播放器
        if self.audio_player:
            self.audio_player.clear()

        # 确保在停止前保存音频
        if self.save_wav and self.audio_player.saved_audio:
            print("停止前保存音频...")
            self._save_current_audio()

        # 完全停止音频播放器
        if self.audio_player:
            self.audio_player.stop()

        # 等待线程结束
        if self.audio_thread:
            self.audio_thread.join(timeout=1.0)
        if self.tts_thread:
            self.tts_thread.join(timeout=1.0)

    def add_text(self, text):
        """添加文本到队列"""
        if self.running:
            self.text_queue.put(text)

class RealtimeTTSThread:
    def __init__(self):
        self.tts = None
        self.tts_thread = None
        self.tts_queue = []
        self.tts_lock = threading.Lock()

class TTS_uniform_engine:
    def __init__(self, mother_language, model):
        self.mother_language = mother_language
        self.model = model




