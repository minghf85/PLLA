class TTSThread:
    def __init__(self):
        self.tts = None
        self.tts_thread = None
        self.tts_queue = []
        self.tts_lock = threading.Lock()
