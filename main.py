from flask import Flask, request, jsonify
from config import Config

app = Flask(__name__)
config = Config()

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
