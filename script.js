document.addEventListener('DOMContentLoaded', function() {
    const menuToggle = document.getElementById('menu-toggle');
    const sidebar = document.getElementById('sidebar');
    const themeBtn = document.querySelector('.theme-btn');
    
    // 菜单切换功能
    menuToggle.addEventListener('click', function() {
        sidebar.classList.toggle('active');
    });

    // 点击主内容区域时关闭侧边栏
    document.querySelector('.main-content').addEventListener('click', function() {
        if (sidebar.classList.contains('active')) {
            sidebar.classList.remove('active');
        }
    });

    // 暗色/亮色主题切换
    let isDarkMode = false;
    themeBtn.addEventListener('click', function() {
        isDarkMode = !isDarkMode;
        if (isDarkMode) {
            document.documentElement.style.setProperty('--background-color', '#333');
            document.documentElement.style.setProperty('--text-color', '#fff');
            document.querySelectorAll('.tile, .contacts-section, .scenarios-section, .sidebar, .top-nav')
                .forEach(el => el.style.backgroundColor = '#444');
        } else {
            document.documentElement.style.setProperty('--background-color', '#f5f5f5');
            document.documentElement.style.setProperty('--text-color', '#333');
            document.querySelectorAll('.tile, .contacts-section, .scenarios-section, .sidebar, .top-nav')
                .forEach(el => el.style.backgroundColor = '#fff');
        }
    });
});
