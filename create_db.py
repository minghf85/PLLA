import sqlite3
import datetime

def create_database():
    conn = sqlite3.connect("plla_user.db")
    cursor = conn.cursor()

    # 创建对话会话表
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS chat_sessions (
        session_id INTEGER PRIMARY KEY AUTOINCREMENT,
        contact_id INTEGER NOT NULL,
        scenario_id INTEGER NOT NULL,
        start_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        last_message_time TIMESTAMP,
        FOREIGN KEY (contact_id) REFERENCES contacts (contact_id),
        FOREIGN KEY (scenario_id) REFERENCES scenarios (scenario_id)
    )
    """)

    # 创建消息记录表
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS messages (
        message_id INTEGER PRIMARY KEY AUTOINCREMENT,
        session_id INTEGER NOT NULL,
        content TEXT NOT NULL,
        message_type TEXT CHECK(message_type IN ('text', 'voice')) NOT NULL,
        voice_cache_id TEXT,
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
    cursor.execute("""
    
    """)

    conn.commit()
    conn.close()

if __name__ == "__main__":
    create_database()
    insert_initial_data()
    print("数据库创建成功！")