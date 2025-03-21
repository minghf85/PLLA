from flask import Flask, request, jsonify, send_from_directory, Response, stream_with_context
from config import Config, Platform
from Agent import PLLAgent
import sqlite3
import os
import time
import datetime

app = Flask(__name__)
config = Config()
agent = PLLAgent(platform=Platform())

# 获取当前文件夹路径
current_dir = os.path.dirname(os.path.abspath(__file__))

# 添加 STT 状态变量
stt_loaded = False

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
        prompt = data.get('prompt', '')
        message = data.get('message', '')
        history = data.get('history', [])  # 添加历史消息的获取
        
        def generate():
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

@app.route('/api/aimsg_analysis', methods=['POST'])
def aimsg_analysis():
    try:
        data = request.json
        sentence = data.get('sentence', '')
        mother_language = data.get('mother_language', '')
        target_language = data.get('target_language', '')

        def generate():
            try:
                for token in agent.gen_aimsg_analysis(mother_language, target_language, sentence):
                    print(token)
                    yield token
            except Exception as e:
                print(f"Error in analysis generation: {str(e)}")
                yield f"分析失败: {str(e)}"
        
        return Response(
            stream_with_context(generate()),
            mimetype='text/event-stream',
            headers={
                'Cache-Control': 'no-cache',
                'X-Accel-Buffering': 'no'
            }
        )
        
    except Exception as e:
        print(f"Error in analysis endpoint: {str(e)}")
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/user_analysis', methods=['POST'])
def usermsg_analysis():
    try:
        data = request.json
        sentence = data.get('sentence', '')
        mother_language = data.get('mother_language', '')
        target_language = data.get('target_language', '')
        
        def generate():
            try:
                for token in agent.gen_usermsg_analysis(mother_language, target_language, sentence):
                    print(token)
                    yield token
            except Exception as e:
                print(f"Error in analysis generation: {str(e)}")
                yield f"分析失败: {str(e)}"
        
        return Response(
            stream_with_context(generate()),
            mimetype='text/event-stream',
            headers={
                'Cache-Control': 'no-cache',
                'X-Accel-Buffering': 'no'
            }
        )
        
    except Exception as e:
        print(f"Error in analysis endpoint: {str(e)}")
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/translation', methods=['POST'])
def translation():
    try:
        data = request.json
        mother_language = data.get('mother_language', '')
        target_language = data.get('target_language', '')
        sentence = data.get('sentence', '')
        
        def generate():
            try:
                for token in agent.gen_translation(mother_language, target_language, sentence):
                    print(token)
                    yield token
            except Exception as e:
                print(f"Error in translation generation: {str(e)}")
                yield f"翻译失败: {str(e)}"
        
        return Response(
            stream_with_context(generate()),
            mimetype='text/event-stream',
            headers={
                'Cache-Control': 'no-cache',
                'X-Accel-Buffering': 'no'
            }
        )
        
    except Exception as e:
        print(f"Error in translation endpoint: {str(e)}")
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
#STT
# @app.route('/api/load_stt_model', methods=['POST'])#网页端传过来当前联系人的target_language(如果当前联系人为默认，则提示请选择联系人),加载模型,加载好之后返回加载好的信号，网页端图标改变给出提示，
# def load_stt_model():
#     try:
#         data = request.json
#         text = data.get('text', '')
#         success = config.stt(text)
#         return jsonify({'success': success})
#     except Exception as e:
#         return jsonify({'success': False, 'error': str(e)}), 500

# @app.route('/api/stt',methods=['POST'])#网页端按住录音按钮之后就开始实时转录，并将转录结果实时显示到输入框
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

@app.route('/api/stt/load', methods=['POST'])
def load_stt():
    """加载 STT 模型"""
    global stt_loaded
    try:
        if not stt_loaded:
            # 模拟加载过程
            time.sleep(2)  # 模拟加载时间
            stt_loaded = True
            return jsonify({
                'success': True,
                'status': 'loaded',
                'message': 'STT 模型已加载'
            })
        else:
            return jsonify({
                'success': False,
                'status': 'already_loaded',
                'message': 'STT 模型已经加载'
            })
    except Exception as e:
        return jsonify({
            'success': False,
            'status': 'error',
            'message': f'加载失败: {str(e)}'
        }), 500

@app.route('/api/stt/unload', methods=['POST'])
def unload_stt():
    """卸载 STT 模型"""
    global stt_loaded
    try:
        if stt_loaded:
            # 模拟卸载过程
            time.sleep(1)  # 模拟卸载时间
            stt_loaded = False
            return jsonify({
                'success': True,
                'status': 'unloaded',
                'message': 'STT 模型已卸载'
            })
        else:
            return jsonify({
                'success': False,
                'status': 'already_unloaded',
                'message': 'STT 模型已经卸载'
            })
    except Exception as e:
        return jsonify({
            'success': False,
            'status': 'error',
            'message': f'卸载失败: {str(e)}'
        }), 500

