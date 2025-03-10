# PLLA
Personal_Language_Learning_Assistant

# 多语言口语练习应用

这是一个基于PyQt6开发的多语言口语练习应用程序，支持文字聊天和语音交流功能。

## 功能特点

- 现代化的用户界面，类似Telegram的设计
- 支持文字聊天
- 支持语音输入和输出
- 多语言支持
- 联系人管理
- 实时语音通话（开发中）

## 安装要求

- Python 3.8+
- PyQt6
- 其他依赖包（见requirements.txt）

## 安装步骤

1. 克隆项目到本地
2. 创建并激活虚拟环境（推荐）：
```bash
python -m venv venv
source venv/bin/activate  # Linux/Mac
venv\Scripts\activate     # Windows
```

3. 安装依赖：
```bash
pip install -r requirements.txt
```

## 运行应用

```bash
python main.py
```

## 使用说明

1. 启动应用后，你可以在左侧看到联系人列表
2. 点击联系人开始对话
3. 在底部输入框输入文字消息
4. 点击麦克风按钮进行语音输入
5. 点击发送按钮或按回车键发送消息

## 开发计划

- [ ] 添加用户注册和登录功能
- [ ] 实现实时语音通话
- [ ] 添加语言学习进度追踪
- [ ] 支持更多语言
- [ ] 添加AI助手功能

## 贡献指南

欢迎提交 Pull Requests 来改进这个项目。

# 语言学习助手

一个基于PyQt6的语言学习应用，支持文字对话和语音交互，采用类Telegram的界面设计。

## 功能特点

- 优雅的Telegram风格界面
- 支持文字对话
- 支持语音录制
- 集成LLM模型进行对话
- 深色主题设计

## 环境要求

- Python 3.8+
- PyQt6
- OpenAI API 兼容的LLM（如本地部署的Ollama）

## 安装步骤

1. 克隆仓库：
```bash
git clone [repository-url]
cd [repository-name]
```

2. 安装依赖：
```bash
pip install -r requirements.txt
```

3. 配置环境变量：
创建 `.env` 文件并添加以下配置：
```
OPENAI_API_BASE=http://localhost:11434/v1  # 如果使用Ollama
OPENAI_API_KEY=  # 如果需要的话
```

## 运行应用

```bash
python main.py
```

## 使用说明

1. 文字对话：
   - 在底部输入框输入文字
   - 点击发送按钮或按回车键发送消息

2. 语音对话：
   - 点击麦克风按钮开始录音
   - 再次点击结束录音
   - 录音将自动保存并显示在对话框中

## 注意事项

- 确保已正确配置LLM服务（如Ollama）
- 确保系统有可用的麦克风设备
- 首次运行时可能需要授予麦克风访问权限
