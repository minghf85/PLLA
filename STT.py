import threading
import time
import queue
import realtimeSTT
class STTThread:
    def __init__(self):
        self.stt = None
        self.stt_thread = None
        self.stt_queue = []
        self.stt_lock = threading.Lock()

    def

