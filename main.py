import sys
import os
from datetime import datetime
from PySide6.QtWidgets import (QApplication, QMainWindow, QWidget, QVBoxLayout,
                             QHBoxLayout, QPushButton, QTextEdit, QLabel,
                             QScrollArea, QFrame, QLineEdit, QListWidget,
                             QListWidgetItem, QStackedWidget, QMenu)
from PySide6.QtCore import Qt, QThread, Signal, QSize
from PySide6.QtGui import QIcon, QFont, QPalette, QColor, QAction
import sounddevice as sd
import soundfile as sf
import numpy as np
import openai
from config import Concact_Persons
from dotenv import load_dotenv

# 加载环境变量
load_dotenv()

class AudioRecorder(QThread):
    finished = Signal(str)
    
    def __init__(self):
        super().__init__()
        self.recording = False
        self.sample_rate = 44100
        
    def run(self):
        self.recording = True
        frames = []
        
        def callback(indata, frames, time, status):
            if self.recording:
                frames.append(indata.copy())
                
        with sd.InputStream(callback=callback, channels=1, samplerate=self.sample_rate):
            while self.recording:
                sd.sleep(100)
                
        if frames:
            audio_data = np.concatenate(frames, axis=0)
            timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
            filename = f"recording_{timestamp}.wav"
            sf.write(filename, audio_data, self.sample_rate)
            self.finished.emit(filename)
            
    def stop(self):
        self.recording = False

class MessageWidget(QFrame):
    def __init__(self, text, is_user=True, parent=None):
        super().__init__(parent)
        self.setFrameShape(QFrame.StyledPanel)
        
        layout = QHBoxLayout()
        
        if not is_user:
            layout.addStretch()
            
        message = QLabel(text)
        message.setWordWrap(True)
        message.setStyleSheet(
            "background-color: #2B5278;" if is_user else "background-color: #182533;"
            "color: white; padding: 10px; border-radius: 10px;"
        )
        layout.addWidget(message)
        
        if is_user:
            layout.addStretch()
            
        self.setLayout(layout)

class ContactItem(QWidget):
    def __init__(self, name, last_message="", parent=None):
        super().__init__(parent)
        layout = QVBoxLayout(self)
        layout.setContentsMargins(10, 5, 10, 5)
        
        name_label = QLabel(name)
        name_label.setStyleSheet("color: white; font-weight: bold;")
        
        last_message_label = QLabel(last_message)
        last_message_label.setStyleSheet("color: #8E8E93;")
        last_message_label.setMaximumWidth(200)
        # 使用Qt的文本省略功能
        metrics = last_message_label.fontMetrics()
        elided_text = metrics.elidedText(last_message, Qt.ElideRight, 190)
        last_message_label.setText(elided_text)
        
        layout.addWidget(name_label)
        layout.addWidget(last_message_label)
        
        self.setStyleSheet("""
            QWidget {
                background-color: #17212B;
                border-radius: 5px;
            }
            QWidget:hover {
                background-color: #202B36;
            }
        """)

class SideMenu(QWidget):
    def __init__(self, parent=None):
        super().__init__(parent)
        self.setFixedWidth(250)
        self.setStyleSheet("background-color: #17212B;")
        
        layout = QVBoxLayout(self)
        
        # 添加菜单项
        menu_items = [
            ("⚙️ 设置", self.on_settings),
            ("🌍 语言选择", self.on_language),
            ("📊 学习统计", self.on_statistics),
            ("👥 好友管理", self.on_contacts),
            ("❓ 帮助", self.on_help),
        ]
        
        for icon_text, callback in menu_items:
            btn = QPushButton(icon_text)
            btn.setStyleSheet("""
                QPushButton {
                    background-color: transparent;
                    color: white;
                    text-align: left;
                    padding: 10px;
                    border: none;
                }
                QPushButton:hover {
                    background-color: #202B36;
                }
            """)
            btn.clicked.connect(callback)
            layout.addWidget(btn)
            
        layout.addStretch()
        
    def on_settings(self):
        pass
        
    def on_language(self):
        pass
        
    def on_statistics(self):
        pass
        
    def on_contacts(self):
        pass
        
    def on_help(self):
        pass

