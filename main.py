from flask import Flask, request, jsonify, send_from_directory
from config import Config
import sqlite3
import os

app = Flask(__name__)
config = Config()

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
        tile_id = data.get('id')
        state = data.get('state')
        success = config.update_tile_state(tile_id, state)
        return jsonify({'success': success})
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/add_contact', methods=['POST'])
def add_contact():
    try:
        data = request.json
        success = config.add_contact('zh', data)  # 暂时硬编码语言为zh
        return jsonify({'success': success})
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/add_scene', methods=['POST'])
def add_scene():
    try:
        data = request.json
        success = config.add_scene('zh', data)
        return jsonify({'success': success})
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

if __name__ == '__main__':
    app.run(debug=True)
