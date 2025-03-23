from flask import Flask, request, jsonify, send_from_directory, Response, stream_with_context
from config import Config, Platform
from Agent import PLLAgent
import sqlite3
import os
import time
import datetime
import json
import signal
import sys
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

@app.route('/api/analysis', methods=['POST'])
def analysis():
    try:
        data = request.json
        is_user = data.get('is_user', False)
        sentence = data.get('sentence', '')
        mother_language = data.get('mother_language', '')
        target_language = data.get('target_language', '')

        def generate():
            try:
                if is_user:
                    for token in agent.gen_usermsg_analysis(mother_language, target_language, sentence):
                        yield token
                else:
                    for token in agent.gen_aimsg_analysis(mother_language, target_language, sentence):
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

@app.route('/api/help_user', methods=['POST'])
def help_user():
    try:
        data = request.json
        mother_language = data.get('mother_language', '')
        target_language = data.get('target_language', '')
        history = data.get('history', [])

        def generate():
            for token in agent.gen_help_user_response(mother_language, target_language, history):
                yield token 

        return Response(
            stream_with_context(generate()),
            mimetype='text/event-stream',
            headers={
                'Cache-Control': 'no-cache',
                'X-Accel-Buffering': 'no'
            }
        )
    except Exception as e:
        print(f"Error in help_user endpoint: {str(e)}")
        return jsonify({'success': False, 'error': str(e)}), 500    

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
            
        return jsonify(formatted_sessions)
    except Exception as e:
        print(f"Error getting sessions: {str(e)}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/session/<int:session_id>', methods=['GET'])
def get_session(session_id):
    """获取会话详情及消息"""
    try:
        conn = sqlite3.connect("plla_user.db")
        cursor = conn.cursor()
        
        # 获取会话信息
        cursor.execute("""
            SELECT session_name, contact_name, scenario_name
            FROM chat_sessions 
            WHERE session_id = ?
        """, (session_id,))
        session_data = cursor.fetchone()
        
        if not session_data:
            return jsonify({
                'success': False,
                'error': '会话不存在'
            }), 404
            
        # 获取会话消息
        cursor.execute("""
            SELECT message_id, content, analysis, translation, is_user
            FROM messages 
            WHERE session_id = ?
            ORDER BY timestamp ASC
        """, (session_id,))
        messages = cursor.fetchall()
        
        conn.close()
        
        # 格式化返回数据
        return jsonify({
            'success': True,
            'session': {
                'id': session_id,
                'name': session_data[0],
                'contact': session_data[1],
                'scenario': session_data[2]
            },
            'messages': [{
                'id': msg[0],
                'content': msg[1],
                'analysis': msg[2],
                'translation': msg[3],
                'is_user': bool(msg[4])
            } for msg in messages]
        })
        
    except Exception as e:
        print(f"Error getting session: {str(e)}")
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

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

@app.route('/api/session/rename', methods=['POST'])
def rename_session():
    """重命名会话"""
    try:
        data = request.json
        session_id = data.get('session_id')
        new_name = data.get('new_name')
        
        conn = sqlite3.connect("plla_user.db")
        cursor = conn.cursor()
        
        cursor.execute("""
            UPDATE chat_sessions 
            SET session_name = ? 
            WHERE session_id = ?
        """, (new_name, session_id))
        
        conn.commit()
        conn.close()
        
        return jsonify({'success': True})
    except Exception as e:
        print(f"Error renaming session: {str(e)}")
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@app.route('/api/session/delete', methods=['POST'])
def delete_session():
    """删除会话及其所有消息"""
    try:
        data = request.json
        session_id = data.get('session_id')
        
        conn = sqlite3.connect("plla_user.db")
        cursor = conn.cursor()
        
        # 删除会话的所有消息
        cursor.execute("DELETE FROM messages WHERE session_id = ?", (session_id,))
        # 删除会话
        cursor.execute("DELETE FROM chat_sessions WHERE session_id = ?", (session_id,))
        
        conn.commit()
        conn.close()
        
        return jsonify({'success': True})
    except Exception as e:
        print(f"Error deleting session: {str(e)}")
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@app.route('/api/session/create', methods=['POST'])
def create_session():
    """创建新会话"""
    try:
        data = request.json
        session_name = data.get('session_name')
        contact_name = data.get('contact_name')
        scenario_name = data.get('scenario_name')
        
        conn = sqlite3.connect("plla_user.db")
        cursor = conn.cursor()
        
        cursor.execute("""
            INSERT INTO chat_sessions (
                session_name, 
                contact_name, 
                scenario_name, 
                start_time, 
                last_message_time
            ) VALUES (?, ?, ?, datetime('now'), datetime('now'))
        """, (session_name, contact_name, scenario_name))
        
        session_id = cursor.lastrowid
        conn.commit()
        conn.close()
        
        return jsonify({
            'success': True,
            'session_id': session_id,
            'session_name': session_name
        })
    except Exception as e:
        print(f"Error creating session: {str(e)}")
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@app.route('/api/session/message', methods=['POST'])
def save_message():
    """保存会话消息并返回消息ID"""
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
                session_id, 
                content, 
                analysis, 
                translation, 
                is_user,
                timestamp
            ) VALUES (?, ?, ?, ?, ?, datetime('now'))
        """, (session_id, content, analysis, translation, is_user))
        
        # 获取新插入消息的ID
        message_id = cursor.lastrowid
        
        # 更新会话最后消息时间
        cursor.execute("""
            UPDATE chat_sessions
            SET last_message_time = datetime('now')
            WHERE session_id = ?
        """, (session_id,))
        
        conn.commit()
        conn.close()
        
        return jsonify({
            'success': True,
            'message_id': message_id
        })
    except Exception as e:
        print(f"Error saving message: {str(e)}")
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@app.route('/api/message/update', methods=['POST'])
def update_message():
    """更新消息的分析或翻译内容"""
    try:
        data = request.json
        message_id = data.get('message_id')
        analysis = data.get('analysis')
        translation = data.get('translation')
        
        conn = sqlite3.connect("plla_user.db")
        cursor = conn.cursor()
        
        # 构建更新语句
        update_fields = []
        params = []
        if analysis is not None:
            update_fields.append("analysis = ?")
            params.append(analysis)
        if translation is not None:
            update_fields.append("translation = ?")
            params.append(translation)
            
        if update_fields:
            query = f"""
                UPDATE messages 
                SET {', '.join(update_fields)}
                WHERE message_id = ?
            """
            params.append(message_id)
            cursor.execute(query, params)
            conn.commit()
        
        conn.close()
        
        return jsonify({'success': True})
    except Exception as e:
        print(f"Error updating message: {str(e)}")
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

def signal_handler(sig, frame):
    """处理退出信号"""
    print('\nShutting down server...')
    if stt:
        stt.stop()
    sys.exit(0)

# 注册信号处理器
signal.signal(signal.SIGINT, signal_handler)
signal.signal(signal.SIGTERM, signal_handler)

if __name__ == '__main__':
    # 修改启动方式
    from werkzeug.serving import run_simple
    
    try:
        # 使用 run_simple 替代 app.run
        run_simple('0.0.0.0', 5000, app, 
                  use_reloader=False,  # 禁用重载器
                  use_debugger=False,  # 禁用调试器
                  threaded=True)       # 启用多线程
    except KeyboardInterrupt:
        # 确保正确清理资源
        if stt:
            stt.stop()
        print("\nServer shutting down...")
