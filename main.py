from flask import Flask, request, jsonify, send_from_directory, Response, stream_with_context
from config import Config, Platform
from Agent import PLLAgent
import sqlite3
import os

app = Flask(__name__)
config = Config()
agent = PLLAgent(platform=Platform())

# 获取当前文件夹路径
current_dir = os.path.dirname(os.path.abspath(__file__))

@app.route('/')
def index():
    return send_from_directory(current_dir, 'index.html')

# 处理静态文件
@app.route('/<path:filename>')
def serve_static(filename):
    return send_from_directory(current_dir, filename)

@app.route('/assets/<path:filename>')
def serve_assets(filename):
    return send_from_directory(os.path.join(current_dir, 'assets'), filename)

@app.route('/api/config')
def get_config():
    return jsonify(config.config)

@app.route('/api/tile/update', methods=['POST'])
def update_tile():
    try:
        data = request.json
        tile_type = data.get('type')
        tile_instance = data.get('tile_instance')
        mother_language = data.get('mother_language')
        success = config.update_tile_state(mother_language, tile_type, tile_instance)
        return jsonify({'success': success})
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/chat', methods=['POST'])
def chat():
    try:
        data = request.json
        message = data.get('message', '')
        history = data.get('history', [])  # 添加历史消息的获取
        
        def generate():
            prompt = "你是一个智能AI助手，请用中文回答用户的问题。"
            # 确保消息历史格式正确
            if isinstance(message, str):
                current_message = [{"role": "user", "content": message}]
                messages = history + current_message if history else current_message
            else:
                messages = message  # 如果已经是格式化的消息列表则直接使用
                
            for chunk in agent.gen_normal_response(prompt=prompt, historys=messages):
                if chunk:
                    # 确保正确的SSE格式
                    yield chunk
        
        return Response(stream_with_context(generate()), 
                       mimetype='text/event-stream',
                       headers={
                           'Cache-Control': 'no-cache',
                           'X-Accel-Buffering': 'no'
                       })
        
    except Exception as e:
        print(f"Error in chat endpoint: {str(e)}")
        return jsonify({'success': False, 'error': str(e)}), 500
# # TTS
# @app.route('/api/tts', methods=['POST'])
# def tts():
#     try:
#         data = request.json
#         text = data.get('text', '')
#         success = config.tts(text)
#         return jsonify({'success': success})
#     except Exception as e:
#         return jsonify({'success': False, 'error': str(e)}), 500
# #STT
# @app.route('/api/stt', methods=['POST'])
# def stt():
#     try:
#         data = request.json
#         text = data.get('text', '')
#         success = config.stt(text)
#         return jsonify({'success': success})
#     except Exception as e:
#         return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/avatars', methods=['GET'])
def get_avatars():
    try:
        avatar_dir = os.path.join(os.path.dirname(__file__), 'assets', 'avatars')
        avatars = []
        for file in os.listdir(avatar_dir):
            if file.lower().endswith(('.png', '.jpg', '.jpeg', '.gif')):
                avatars.append(file)
        return jsonify(avatars)
    except Exception as e:
        print(f"Error getting avatar list: {str(e)}")
        return jsonify(['default_avatar.png'])

if __name__ == '__main__':
    app.run(debug=True)