@app.route('/api/stt/status', methods=['GET'])
def get_stt_status():
    """获取 STT 模型状态"""
    global stt_loaded
    return jsonify({
        'loaded': stt_loaded
    })

@app.route('/api/sessions', methods=['GET'])
def get_sessions():
    """获取所有会话列表"""
    try:
        conn = sqlite3.connect("plla_user.db")
        cursor = conn.cursor()
        
        cursor.execute("""
            SELECT session_id, session_name, contact_name, scenario_name, 
                   start_time, last_message_time
            FROM chat_sessions
            ORDER BY last_message_time DESC
        """)
        
        sessions = cursor.fetchall()
        conn.close()
        
        # 格式化返回数据
        formatted_sessions = []
        for session in sessions:
            session_id, name, contact, scenario, start_time, last_time = session
            
            # 计算时间显示
            last_time = datetime.datetime.strptime(last_time, '%Y-%m-%d %H:%M:%S')
            now = datetime.datetime.now()
            delta = now - last_time
            
            if delta.days == 0:
                time_display = "今天"
            elif delta.days == 1:
                time_display = "昨天"
            elif delta.days < 7:
                time_display = f"{delta.days} 天前"
            else:
                time_display = last_time.strftime('%Y-%m-%d')
            
            formatted_sessions.append({
                'id': session_id,
                'name': name,
                'contact': contact,
                'scenario': scenario,
                'time': time_display
            })
            print(formatted_sessions)
            
        return jsonify(formatted_sessions)
    except Exception as e:
        print(f"Error getting sessions: {str(e)}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/session/<int:session_id>', methods=['GET'])
def get_session(session_id):
    """获取指定会话的所有消息"""
    try:
        conn = sqlite3.connect("plla_user.db")
        cursor = conn.cursor()
        
        # 获取会话信息
        cursor.execute("""
            SELECT session_name, contact_name, scenario_name
            FROM chat_sessions
            WHERE session_id = ?
        """, (session_id,))
        
        session_info = cursor.fetchone()
        if not session_info:
            return jsonify({'error': 'Session not found'}), 404
            
        # 获取会话消息
        cursor.execute("""
            SELECT content, analysis, translation, is_user, timestamp
            FROM messages
            WHERE session_id = ?
            ORDER BY timestamp ASC
        """, (session_id,))
        
        messages = cursor.fetchall()
        conn.close()
        
        return jsonify({
            'session': {
                'id': session_id,
                'name': session_info[0],
                'contact': session_info[1],
                'scenario': session_info[2]
            },
            'messages': [{
                'content': msg[0],
                'analysis': msg[1],
                'translation': msg[2],
                'is_user': bool(msg[3]),
                'timestamp': msg[4]
            } for msg in messages]
        })
    except Exception as e:
        print(f"Error getting session: {str(e)}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/session', methods=['POST'])
def save_session():
    """保存新的会话消息"""
    try:
        data = request.json
        session_id = data.get('session_id')
        content = data.get('content')
        analysis = data.get('analysis')
        translation = data.get('translation')
        is_user = data.get('is_user')
        
        conn = sqlite3.connect("plla_user.db")
        cursor = conn.cursor()
        
        # 插入新消息
        cursor.execute("""
            INSERT INTO messages (
                session_id, content, analysis, translation, is_user
            ) VALUES (?, ?, ?, ?, ?)
        """, (session_id, content, analysis, translation, is_user))
        
        # 更新会话最后消息时间
        cursor.execute("""
            UPDATE chat_sessions
            SET last_message_time = datetime('now')
            WHERE session_id = ?
        """, (session_id,))
        
        conn.commit()
        conn.close()
        
        return jsonify({'success': True})
    except Exception as e:
        print(f"Error saving message: {str(e)}")
        return jsonify({'error': str(e)}), 500
    
@app.route('/api/sql', methods=['POST'])#传入查询语句，返回查询结果
def sql():
    try:
        data = request.json
        query = data.get('query')
        conn = sqlite3.connect("plla_user.db")
        cursor = conn.cursor()
        cursor.execute(query)
        result = cursor.fetchall()
        conn.close()
        return jsonify(result)
    except Exception as e:
        print(f"Error executing query: {str(e)}")
        return jsonify({'error': str(e)}), 500
if __name__ == '__main__':
    app.run(debug=True)