class ChatWindow(QWidget):
    def __init__(self, contact_name, parent=None):
        super().__init__(parent)
        self.contact_name = contact_name
        self.setup_ui()
        
    def setup_ui(self):
        layout = QVBoxLayout(self)
        
        # 顶部栏
        header = QWidget()
        header.setStyleSheet("background-color: #17212B;")
        header.setFixedHeight(50)
        header_layout = QHBoxLayout(header)
        
        contact_label = QLabel(self.contact_name)
        contact_label.setStyleSheet("color: white; font-weight: bold;")
        header_layout.addWidget(contact_label)
        
        layout.addWidget(header)
        
        # 聊天区域
        self.chat_area = QScrollArea()
        self.chat_widget = QWidget()
        self.chat_layout = QVBoxLayout(self.chat_widget)
        self.chat_layout.addStretch()
        
        self.chat_area.setWidget(self.chat_widget)
        self.chat_area.setWidgetResizable(True)
        self.chat_area.setStyleSheet("QScrollArea { border: none; background-color: #0E1621; }")
        
        # 输入区域
        input_container = QWidget()
        input_layout = QHBoxLayout(input_container)
        
        self.message_input = QTextEdit()
        self.message_input.setFixedHeight(50)
        self.message_input.setStyleSheet(
            "QTextEdit { background-color: #182533; color: white; border-radius: 10px; padding: 10px; }"
        )
        
        self.record_button = QPushButton("🎤")
        self.record_button.setFixedSize(50, 50)
        self.record_button.setStyleSheet(
            "QPushButton { background-color: #2B5278; border-radius: 25px; }"
            "QPushButton:pressed { background-color: #1C3D5A; }"
        )
        
        self.send_button = QPushButton("发送")
        self.send_button.setFixedSize(70, 50)
        self.send_button.setStyleSheet(
            "QPushButton { background-color: #2B5278; border-radius: 10px; }"
            "QPushButton:pressed { background-color: #1C3D5A; }"
        )
        
        input_layout.addWidget(self.record_button)
        input_layout.addWidget(self.message_input)
        input_layout.addWidget(self.send_button)
        
        layout.addWidget(self.chat_area)
        layout.addWidget(input_container)
        
    def add_message(self, text, is_user=True):
        message = MessageWidget(text, is_user)
        self.chat_layout.insertWidget(self.chat_layout.count() - 1, message)
        self.chat_area.verticalScrollBar().setValue(
            self.chat_area.verticalScrollBar().maximum()
        )

class MainWindow(QMainWindow):
    def __init__(self):
        super().__init__()
        self.setWindowTitle("语言学习助手")
        self.setStyleSheet("background-color: #0E1621; color: white;")
        self.resize(400, 800)  # 手机比例
        
        # 初始化OpenAI客户端
        self.api_base = os.getenv("OPENAI_API_BASE", "http://localhost:11434/v1")
        self.api_key = os.getenv("OPENAI_API_KEY", "")
        self.client = openai.Client(base_url=self.api_base, api_key=self.api_key)
        
        self.setup_ui()
        
    def setup_ui(self):
        self.central_widget = QWidget()
        self.setCentralWidget(self.central_widget)
        self.main_layout = QHBoxLayout(self.central_widget)
        self.main_layout.setContentsMargins(0, 0, 0, 0)
        self.main_layout.setSpacing(0)
        
        # 侧边菜单
        self.side_menu = SideMenu()
        self.side_menu.hide()
        self.main_layout.addWidget(self.side_menu)
        
        # 主内容区
        self.content_stack = QStackedWidget()
        self.main_layout.addWidget(self.content_stack)
        
        # 联系人列表页面
        self.contacts_page = QWidget()
        contacts_layout = QVBoxLayout(self.contacts_page)
        
        # 顶部栏
        header = QWidget()
        header.setStyleSheet("background-color: #17212B;")
        header.setFixedHeight(50)
        header_layout = QHBoxLayout(header)
        
        menu_button = QPushButton("☰")
        menu_button.setStyleSheet("""
            QPushButton {
                color: white;
                border: none;
                font-size: 20px;
                background: transparent;
            }
        """)
        menu_button.clicked.connect(self.toggle_menu)
        
        title = QLabel("语言学习助手")
        title.setStyleSheet("color: white; font-weight: bold;")
        
        header_layout.addWidget(menu_button)
        header_layout.addWidget(title)
        header_layout.addStretch()
        
        contacts_layout.addWidget(header)
        
        # 联系人列表
        self.contacts_list = QListWidget()
        self.contacts_list.setStyleSheet("""
            QListWidget {
                background-color: #0E1621;
                border: none;
            }
            QListWidget::item {
                padding: 5px;
            }
        """)
        
        # 添加示例联系人
        contacts = [
            ("英语助手", "Hello! How can I help you today?"),
            ("日语助手", "こんにちは！"),
            ("法语助手", "Bonjour!"),
            ("德语助手", "Guten Tag!"),
        ]
        
        for name, last_message in contacts:
            item = QListWidgetItem()
            item.setSizeHint(QSize(0, 70))
            self.contacts_list.addItem(item)
            
            contact_widget = ContactItem(name, last_message)
            self.contacts_list.setItemWidget(item, contact_widget)
            
        self.contacts_list.itemClicked.connect(self.on_contact_clicked)
        contacts_layout.addWidget(self.contacts_list)
        
        self.content_stack.addWidget(self.contacts_page)
        
    def toggle_menu(self):
        if self.side_menu.isHidden():
            self.side_menu.show()
        else:
            self.side_menu.hide()
            
    def on_contact_clicked(self, item):
        contact_widget = self.contacts_list.itemWidget(item)
        contact_name = contact_widget.findChild(QLabel).text()
        
        chat_window = ChatWindow(contact_name)
        self.content_stack.addWidget(chat_window)
        self.content_stack.setCurrentWidget(chat_window)

if __name__ == "__main__":
    app = QApplication(sys.argv)
    window = MainWindow()
    window.show()
    sys.exit(app.exec())
