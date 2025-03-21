import sqlite3
import datetime

def create_database():
    conn = sqlite3.connect("plla_user.db")
    cursor = conn.cursor()

    # 创建对话会话表
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS chat_sessions (
        session_id INTEGER PRIMARY KEY AUTOINCREMENT,
        session_name TEXT NOT NULL,
        contact_name TEXT NOT NULL,
        scenario_name TEXT NOT NULL,
        start_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        last_message_time TIMESTAMP
    )
    """)

    # 创建消息记录表
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS messages (
        message_id INTEGER PRIMARY KEY AUTOINCREMENT,
        session_id INTEGER NOT NULL,
        content TEXT NOT NULL,
        analysis TEXT,
        translation TEXT,
        is_user BOOLEAN NOT NULL,
        timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (session_id) REFERENCES chat_sessions (session_id)
    )
    """)

    # 创建索引以提高查询性能
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_messages_session ON messages (session_id)")
    # 提交更改
    conn.commit()
    conn.close()

def insert_initial_data():
    """插入一些初始数据用于测试"""
    conn = sqlite3.connect("plla_user.db")
    cursor = conn.cursor()

    try:
        # 插入测试会话
        cursor.execute("""
        INSERT INTO chat_sessions (
            session_name, 
            contact_name, 
            scenario_name, 
            start_time, 
            last_message_time
        ) VALUES (?, ?, ?, datetime('now'), datetime('now'))
        """, ('初次对话', 'Fox', '学校'))

        # 获取插入的会话ID
        session_id = cursor.lastrowid

        # 插入一些测试消息
        test_messages = [
            (session_id, "Hi, how are you today?", 
             "语法分析：简单的问候语，使用现在时。\n语用分析：友好的开场白。", 
             "你好，今天过得怎么样？", True),
            
            (session_id, "I'm doing great! I just finished my morning coffee. Would you like to join me for another one?", 
             "语法分析：使用现在完成时表示刚完成的动作。\n词汇分析：morning coffee是日常用语。\n语用分析：友好地邀请对方。", 
             "我很好！我刚喝完早晨的咖啡。你要不要一起再来一杯？", False),
            
            (session_id, "That sounds wonderful! What kind of coffee do you recommend?", 
             "语法分析：使用一般现在时提问。\n语用分析：接受邀请并询问建议。", 
             "听起来不错！你推荐什么咖啡？", True),
            
            (session_id, "I'd recommend our house blend. It has a rich flavor with hints of chocolate and caramel.", 
             "语法分析：使用虚拟语气表达建议。\n词汇分析：rich flavor, hints of是描述味道的专业用语。\n语用分析：详细描述推荐的理由。", 
             "我推荐我们的招牌咖啡。它有浓郁的口感，带有巧克力和焦糖的香味。", False)
        ]

        cursor.executemany("""
        INSERT INTO messages (
            session_id, 
            content, 
            analysis, 
            translation, 
            is_user,
            timestamp
        ) VALUES (?, ?, ?, ?, ?, datetime('now', '-' || ? || ' minutes'))
        """, [(msg[0], msg[1], msg[2], msg[3], msg[4], i*2) for i, msg in enumerate(test_messages)])

        # 提交事务
        conn.commit()
        print("测试数据插入成功！")

    except Exception as e:
        print(f"插入测试数据时出错: {e}")
        conn.rollback()
    finally:
        conn.close()

if __name__ == "__main__":
    create_database()
    insert_initial_data()
    print("数据库创建成功！")