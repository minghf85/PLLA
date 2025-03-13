from nicegui import ui
from datetime import datetime
import asyncio

class ChatUI:
    def __init__(self):
        self.dark_mode = False
        self.menu_open = False
        self.contacts = [
            {
                'name': '张三',
                'avatar': 'https://picsum.photos/id/237/50/50',
                'last_message': '今天天气真不错',
                'time': '14:30'
            },
            {
                'name': '李四',
                'avatar': 'https://picsum.photos/id/238/50/50',
                'last_message': '下午开会别忘了',
                'time': '12:25'
            },
            # 可以添加更多联系人
        ]

    async def toggle_menu(self):
        self.menu_open = not self.menu_open
        if self.menu_open:
            self.menu_container.classes(replace='h-full transition-all duration-300 overflow-hidden w-64')
        else:
            self.menu_container.classes(replace='h-full transition-all duration-300 overflow-hidden w-0')
        await asyncio.sleep(0.1)

    def toggle_dark_mode(self):
        self.dark_mode = not self.dark_mode
        ui.dark_mode(self.dark_mode)

    def create_ui(self):
        # 主容器
        with ui.row().classes('w-full h-screen'):
            # 左侧菜单 - 初始状态为关闭
            with ui.column().classes('h-full transition-all duration-300 overflow-hidden w-0') as self.menu_container:
                with ui.column().classes('bg-gradient-to-b from-green-100 to-yellow-50 dark:from-green-800 dark:to-yellow-900 h-full w-64 p-4 shadow-lg'):
                    ui.label('菜单').classes('text-xl font-bold mb-4 text-green-800 dark:text-yellow-100')
                    ui.button('首页', on_click=lambda: ui.notify('点击了首页')).classes('w-full mb-2 bg-yellow-100 hover:bg-yellow-200 dark:bg-yellow-800 dark:hover:bg-yellow-700')
                    ui.button('设置', on_click=lambda: ui.notify('点击了设置')).classes('w-full mb-2 bg-yellow-100 hover:bg-yellow-200 dark:bg-yellow-800 dark:hover:bg-yellow-700')
                    ui.button('关于', on_click=lambda: ui.notify('点击了关于')).classes('w-full bg-yellow-100 hover:bg-yellow-200 dark:bg-yellow-800 dark:hover:bg-yellow-700')

            # 主内容区
            with ui.column().classes('flex-1 h-full'):
                # 顶部栏
                with ui.row().classes('w-full p-4 bg-gradient-to-r from-green-50 to-yellow-50 dark:from-green-900 dark:to-yellow-900 justify-between items-center shadow-md'):
                    ui.button(on_click=self.toggle_menu).props('flat icon=menu').classes('hover:bg-yellow-100 dark:hover:bg-yellow-800 transition-colors')
                    with ui.row().classes('gap-4'):
                        ui.input(placeholder='搜索联系人...').props('outlined dense').classes('w-48 bg-white/50 dark:bg-black/20')
                        ui.button(on_click=self.toggle_dark_mode).props('flat icon=light_mode').classes('hover:bg-yellow-100 dark:hover:bg-yellow-800 transition-colors')

                # 联系人列表
                with ui.scroll_area().classes('w-full flex-1 p-4 bg-gradient-to-br from-white to-yellow-50/30 dark:from-gray-900 dark:to-yellow-900/10'):
                    for contact in self.contacts:
                        with ui.card().classes('mb-4 hover:bg-yellow-50 dark:hover:bg-yellow-900/50 cursor-pointer transition-colors border border-green-100/50 dark:border-green-800/50'):
                            with ui.row().classes('items-center p-4'):
                                ui.image(contact['avatar']).classes('w-12 h-12 rounded-full border-2 border-green-200 dark:border-green-700')
                                with ui.column().classes('ml-4 flex-1'):
                                    with ui.row().classes('justify-between w-full'):
                                        ui.label(contact['name']).classes('font-bold text-green-800 dark:text-yellow-100')
                                        ui.label(contact['time']).classes('text-sm text-yellow-600 dark:text-yellow-400')
                                    ui.label(contact['last_message']).classes('text-sm text-gray-600 dark:text-gray-300')

app = ChatUI()

@ui.page('/')
def main():
    app.create_ui()

ui.run(port=8080) 