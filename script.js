// 添加 ChatHistory 类的定义 (放在文件开头的类定义区域)
class ChatHistory {
    constructor(id, title, date) {
        this.id = id;
        this.title = title;
        this.date = date;
    }

    rename(newTitle) {
        this.title = newTitle;
        // TODO: 向后端发送更新请求
        return this.title;
    }

    delete() {
        // TODO: 向后端发送删除请求
        return this.id;
    }
}

// 将 calculatePosition 移到全局作用域
function calculatePosition(position) {
    if (!Array.isArray(position) || position.length !== 3) {
        return 'translate3d(0px, 0px, 0px)';
    }
    const gridSize = Global_grid_config.tile_size;
    return `translate3d(${position[0] * gridSize}px, ${position[1] * gridSize}px, ${position[2]}px)`;
}

document.addEventListener('DOMContentLoaded', async function() {
    // 首先加载配置
    Global_config = await Load_config();
    
    // 然后初始化其他全局变量
    Global_isListeningMode = false;
    mother_language = localStorage.getItem('mother_language') || "zh";
    support_languages = Global_config.support_languages || ["zh", "en", "ja"];
    Global_grid_config = Global_config.grid_config || {tile_size: 120, gap_size: 10};
    console.log(Global_grid_config);
    console.log('Supported languages:', support_languages);

    const menuToggle = document.getElementById('menu-toggle');
    const sidebar = document.getElementById('sidebar');
    const mainContent = document.querySelector('.main-content');
    const resizer = document.getElementById('mainResizer');
    const sections = document.querySelectorAll('.contacts-section, .scenarios-section');
    const themeBtn = document.querySelector('.theme-btn');
    
    // 添加语言设置功能
    const settingsLink = document.querySelector('.sidebar-content a[href="#"][title="设置"]');
    if (settingsLink) {
        settingsLink.addEventListener('click', function(e) {
            e.preventDefault();
            showLanguageSettings();
        });
    }

    // 创建语言设置对话框
    function showLanguageSettings() {
        // 移除已存在的对话框
        const existingModal = document.querySelector('.settings-modal');
        if (existingModal) {
            existingModal.remove();
        }

        // 生成语言选项HTML
        const languageOptions = support_languages.map(lang => {
            const langNames = {
                'zh': '中文',
                'ja': '日本語',
                'en': 'English',
                'fr': 'Français',
                'de': 'Deutsch',
                'es': 'Español',
                'it': 'Italiano',
                'pt': 'Português',
                'ru': 'Русский',
                'ar': 'العربية'
            };
            return `<option value="${lang}" ${mother_language === lang ? 'selected' : ''}>${langNames[lang] || lang}</option>`;
        }).join('');

        const modal = document.createElement('div');
        modal.className = 'settings-modal modal';
        modal.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <h3>语言设置</h3>
                    <button class="close-btn"><i class="fas fa-times"></i></button>
                </div>
                <div class="modal-body">
                    <div class="form-group">
                        <label for="mother-language">选择母语:</label>
                        <select id="mother-language" class="language-select">
                            ${languageOptions}
                        </select>
                    </div>
                    <button class="submit-btn">保存设置</button>
                </div>
            </div>
        `;

        document.body.appendChild(modal);
        modal.classList.add('active');

        // 关闭按钮事件
        const closeBtn = modal.querySelector('.close-btn');
        closeBtn.addEventListener('click', () => {
            modal.classList.remove('active');
            setTimeout(() => modal.remove(), 300);
        });

        // 点击外部关闭
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.classList.remove('active');
                setTimeout(() => modal.remove(), 300);
            }
        });

        // 保存设置
        const submitBtn = modal.querySelector('.submit-btn');
        submitBtn.addEventListener('click', () => {
            const selectedLanguage = modal.querySelector('#mother-language').value;
            mother_language = selectedLanguage;
            localStorage.setItem('mother_language', selectedLanguage);
            
            // 显示保存成功提示
            showGlobalToast(getToastMessage(selectedLanguage));
            
            // 重新加载磁贴
            tileManager.loadConfig();
            
            // 关闭对话框
            modal.classList.remove('active');
            setTimeout(() => modal.remove(), 300);
        });
    }

    // 根据选择的语言返回对应的提示信息
    function getToastMessage(language) {
        const messages = {
            'zh': '设置已保存',
            'ja': '設定が保存されました',
            'en': 'Settings saved'
        };
        return messages[language] || messages['en'];
    }

    // 全局提示函数
    function showGlobalToast(message) {
        const existingToast = document.querySelector('.global-toast');
        if (existingToast) {
            existingToast.remove();
        }

        const toast = document.createElement('div');
        toast.className = 'global-toast';
        toast.textContent = message;
        document.body.appendChild(toast);

        setTimeout(() => {
            toast.classList.add('fade-out');
            setTimeout(() => toast.remove(), 300);
        }, 2000);
    }

    // 确保初始状态
    sidebar.classList.remove('active');
    mainContent.classList.remove('sidebar-active');
    
    // 菜单切换功能
    menuToggle.addEventListener('click', function() {
        sidebar.classList.toggle('active');
        document.body.classList.toggle('sidebar-open');
    });

    // 点击主内容区域关闭侧边栏
    document.addEventListener('click', function(e) {
        if (sidebar.classList.contains('active') &&
            !sidebar.contains(e.target) &&
            !menuToggle.contains(e.target)) {
            sidebar.classList.remove('active');
            document.body.classList.remove('sidebar-open');
        }
    });

    // 监听窗口大小变化
    window.addEventListener('resize', function() {
        if (window.innerWidth <= 768) {
            mainContent.classList.remove('sidebar-active');
        }
    });

    // 修改主题切换按钮的事件处理
    themeBtn.addEventListener('click', function() {
        const isDark = document.body.getAttribute('data-theme') === 'dark';
        document.body.setAttribute('data-theme', isDark ? 'light' : 'dark');
        
        const themeBtns = [
            themeBtn,
            document.querySelector('.tile[data-tile-id="theme"] .tile-icon')
        ];
        
        themeBtns.forEach(btn => {
            if (btn) {
                const newIcon = `<i class="fas ${isDark ? 'fa-moon' : 'fa-sun'}"></i>`;
                btn.innerHTML = newIcon;
            }
        });
        
        localStorage.setItem('theme', isDark ? 'light' : 'dark');
    });

    // 初始化主题
    const savedTheme = localStorage.getItem('theme') || 'light';
    document.body.setAttribute('data-theme', savedTheme);

    // 初始化右上角按钮图标
    themeBtn.innerHTML = `<i class="fas ${savedTheme === 'dark' ? 'fa-sun' : 'fa-moon'}"></i>`;

    // 拖拽调整大小功能
    let isResizing = false;
    let startX, startY;
    let startWidth, startHeight;
    let isMobile = window.innerWidth <= 768;

    // 添加遮罩层到DOM
    const overlay = document.createElement('div');
    overlay.className = 'resize-overlay';
    document.body.appendChild(overlay);

    // 更新移动端状态
    function updateMobileState() {
        isMobile = window.innerWidth <= 768;
        if (isMobile) {
            // 重置为默认的上下布局
            mainContent.style.gridTemplateColumns = '1fr';
            mainContent.style.gridTemplateRows = 'calc(50% - 2px) 4px calc(50% - 2px)';
            
            // 更新拖动条状态
            resizer.style.cursor = 'row-resize';
            overlay.style.cursor = 'row-resize';
        } else {
            // 恢复为左右布局
            mainContent.style.gridTemplateRows = '1fr';
            mainContent.style.gridTemplateColumns = '1fr 4px 1fr';
            
            // 更新拖动条状态
            resizer.style.cursor = 'col-resize';
            overlay.style.cursor = 'col-resize';
        }
    }

    // 监听窗口大小变化
    window.addEventListener('resize', updateMobileState);

    // 初始化移动端状态
    updateMobileState();

    resizer.addEventListener('mousedown', function(e) {
        isResizing = true;
        startX = e.pageX;
        startY = e.pageY;

        const containerRect = mainContent.getBoundingClientRect();
        if (isMobile) {
            startHeight = containerRect.height;
        } else {
            startWidth = containerRect.width;
        }

        resizer.classList.add('active');
        overlay.classList.add('active');
        document.body.style.cursor = isMobile ? 'row-resize' : 'col-resize';
    });

    document.addEventListener('mousemove', function(e) {
        if (!isResizing) return;

        e.preventDefault();
        
        const containerRect = mainContent.getBoundingClientRect();
        
        if (isMobile) {
            // 移动端垂直拖动
            const mouseY = e.clientY;
            const containerTop = containerRect.top;
            const containerHeight = containerRect.height;
            
            // 计算百分比位置
            let percentage = ((mouseY - containerTop) / containerHeight * 100);
            
            // 限制范围
            percentage = Math.max(20, Math.min(80, percentage));
            
            // 更新布局
            mainContent.style.gridTemplateRows = `${percentage}% 4px calc(100% - ${percentage}% - 4px)`;
        } else {
            // 桌面端水平拖动
            const mouseX = e.clientX;
            const containerLeft = containerRect.left;
            const containerWidth = containerRect.width;
            
            // 计算百分比位置
            let percentage = ((mouseX - containerLeft) / containerWidth * 100);
            
            // 限制范围
            percentage = Math.max(20, Math.min(80, percentage));
            
            // 更新布局
            mainContent.style.gridTemplateColumns = `${percentage}% 4px calc(100% - ${percentage}% - 4px)`;
        }
    });

    document.addEventListener('mouseup', function() {
        if (!isResizing) return;
        
        isResizing = false;
        resizer.classList.remove('active');
        overlay.classList.remove('active');
        document.body.style.cursor = '';
        
        // 保存当前布局
        saveLayout();
    });

    // 触摸设备支持
    resizer.addEventListener('touchstart', function(e) {
        const touch = e.touches[0];
        const mouseEvent = new MouseEvent('mousedown', {
            clientX: touch.clientX,
            clientY: touch.clientY,
            pageX: touch.pageX,
            pageY: touch.pageY
        });
        resizer.dispatchEvent(mouseEvent);
    });

    document.addEventListener('touchmove', function(e) {
        if (!isResizing) return;
        e.preventDefault();
        
        const touch = e.touches[0];
        const mouseEvent = new MouseEvent('mousemove', {
            clientX: touch.clientX,
            clientY: touch.clientY,
            pageX: touch.pageX,
            pageY: touch.pageY
        });
        document.dispatchEvent(mouseEvent);
    }, { passive: false });

    document.addEventListener('touchend', function() {
        if (isResizing) {
            const mouseEvent = new MouseEvent('mouseup');
            document.dispatchEvent(mouseEvent);
        }
    });

    // 窗口控制按钮功能
    document.querySelectorAll('.minimize-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const section = this.closest('section');
            section.classList.toggle('section-minimized');
        });
    });

    document.querySelectorAll('.maximize-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const section = this.closest('section');
            section.classList.toggle('section-maximized');
            
            // 更新按钮图标
            const icon = this.querySelector('i');
            if (section.classList.contains('section-maximized')) {
                icon.classList.replace('fa-expand', 'fa-compress');
            } else {
                icon.classList.replace('fa-compress', 'fa-expand');
            }
        });
    });

    // 保存布局状态
    function saveLayout() {
        const layout = {
            gridTemplateColumns: !isMobile ? mainContent.style.gridTemplateColumns : null,
            gridTemplateRows: isMobile ? mainContent.style.gridTemplateRows : null,
            minimizedSections: Array.from(sections).map(section => section.classList.contains('section-minimized')),
            maximizedSections: Array.from(sections).map(section => section.classList.contains('section-maximized'))
        };
        localStorage.setItem('layoutState', JSON.stringify(layout));
    }

    // 加载布局状态
    function loadLayout() {
        const savedLayout = localStorage.getItem('layoutState');
        if (savedLayout) {
            const layout = JSON.parse(savedLayout);
            if (isMobile) {
                mainContent.style.gridTemplateRows = layout.gridTemplateRows || 'calc(50% - 2px) 4px calc(50% - 2px)';
            } else {
                mainContent.style.gridTemplateColumns = layout.gridTemplateColumns || '1fr 4px 1fr';
            }
            
            sections.forEach((section, index) => {
                if (layout.minimizedSections[index]) section.classList.add('section-minimized');
                if (layout.maximizedSections[index]) section.classList.add('section-maximized');
            });
        }
    }

    // 初始化加载布局
    loadLayout();

    // 监听布局变化并保存
    const observer = new MutationObserver(saveLayout);
    sections.forEach(section => {
        observer.observe(section, { attributes: true });
    });

    // 添加窗口大小变化监听
    window.addEventListener('resize', function() {
        const wasMobile = isMobile;
        updateMobileState();
        
        // 如果设备类型改变，重置布局
        if (wasMobile !== isMobile) {
            if (isMobile) {
                mainContent.style.gridTemplateRows = 'calc(50% - 2px) 4px calc(50% - 2px)';
                mainContent.style.gridTemplateColumns = '1fr';
            } else {
                mainContent.style.gridTemplateColumns = '1fr 4px 1fr';
                mainContent.style.gridTemplateRows = '1fr';
            }
        }
    });

    // 磁贴网格系统
    class TileGrid {
        constructor(container) {
            this.container = container;
            this.gridSize = Global_grid_config.tile_size;
            this.gap = Global_grid_config.gap_size;
            this.gridMap = new Map();
            this.overlappingTile = null;
            this.overlappingTimer = null;
            this.init();
        }

        init() {
            this.container.style.position = 'relative';
            this.updateGridDimensions();
            this.createPreviewElement();
            window.addEventListener('resize', () => this.updateGridDimensions());
        }

        createPreviewElement() {
            this.preview = document.createElement('div');
            this.preview.className = 'tile-preview';
            this.preview.style.display = 'none';
            this.container.appendChild(this.preview);
        }

        showPreview(x, y, width, height) {
            const gridPos = this.getGridPosition(x, y);
            this.preview.style.display = 'block';
            this.preview.style.left = `${gridPos.x}px`;
            this.preview.style.top = `${gridPos.y}px`;
            this.preview.style.width = `${width}px`;
            this.preview.style.height = `${height}px`;

            // 修正预览框的重叠检测区域
            const previewRect = {
                left: gridPos.x,
                top: gridPos.y,
                right: gridPos.x + width,
                bottom: gridPos.y + height
            };

            const draggedTile = document.querySelector('.tile.dragging');
            if (draggedTile) {
                const overlappingTile = this.checkPreviewOverlapping(previewRect);
                
                // 处理重叠状态变化
                if (overlappingTile !== this.overlappingTile) {
                    // 清除之前的计时器
                    if (this.overlappingTimer) {
                        clearTimeout(this.overlappingTimer);
                        this.overlappingTimer = null;
                    }
                    
                    // 移除之前的重叠效果
                    if (this.overlappingTile) {
                        this.overlappingTile.classList.remove('tile-overlapping');
                        this.overlappingTile.classList.remove('drag-target');
                    }

                    this.overlappingTile = overlappingTile;

                    // 设置新的重叠效果
                    if (overlappingTile) {
                        const draggedInstance = tileInstances.get(draggedTile);
                        const overlappingInstance = tileInstances.get(overlappingTile);
                        
                        if (overlappingTile.dataset.tileId === 'chat') {
                            overlappingTile.classList.add('tile-overlapping');
                            
                            // 设置新的计时器
                            this.overlappingTimer = setTimeout(() => {
                                const draggedType = draggedTile.dataset.tileId.split('_')[0];
                                if (ChatTile.instance) {
                                    if (draggedType === 'contact') {
                                        ChatTile.instance.updateCurrentContact(draggedTile.dataset.tileId);
                                    } else if (draggedType === 'scenario') {
                                        ChatTile.instance.updateCurrentScenario(draggedTile.dataset.tileId);
                                    }
                                }
                                this.handleOverlapTimeout(draggedTile, overlappingTile);
                            }, 1200);
                        } 
                        // 处理编辑联系人
                        else if (overlappingTile.dataset.tileId === 'edit-contact' && draggedInstance instanceof ContactTile) {
                            overlappingTile.classList.add('drag-target');
                            
                            this.overlappingTimer = setTimeout(() => {
                                showEditContactDialog(draggedInstance.contact);
                                this.handleOverlapTimeout(draggedTile, overlappingTile);
                            }, 800);
                        }
                        // 处理编辑场景
                        else if (overlappingTile.dataset.tileId === 'edit-scenario' && draggedInstance instanceof ScenarioTile) {
                            overlappingTile.classList.add('drag-target');
                            
                            this.overlappingTimer = setTimeout(() => {
                                showEditScenarioDialog(draggedInstance.scenario);
                                this.handleOverlapTimeout(draggedTile, overlappingTile);
                            }, 800);
                        }
                        // 处理删除磁贴
                        else if (overlappingTile.dataset.tileId === 'recycle-bin' && 
                                (draggedInstance instanceof ContactTile || draggedInstance instanceof ScenarioTile)) {
                            overlappingTile.classList.add('drag-target');
                            
                            this.overlappingTimer = setTimeout(() => {
                                showRecycleBinDialog(draggedInstance);
                                this.handleOverlapTimeout(draggedTile, overlappingTile);
                            }, 800);
                        }
                    }
                }
            }
        }

        handleOverlapTimeout(draggedTile, overlappingTile) {
            // 重置拖拽状态
            draggedTile.style.opacity = '1';
            draggedTile.classList.remove('dragging');
            overlappingTile.classList.remove('tile-overlapping');
            overlappingTile.classList.remove('drag-target');
            
            // 重置磁贴位置
            const tileInstance = tileInstances.get(draggedTile);
            if (tileInstance && tileInstance.lastValidPosition) {
                draggedTile.style.transform = calculatePosition(tileInstance.lastValidPosition);
            }
            
            this.overlappingTile = null;
            this.overlappingTimer = null;
        }

        hidePreview() {
            this.preview.style.display = 'none';
            
            // 清理重叠状态
            if (this.overlappingTimer) {
                clearTimeout(this.overlappingTimer);
                this.overlappingTimer = null;
            }
            
            if (this.overlappingTile) {
                this.overlappingTile.classList.remove('tile-overlapping');
                this.overlappingTile = null;
            }
        }

        updateGridDimensions() {
            const rect = this.container.getBoundingClientRect();
            this.width = rect.width;
            this.height = rect.height;
            this.columns = Math.floor(this.width / (this.gridSize + this.gap));
            this.rows = Math.floor(this.height / (this.gridSize + this.gap));
        }

        getSnapPoint(x, y) {
            const gridX = Math.round(x / (this.gridSize + this.gap)) * (this.gridSize + this.gap);
            const gridY = Math.round(y / (this.gridSize + this.gap)) * (this.gridSize + this.gap);
            return {
                x: Math.max(0, Math.min(gridX, this.width - this.gridSize)),
                y: Math.max(0, Math.min(gridY, this.height - this.gridSize))
            };
        }

        // 获取网格坐标
        getGridPosition(x, y) {
            return {
                x: Math.round(x / this.gridSize) * this.gridSize,
                y: Math.round(y / this.gridSize) * this.gridSize
            };
        }

        // 修改获取网格位置的磁贴方法
        getTileAtGrid(x, y) {
            const gridPos = this.getGridPosition(x, y);
            for (const [key, tile] of this.gridMap.entries()) {
                const [tileX, tileY] = key.split(',').map(Number);
                const tileSize = this.getTileSize(tile);
                
                // 检查点是否在磁贴范围内
                if (gridPos.x >= tileX && 
                    gridPos.x < tileX + tileSize.w * this.gridSize &&
                    gridPos.y >= tileY && 
                    gridPos.y < tileY + tileSize.h * this.gridSize) {
                    return tile;
                }
            }
            return null;
        }

        // 修改 updateTilePosition 方法
        updateTilePosition(tile, x, y) {
            const gridPos = this.getGridPosition(x, y);
            const size = this.getTileSize(tile);
            
            // 先移除旧位置的所有占用格子
            this.removeTileFromGrid(tile);

            // 检查新位置是否已被占用
            for (let i = 0; i < size.w; i++) {
                for (let j = 0; j < size.h; j++) {
                    const checkX = gridPos.x + i * this.gridSize;
                    const checkY = gridPos.y + j * this.gridSize;
                    const key = `${checkX},${checkY}`;
                    
                    if (this.gridMap.has(key) && this.gridMap.get(key) !== tile) {
                        // 如果位置被占用，不更新位置
                        return false;
                    }
                }
            }

            // 设置新位置的所有占用格子
            for (let i = 0; i < size.w; i++) {
                for (let j = 0; j < size.h; j++) {
                    const key = `${gridPos.x + i * this.gridSize},${gridPos.y + j * this.gridSize}`;
                    this.gridMap.set(key, tile);
                }
            }

            tile.style.transform = `translate3d(${gridPos.x}px, ${gridPos.y}px, 0)`;
            return true;
        }

        // 获取磁贴大小（以网格单位计）
        getTileSize(tile) {
            const size = tile.dataset.size || '1x1';
            const [w, h] = size.split('x').map(Number);
            return { w, h };
        }

        // 检查位置是否可用
        isPositionAvailable(x, y, tile) {
            const gridPos = this.getGridPosition(x, y);
            const size = this.getTileSize(tile);

            // 检查目标区域的每个网格点
            for (let i = 0; i < size.w; i++) {
                for (let j = 0; j < size.h; j++) {
                    const checkX = gridPos.x + i * this.gridSize;
                    const checkY = gridPos.y + j * this.gridSize;
                    const key = `${checkX},${checkY}`;
                    
                    const occupyingTile = this.gridMap.get(key);
                    if (occupyingTile && occupyingTile !== tile) {
                        // 如果发现任何一个位置被其他磁贴占用，立即返回 false
                        return false;
                    }
                }
            }

            // 检查是否超出容器边界
            const containerWidth = this.container.offsetWidth;
            const containerHeight = this.container.offsetHeight;
            
            if (gridPos.x + size.w * this.gridSize > containerWidth ||
                gridPos.y + size.h * this.gridSize > containerHeight ||
                gridPos.x < 0 || gridPos.y < 0) {
                return false;
            }

            return true;
        }

        // 修改交换逻辑
        swapTiles(tile1, pos1, tile2, pos2) {
            // 临时保存原始位置和大小
            const size1 = this.getTileSize(tile1);
            const size2 = this.getTileSize(tile2);
            const transform1 = tile1.style.transform;
            const transform2 = tile2.style.transform;

            // 设置过渡动画
            tile1.style.transition = 'transform 0.2s ease';
            tile2.style.transition = 'transform 0.2s ease';

            // 交换位置
            this.removeTileFromGrid(tile1);
            this.removeTileFromGrid(tile2);
            
            // 更新位置
            tile1.style.transform = `translate3d(${pos2.x}px, ${pos2.y}px, 0)`;
            tile2.style.transform = `translate3d(${pos1.x}px, ${pos1.y}px, 0)`;
            
            // 更新网格映射
            this.updateTilePosition(tile1, pos2.x, pos2.y);
            this.updateTilePosition(tile2, pos1.x, pos1.y);

            // 动画结束后移除过渡
            setTimeout(() => {
                tile1.style.transition = '';
                tile2.style.transition = '';
            }, 200);
        }

        // 从网格中移除磁贴
        removeTileFromGrid(tile) {
            this.gridMap.forEach((value, key) => {
                if (value === tile) {
                    this.gridMap.delete(key);
                }
            });
        }

        // 检查指定大小的位置是否可用
        checkPositionForSize(x, y, width, height) {
            const gridPos = this.getGridPosition(x, y);
            
            for (let i = 0; i < width; i++) {
                for (let j = 0; j < height; j++) {
                    const key = `${gridPos.x + i * this.gridSize},${gridPos.y + j * this.gridSize}`;
                    if (this.gridMap.has(key)) {
                        return false;
                    }
                }
            }
            return true;
        }

        // 修改初始化磁贴位置的方法
        initializeTilePosition(tile) {
            const transform = tile.style.transform;
            if (transform) {
                // 从transform中提取位置
                const match = transform.match(/translate3d\((\d+)px,\s*(\d+)px/);
                if (match) {
                    const [_, x, y] = match;
                    // 确保更新网格映射
                    this.updateTilePosition(tile, parseInt(x), parseInt(y));
                }
            } else {
                // 找到一个可用的位置
                let x = 0, y = 0;
                while (!this.updateTilePosition(tile, x, y)) {
                    x += this.gridSize;
                    if (x >= this.container.offsetWidth - this.gridSize) {
                        x = 0;
                        y += this.gridSize;
                    }
                }
            }
        }

        // 修改重叠检测方法，添加柔性检测
        checkPreviewOverlapping(previewRect) {
            const draggedTile = document.querySelector('.tile.dragging');
            if (!draggedTile) return null;

            const draggedSize = this.getTileSize(draggedTile);
            const draggedArea = draggedSize.w * draggedSize.h;

            const tiles = Array.from(this.container.querySelectorAll('.tile'))
                .filter(tile => tile !== draggedTile);

            for (const tile of tiles) {
                const tileSize = this.getTileSize(tile);
                const tileArea = tileSize.w * tileSize.h;

                // 如果拖动的磁贴比目标磁贴大，跳过检测
                if (draggedArea > tileArea) {
                    continue;
                }

                const rect = tile.getBoundingClientRect();
                const containerRect = this.container.getBoundingClientRect();
                
                const tileRect = {
                    left: rect.left - containerRect.left,
                    top: rect.top - containerRect.top,
                    right: rect.right - containerRect.left,
                    bottom: rect.bottom - containerRect.top
                };

                // 计算重叠区域
                const overlapArea = this.calculateOverlapArea(previewRect, tileRect);
                const previewArea = (previewRect.right - previewRect.left) * (previewRect.bottom - previewRect.top);
                const overlapRatio = overlapArea / previewArea;

                // 设置重叠阈值（比如80%）
                const OVERLAP_THRESHOLD = 0.8;

                if (overlapRatio > OVERLAP_THRESHOLD) {
                    console.log('预览框重叠比例:', {
                        tileId: tile.dataset.tileId,
                        ratio: overlapRatio.toFixed(2),
                        area: overlapArea
                    });
                    return tile;
                }
            }

            return null;
        }

        // 添加计算重叠面积的辅助方法
        calculateOverlapArea(rect1, rect2) {
            const xOverlap = Math.max(0,
                Math.min(rect1.right, rect2.right) - Math.max(rect1.left, rect2.left)
            );
            const yOverlap = Math.max(0,
                Math.min(rect1.bottom, rect2.bottom) - Math.max(rect1.top, rect2.top)
            );
            
            return xOverlap * yOverlap;
        }
    }

    // 添加一个全局的 Map 来存储磁贴实例
    const tileInstances = new Map();

    class BaseTile {
        constructor(id, options = {}) {
            this.id = id;
            this.size = options.size || '1x1';
            this.title = options.title || '';
            this.description = options.description || '';
            this.icon = options.icon || 'fa-square';
            this.color = options.color || '#4a90e2';
            this.resizable = options.resizable !== false;
            this.element = this.createElement();
            
            // 将实例存储到全局 Map 中
            tileInstances.set(this.element, this);
            this.bindEvents();
        }

        createElement() {
            const tile = document.createElement('div');
            tile.className = 'tile';
            tile.dataset.tileId = this.id;
            tile.dataset.size = this.size;
            
            // 基础磁贴结构
            tile.innerHTML = `
                <div class="tile-drag-handle">
                    <i class="fas fa-grip-vertical"></i>
                </div>
                <div class="tile-content">
                    <div class="tile-icon">
                        <i class="${this.icon}" style="color: ${this.color}"></i>
                    </div>
                    <div class="tile-info">
                        <h3>${this.title}</h3>
                        <p>${this.description}</p>
                    </div>
                </div>
                ${this.resizable ? '<div class="tile-resize-handle"></div>' : ''}
            `;

            // 设置基础样式
            tile.style.backgroundColor = this.getBackgroundColor();
            
            return tile;
        }

        getBackgroundColor() {
            return `${this.color}22`; // 使用主色调的半透明版本
        }

        setSize(width, height) {
            this.element.style.width = `${width}px`;
            this.element.style.height = `${height}px`;
            this.element.dataset.size = `${Math.round(width/Global_grid_config.tile_size)}x${Math.round(height/Global_grid_config.tile_size)}`;
        }

        bindEvents() {
            // 双击事件
            this.element.addEventListener('dblclick', (e) => {
                console.log('双击磁贴:', this.id);
                this.onDoubleClick(e);
            });

            // 重叠检测
            this.element.addEventListener('dragenter', () => {
                console.log('开始重叠:', this.id);
                this.startOverlapTimer();
            });

            this.element.addEventListener('dragleave', () => {
                console.log('结束重叠:', this.id);
                this.clearOverlapTimer();
            });
        }

        startOverlapTimer() {
            this.clearOverlapTimer();
            this.overlappingTimer = setTimeout(() => {
                console.log('重叠超过2秒:', this.id);
                this.onOverlapTimeout();
            }, 2000);
        }

        clearOverlapTimer() {
            if (this.overlappingTimer) {
                clearTimeout(this.overlappingTimer);
                this.overlappingTimer = null;
            }
        }

        // 可被子类覆盖的事件处理方法
        onDoubleClick(e) {
            console.log('基础磁贴双击事件');
        }

        onOverlapTimeout() {
            console.log('基础磁贴重叠超时事件');
        }
    }

    // 联系人磁贴类
    class ContactTile extends BaseTile {
        constructor(name, data) {
            // 确保图标包含必要的类名
            const iconClass = data.icon.startsWith('fa-') 
                ? `fas ${data.icon}` // 如果是 Font Awesome 图标名
                : data.icon.includes('/') 
                    ? `<img src="${data.icon}" alt="${name}" style="width: 50px; height: 50px;">` // 如果是图片路径
                    : `fas fa-user`; // 默认图标

            super(`contact_${name}`, {
                title: name,
                description: data.description,
                icon: iconClass,
                color: '#2ecc71',
                size: data.size || '1x1'
            });
            
            this.contact = data;
            this.name = name;
            this.bindEvents();
        }

        // 重写 createElement 方法来处理图片图标
        createElement() {
            const tile = document.createElement('div');
            tile.className = 'tile';
            tile.dataset.tileId = this.id;
            tile.dataset.size = this.size;
            
            // 判断是否使用图片作为图标
            const isImageIcon = this.icon.includes('<img');
            
            tile.innerHTML = `
                <div class="tile-drag-handle">
                    <i class="fas fa-grip-vertical"></i>
                </div>
                <div class="tile-content">
                    <div class="tile-icon">
                        ${isImageIcon ? this.icon : `<i class="${this.icon}" style="color: ${this.color}"></i>`}
                    </div>
                    <div class="tile-info">
                        <h3>${this.title}</h3>
                        <p>${this.description}</p>
                    </div>
                </div>
                ${this.resizable ? '<div class="tile-resize-handle"></div>' : ''}
            `;

            // 设置基础样式
            tile.style.backgroundColor = this.getBackgroundColor();
            
            return tile;
        }

        bindEvents() {
            // 双击事件
            this.element.addEventListener('dblclick', () => {
                console.log('双击联系人:', this.title);
                console.log('icon:', this.icon);
            });
        }

        // 处理拖入场景
        handleSceneDrop(sceneTile) {
            console.log('拖入场景:', sceneTile.title);
        }
    }

    // 学习场景磁贴类
    class ScenarioTile extends BaseTile {
        constructor(name, data) {
            super(`scenario_${name}`, {
                title: name,
                description: data.description,
                icon: 'fas fa-book',
                color: '#e74c3c',
                size: data.size || '1x1'
            });
            this.name = name;
            this.scenario = data;
            this.bindEvents();
        }

        bindEvents() {
            this.element.addEventListener('dblclick', () => {
                console.log('双击场景:', this.title);
            });
        }

        onOverlapTimeout() {
            console.log('场景磁贴重叠超时:', this.scenario);
            // 实现重叠处理逻辑
        }
    }

    // 修改功能配置对象
    const config = {
        menu: {
            title: '菜单',
            icon: 'fas fa-bars',
            color: '#3498db',
            action: () => {
                // 只更新磁贴对应的侧边栏状态
                const sidebar = document.getElementById('sidebar');
                if (sidebar && !sidebar.classList.contains('transitioning')) {
                    sidebar.classList.add('transitioning');
                    sidebar.classList.toggle('active');
                    document.body.classList.toggle('sidebar-open');
                    
                    // 移除过渡标记
                    setTimeout(() => {
                        sidebar.classList.remove('transitioning');
                    }, 300); // 与CSS过渡时间相匹配
                }
            }
        },
        search: {
            title: '搜索',
            icon: 'fas fa-search',
            color: '#9b59b6',
            action: () => {
                console.log('搜索功能待实现');
                // TODO: 实现搜索功能
            }
        },
        theme: {
            title: '主题切换',
            icon: savedTheme === 'dark' ? 'fas fa-sun' : 'fas fa-moon',  // 根据当前主题设置初始图标
            color: '#f1c40f',
            action: () => {
                // 添加过渡状态检查，避免快速重复切换
                if (!document.body.classList.contains('theme-transitioning')) {
                    document.body.classList.add('theme-transitioning');
                    
                    // 直接触发右上角主题按钮的点击事件
                    const themeBtn = document.querySelector('.theme-btn');
                    if (themeBtn) {
                        themeBtn.click();
                    }
                    
                    // 移除过渡标记
                    setTimeout(() => {
                        document.body.classList.remove('theme-transitioning');
                    }, 300);
                }
            }
        },
        'add-contact': {
            title: '添加联系人',
            icon: 'fas fa-user-plus',
            color: '#2ecc71',
            action: () => {
                showAddContactDialog();
            }
        },
        'add-scenario': {
            title: '添加场景',
            icon: 'fas fa-plus-square',
            color: '#e74c3c',
            action: () => {
                showAddScenarioDialog();
            }
        },
        'edit-contact': {
            title: '编辑联系人',
            icon: 'fas fa-user-edit',
            color: '#e67e22',
            action: () => {
                showEditContactDialog();
            }
        },
        'edit-scenario': {
            title: '编辑场景',
            icon: 'fas fa-edit',
            color: '#1abc9c',
            action: () => {
                showEditScenarioDialog();
            }
        },
        "recycle-bin": {
            title: '回收站',
            icon: 'fas fa-trash',
            color: '#e74c3c',
            action: () => {
                showRecycleBinDialog();
            }
        },
        save: {
            title: '保存布局',
            icon: 'fas fa-save',
            color: '#34495e',
            action: saveAllTileStates
        }
    };

    // 修改 FunctionTile 类的构造函数
    class FunctionTile extends BaseTile {
        constructor(name) {
            const functionConfig = config[name];
            if (!functionConfig) {
                throw new Error(`未找到功能配置: ${name}`);
            }

            super(name, {
                title: functionConfig.title,
                icon: functionConfig.icon,
                color: functionConfig.color,
                description: ''
            });
            this.name = name;
            this.action = functionConfig.action;
            this.element.dataset.tileId = name; // 确保添加标识
            this.bindEvents();
        }

        bindEvents() {
            // 使用单击事件，并确保只绑定一次
            this.element.removeEventListener('click', this.handleClick);  // 先移除可能存在的事件监听
            this.element.addEventListener('click', this.handleClick = (e) => {
                if (this.action) {
                    e.preventDefault();
                    e.stopPropagation();
                    this.action();
                }
            });
        }
    }

    // 修改 ContainerTile 类
    class ContainerTile extends BaseTile {
        constructor(id, options = {}) {
            super(id, {
                title: options.title || 'Container',
                description: options.description || '',
                icon: options.icon || 'fas fa-window-maximize',
                color: options.color || '#3498db',
                size: options.size || '1x1'
            });

            // 添加容器基本样式
            const style = document.createElement('style');
            style.textContent = `
                .container-content {
                    position: absolute;
                    top: 0;
                    left: 0;
                    right: 0;
                    bottom: 0;
                    overflow: auto;
                    background: var(--surface-color);
                    border-radius: 8px;
                    margin: 8px;
                }

                .container-content iframe {
                    width: 100%;
                    height: 100%;
                    border: none;
                }
            `;
            document.head.appendChild(style);

            this.content = options.content || '';
        }

        createElement() {
            const tile = super.createElement();
            
            // 创建内容容器
            const contentContainer = document.createElement('div');
            contentContainer.className = 'container-content';
            contentContainer.innerHTML = this.content;
            
            // 添加到磁贴中，确保不覆盖原有内容
            tile.appendChild(contentContainer);
            
            // 确保拖拽手柄在最上层
            const dragHandle = tile.querySelector('.tile-drag-handle');
            const resizeHandle = tile.querySelector('.tile-resize-handle');
            if (dragHandle) tile.appendChild(dragHandle);
            if (resizeHandle) tile.appendChild(resizeHandle);
            
            return tile;
        }

        // 更新内容的方法
        updateContent(newContent) {
            this.content = newContent;
            const contentContainer = this.element.querySelector('.container-content');
            if (contentContainer) {
                contentContainer.innerHTML = this.content;
            }
        }

        // 加载URL的方法
        loadURL(url) {
            this.updateContent(`<iframe src="${url}" frameborder="0"></iframe>`);
        }
    }

    // 修改 ChatTile 类
    class ChatTile extends ContainerTile {
        constructor(options = {}) {
            super('chat', options);
            this.chatHistory = [];
            this.current_contact = 'default';
            this.current_scenario = 'default';
            ChatTile.instance = this;
        }

        updateCurrentContact(contact) {
            this.current_contact = contact;
            const contactNameElement = this.element.querySelector('.contact-name');
            if (contactNameElement) {
                contactNameElement.textContent = contact;
            }
        }

        updateCurrentScenario(scenario) {
            this.current_scenario = scenario;
            const scenarioNameElement = this.element.querySelector('.scenario-name');
            if (scenarioNameElement) {
                scenarioNameElement.textContent = scenario;
            }
        }

        createElement() {
            const tile = super.createElement();
            // 设置最小尺寸
            tile.style.minWidth = `${4*Global_grid_config.tile_size}px`;
            tile.style.minHeight = `${4*Global_grid_config.tile_size}px`;
            
            // 更新内容，确保内容在 container-content 内
            const contentContainer = tile.querySelector('.container-content');
            if (contentContainer) {
                contentContainer.innerHTML = `
                    <div class="chat-container">
                        <div class="chat-header">
                            <div class="header-left">
                                <div class="history-dropdown">
                                    <button class="history-btn" title="历史消息">
                                        <i class="fas fa-history"></i>
                                        <i class="fas fa-chevron-down"></i>
                                    </button>
                                    <div class="history-menu">
                                        <div class="history-header">
                                            <div class="history-title">最近对话</div>
                                            <div class="history-search">
                                                <input type="text" placeholder="搜索历史消息...">
                                            </div>
                                        </div>
                                        <div class="history-list">
                                            <!-- 历史消息列表将在这里动态添加 -->
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div class="header-center">
                                <div class="current-info">
                                    <span class="current-contact">
                                        <i class="fas fa-user"></i>
                                        <span class="contact-name">${this.current_contact}</span>
                                    </span>
                                    <span class="divider">·</span>
                                    <span class="current-scenario">
                                        <i class="fas fa-book"></i>
                                        <span class="scenario-name">${this.current_scenario}</span>
                                    </span>
                                </div>
                            </div>
                            <div class="header-right">
                                <button class="new-chat-btn" title="新建对话">
                                    <i class="fas fa-plus"></i>
                                </button>
                            </div>
                        </div>
                        <div class="history-panel">
                            <div class="history-content">
                                <!-- 历史消息将在这里动态添加 -->
                            </div>
                        </div>
                        <div class="chat-main">
                            <div class="chat-messages"></div>
                            <div class="chat-input-area">
                                <div class="input-controls left">
                                    <button class="control-btn listening-mode" title="听力模式">
                                        <i class="fas fa-eye"></i>
                                    </button>
                                    <button class="control-btn auto-play" title="自动播放">
                                        <i class="fas fa-play"></i>
                                    </button>
                                </div>
                                <input type="text" class="chat-input" placeholder="输入消息...">
                                <div class="input-controls right">
                                    <button class="control-btn voice-input" title="语音输入">
                                        <i class="fas fa-microphone"></i>
                                    </button>
                                    <button class="send-btn" title="发送">
                                        <i class="fas fa-paper-plane"></i>
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                `;
            }
            
            this.bindChatEvents(tile);
            return tile;
        }

        bindChatEvents(tile) {
            const input = tile.querySelector('.chat-input');
            const sendBtn = tile.querySelector('.send-btn');
            const messagesContainer = tile.querySelector('.chat-messages');
            const historyBtn = tile.querySelector('.history-btn');
            const historyMenu = tile.querySelector('.history-menu');
            const historySearch = tile.querySelector('.history-search input');
            const listeningModeBtn = tile.querySelector('.listening-mode');
            const autoPlayBtn = tile.querySelector('.auto-play');
            const voiceInputBtn = tile.querySelector('.voice-input');
            const newChatBtn = tile.querySelector('.new-chat-btn');

            // 历史消息下拉菜单
            document.addEventListener('click', (e) => {
                const isHistoryClick = e.target.closest('.history-dropdown');
                if (!isHistoryClick) {
                    historyMenu.classList.remove('active');
                    historyBtn.classList.remove('active');
                }
            });

            historyBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                historyMenu.classList.toggle('active');
                historyBtn.classList.toggle('active');
            });

            // 历史消息搜索
            historySearch.addEventListener('input', (e) => {
                const searchTerm = e.target.value.toLowerCase();
                const historyItems = tile.querySelectorAll('.history-item');
                
                historyItems.forEach(item => {
                    const text = item.textContent.toLowerCase();
                    item.style.display = text.includes(searchTerm) ? 'block' : 'none';
                });
            });

            // 模拟一些历史消息数据
            this.chatHistory = [
                new ChatHistory('1', '商业计划书讨论', '今天'),
                new ChatHistory('2', '技术方案评审', '7 天内'),
                new ChatHistory('3', '产品需求分析', '7 天内')
            ];

            // 渲染历史消息列表
            const renderHistoryList = () => {
                const historyList = tile.querySelector('.history-list');
                historyList.innerHTML = '';
                
                this.chatHistory.forEach(history => {
                    const historyItem = document.createElement('div');
                    historyItem.className = 'history-item';
                    historyItem.innerHTML = `
                        <div class="history-item-left">
                            <div class="history-item-title">${history.title}</div>
                            <div class="history-item-date">${history.date}</div>
                        </div>
                        <div class="history-item-actions">
                            <button class="rename-btn" title="重命名">
                                <i class="fas fa-edit"></i>
                            </button>
                            <button class="delete-btn" title="删除">
                                <i class="fas fa-trash"></i>
                            </button>
                        </div>
                    `;

                    // 点击加载对话
                    historyItem.addEventListener('click', (e) => {
                        if (!e.target.closest('.history-item-actions')) {
                            console.log('加载对话:', history.id);
                            historyMenu.classList.remove('active');
                            historyBtn.classList.remove('active');
                        }
                    });

                    // 重命名按钮事件
                    historyItem.querySelector('.rename-btn').addEventListener('click', (e) => {
                        e.stopPropagation();
                        const newTitle = prompt('请输入新的标题', history.title);
                        if (newTitle && newTitle.trim()) {
                            history.rename(newTitle.trim());
                            renderHistoryList();
                        }
                    });

                    // 删除按钮事件
                    historyItem.querySelector('.delete-btn').addEventListener('click', (e) => {
                        e.stopPropagation();
                        if (confirm('确定要删除这条对话记录吗？')) {
                            history.delete();
                            this.chatHistory.splice(this.chatHistory.indexOf(history), 1);
                            renderHistoryList();
                        }
                    });

                    historyList.appendChild(historyItem);
                });
            };

            // 新建对话按钮事件
            newChatBtn.addEventListener('click', () => {
                console.log('新建对话');
                // TODO: 清空当前对话，准备新对话
            });

            // 初始渲染历史消息列表
            renderHistoryList();

            // 听力模式切换
            listeningModeBtn.addEventListener('click', () => {
                Global_isListeningMode = !Global_isListeningMode;
                const icon = listeningModeBtn.querySelector('i');
                icon.classList.toggle('fa-eye');
                icon.classList.toggle('fa-eye-slash');
                
                // 获取所有 AI 消息
                const aiMessages = messagesContainer.querySelectorAll('.ai-message');
                aiMessages.forEach(messageEl => {
                    const content = messageEl.querySelector('.message-content');
                    const button = messageEl.querySelector('.message-btn[title="显示"], .message-btn[title="隐藏"]');
                    const eyeIcon = button?.querySelector('i');
                    
                    if (Global_isListeningMode) {
                        content.classList.add('content-masked');
                        if (eyeIcon) {
                            eyeIcon.classList.remove('fa-eye');
                            eyeIcon.classList.add('fa-eye-slash');
                            button.title = '显示';
                        }
                    } else {
                        content.classList.remove('content-masked');
                        if (eyeIcon) {
                            eyeIcon.classList.add('fa-eye');
                            eyeIcon.classList.remove('fa-eye-slash');
                            button.title = '隐藏';
                        }
                    }
                });
            });

            // 自动播放切换
            let isAutoPlaying = false;
            autoPlayBtn.addEventListener('click', () => {
                isAutoPlaying = !isAutoPlaying;
                const icon = autoPlayBtn.querySelector('i');
                icon.classList.toggle('fa-play');
                icon.classList.toggle('fa-pause');
            });

            // 语音输入
            let isRecording = false;
            let recordingTimeout;
            
            voiceInputBtn.addEventListener('mousedown', () => {
                isRecording = true;
                voiceInputBtn.classList.add('recording');
                // TODO: 开始录音
                console.log('开始录音...');
            });

            voiceInputBtn.addEventListener('mouseup', () => {
                if (isRecording) {
                    isRecording = false;
                    voiceInputBtn.classList.remove('recording');
                    clearTimeout(recordingTimeout);
                    // TODO: 结束录音并处理
                    console.log('结束录音');
                }
            });

            // 添加滚动到最新消息的方法
            const scrollToLatest = () => {
                messagesContainer.scrollTo({
                    top: messagesContainer.scrollHeight,
                    behavior: 'smooth'  // 使用平滑滚动效果
                });
            };

            // 修改发送消息的函数
            const sendMessage = async () => {
                const message = input.value.trim();
                if (message) {
                    // 创建用户消息
                    const userMsg = new UserMessage(message);
                    messagesContainer.appendChild(userMsg.element);
                    
                    // 滚动到最新消息
                    scrollToLatest();
                    
                    // 清空输入
                    input.value = '';
                    
                    // 创建 AI 消息实例
                    const aiMsg = new AIMessage('', {
                        isListeningMode: Global_isListeningMode
                    });
                    messagesContainer.appendChild(aiMsg.element);

                    try {
                        // 发送请求到后端
                        const response = await fetch('/api/chat', {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json',
                            },
                            body: JSON.stringify({ message })
                        });

                        // 创建 EventSource 来接收流式响应
                        const reader = response.body.getReader();
                        const decoder = new TextDecoder();
                        let token = '';

                        while (true) {
                            const { done, value } = await reader.read();
                            if (done) break;
                            
                            token = decoder.decode(value, { stream: true });
                            console.log(token);
                            await aiMsg.streamContent(token);
                        }

                        scrollToLatest();
                        
                    } catch (error) {
                        console.error('发送消息失败:', error);
                        aiMsg.streamContent('抱歉，发生了错误，请稍后重试。');
                    }
                }
            };

            // 绑定发送按钮点击事件
            sendBtn.addEventListener('click', sendMessage);

            // 绑定回车键发送事件
            input.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    sendMessage();
                }
            });

            // 阻止输入框的冒泡，避免触发磁贴的拖动
            input.addEventListener('mousedown', (e) => {
                e.stopPropagation();
            });
        }

        addMessage(text, type = 'sent') {
            const messagesContainer = this.element.querySelector('.chat-messages');
            const messageElement = document.createElement('div');
            messageElement.className = `message ${type}`;
            messageElement.textContent = text;
            messagesContainer.appendChild(messageElement);
            messagesContainer.scrollTop = messagesContainer.scrollHeight;
        }

        // 重写 setSize 方法以确保最小尺寸
        setSize(width, height) {
            const minWidth = 4*Global_grid_config.tile_size;  
            const minHeight = 4*Global_grid_config.tile_size; 
            
            const finalWidth = Math.max(width, minWidth);
            const finalHeight = Math.max(height, minHeight);
            
            // 更新 dataset.size 以反映实际大小
            const sizeW = Math.max(4, Math.round(finalWidth / Global_grid_config.tile_size));
            const sizeH = Math.max(4, Math.round(finalHeight / Global_grid_config.tile_size));
            this.element.dataset.size = `${sizeW}x${sizeH}`;
            
            // 设置样式
            this.element.style.width = `${finalWidth}px`;
            this.element.style.height = `${finalHeight}px`;
        }

        // 添加验证尺寸的方法
        validateSize() {
            const width = parseInt(this.element.style.width);
            const height = parseInt(this.element.style.height);
            if (width < 4*Global_grid_config.tile_size || height < 4*Global_grid_config.tile_size) {
                this.setSize(width, height); // 这将强制应用最小尺寸
                return false;
            }
            return true;
        }
    }

    // 修改 TileManager 类
    class TileManager {
        constructor() {
            this.config = null;
            this.gridConfig = Global_grid_config;
            this.loadConfig();
        }

        async loadConfig() {
            try {
                this.config = Global_config;  // 直接使用已加载的全局配置
                
                // 确保配置中包含必要的结构
                if (!this.config.Learn_config) {
                    console.error('配置中没有 Learn_config 结构');
                    return;
                }
                
                await this.generateTiles();
            } catch (error) {
                console.error('加载配置失败:', error);
            }
        }

        calculateTileSize(size) {
            if (!size) return { width: 120, height: 120 };
            const [w, h] = size.split('x').map(Number);
            return {
                width: w * this.gridConfig.tile_size,
                height: h * this.gridConfig.tile_size
            };
        }
        
        async generateTiles() {
            const container = document.querySelector('.tiles-container');
            container.innerHTML = '';

            // 更新容器的网格样式
            container.style.gridTemplateColumns = `repeat(auto-fill, ${this.gridConfig.tile_size}px)`;
            container.style.gridAutoRows = `${this.gridConfig.tile_size}px`;
            container.style.gap = `${this.gridConfig.gap_size}px`;

            // 获取当前语言的配置
            const currentLangConfig = this.config.Learn_config[mother_language];
            if (!currentLangConfig) {
                console.error(`找不到语言 ${mother_language} 的配置`);
                return;
            }

            // 创建所有磁贴
            const allTiles = [
                // 功能磁贴
                ...(this.config.Learn_config.function_tiles || [])
                    .map(funcData => {
                        const tile = new FunctionTile(funcData.name);
                        if (funcData.tile) {
                            const tileSize = this.calculateTileSize(funcData.tile.size);
                            Object.assign(tile.element.style, {
                                transform: calculatePosition(funcData.tile.position),
                                width: `${tileSize.width}px`,
                                height: `${tileSize.height}px`
                            });
                            tile.element.dataset.size = funcData.tile.size;
                        }
                        return tile;
                    }),

                // 联系人磁贴
                ...(currentLangConfig.contacts || [])
                    .map(contactData => {
                        const tile = new ContactTile(contactData.name, contactData);
                        if (contactData.tile) {
                            const tileSize = this.calculateTileSize(contactData.tile.size);
                            Object.assign(tile.element.style, {
                                transform: calculatePosition(contactData.tile.position),
                                width: `${tileSize.width}px`,
                                height: `${tileSize.height}px`
                            });
                            tile.element.dataset.size = contactData.tile.size;
                        }
                        return tile;
                    }),

                // 场景磁贴
                ...(currentLangConfig.scenes || [])
                    .map(sceneData => {
                        const tile = new ScenarioTile(sceneData.name, sceneData);
                        if (sceneData.tile) {
                            const tileSize = this.calculateTileSize(sceneData.tile.size);
                            Object.assign(tile.element.style, {
                                transform: calculatePosition(sceneData.tile.position),
                                width: `${tileSize.width}px`,
                                height: `${tileSize.height}px`
                            });
                            tile.element.dataset.size = sceneData.tile.size;
                        }
                        return tile;
                    }),

                // 聊天磁贴
                (() => {
                    const chatTileConfig = this.config.Learn_config.chat_tile;
                    const chatTile = new ChatTile('chat_tile', {
                        title: '聊天',
                        size: '4x4'
                    });
                    
                    if (chatTileConfig && chatTileConfig.tile) {
                        const tileSize = this.calculateTileSize(chatTileConfig.tile.size);
                        Object.assign(chatTile.element.style, {
                            transform: calculatePosition(chatTileConfig.tile.position),
                            width: `${tileSize.width}px`,
                            height: `${tileSize.height}px`
                        });
                        chatTile.element.dataset.size = chatTileConfig.tile.size;
                    }
                    
                    return chatTile;
                })()
            ];

            // 将磁贴添加到容器
            allTiles.forEach(tile => {
                container.appendChild(tile.element);
            });

            // 等待DOM更新
            await new Promise(resolve => setTimeout(resolve, 0));

            // 初始化磁贴系统
            initTileSystem();
        }

        get_available_position() {
            const container = document.querySelector('.tiles-container');
            const gridSize = this.gridConfig.tile_size;
            const gapSize = this.gridConfig.gap_size;
            
            // 获取所有已占用的位置
            const occupiedPositions = new Set();
            const tiles = container.querySelectorAll('.tile');
            
            tiles.forEach(tile => {
                const transform = tile.style.transform;
                const position = this.parseTransform(transform);
                if (position) {
                    occupiedPositions.add(`${position[0]},${position[1]}`);
                }
            });

            // 定义搜索范围（例如：8x8网格）
            const gridRange = 8;
            
            // 从左上角开始搜索第一个可用位置
            for (let y = 0; y < gridRange; y++) {
                for (let x = 0; x < gridRange; x++) {
                    const posKey = `${x},${y}`;
                    if (!occupiedPositions.has(posKey)) {
                        console.log('找到可用位置:', [x, y, 0]);
                        return [x, y, 0];
                    }
                }
            }

            // 如果没有找到空位，返回默认位置
            console.log('未找到可用位置，使用默认位置');
            return [0, 0, 0];
        }

        parseTransform(transform) {
            if (!transform) return null;
            
            // 从 transform 样式中提取位置
            const match = transform.match(/translate3d\((\d+)px,\s*(\d+)px,\s*(\d+)px\)/);
            if (!match) return null;
            
            const gridSize = this.gridConfig.tile_size;
            return [
                Math.round(parseInt(match[1]) / gridSize),
                Math.round(parseInt(match[2]) / gridSize),
                parseInt(match[3])
            ];
        }

        async addContact(contactData) {
            try {
                // 确保当前语言的配置存在
                if (!this.config.Learn_config[mother_language]) {
                    this.config.Learn_config[mother_language] = {
                        contacts: [],
                        scenes: []
                    };
                }

                // 检查联系人是否已存在
                const existingContact = this.config.Learn_config[mother_language].contacts.find(
                    contact => contact.name === contactData.name
                );

                if (existingContact) {
                    showGlobalToast('联系人已存在');
                    return;
                }

                // 获取可用位置
                const position = this.get_available_position();
                console.log('新联系人位置:', position);

                // 创建新的联系人配置
                const newContact = {
                    name: contactData.name,
                    target_language: contactData.target_language,
                    prompt: contactData.prompt,
                    speed: contactData.speed,
                    voice_engine: contactData.voice_engine,
                    icon: contactData.icon,
                    tile: {
                        position: position,
                        size: "1x1"
                    }
                };

                // 添加到配置中
                this.config.Learn_config[mother_language].contacts.push(newContact);

                // 创建新的联系人磁贴
                const tile = new ContactTile(contactData.name, newContact);
                const container = document.querySelector('.tiles-container');
                
                // 设置初始位置和大小
                Object.assign(tile.element.style, {
                    transform: calculatePosition(position),
                    width: `${this.gridConfig.tile_size}px`,
                    height: `${this.gridConfig.tile_size}px`
                });
                tile.element.dataset.size = "1x1";

                // 添加到容器
                container.appendChild(tile.element);
                // Init
                initTileSystem();
                // 保存所有磁贴状态
                saveAllTileStates();
                console.log('联系人添加成功:', newContact);
                return true;
            } catch (error) {
                console.error('添加联系人失败:', error);
                showGlobalToast('添加联系人失败');
                return false;
            }
        }

        async addScenario(scenarioData) {
            try {
                // 确保当前语言的配置存在
                if (!this.config.Learn_config[mother_language]) {
                    this.config.Learn_config[mother_language] = {
                        contacts: [],
                        scenes: []
                    };
                }

                // 检查场景是否已存在
                const existingScenario = this.config.Learn_config[mother_language].scenes.find(
                    scene => scene.name === scenarioData.name
                );

                if (existingScenario) {
                    showGlobalToast('场景已存在');
                    return;
                }

                // 获取可用位置
                const position = this.get_available_position();
                console.log('新场景位置:', position);

                // 创建新的场景配置
                const newScenario = {
                    name: scenarioData.name,
                    prompt: scenarioData.prompt,
                    tile: {
                        position: position,
                        size: "1x1"
                    }
                };

                // 添加到配置中
                this.config.Learn_config[mother_language].scenes.push(newScenario);

                // 创建新的场景磁贴
                const tile = new ScenarioTile(scenarioData.name, newScenario);
                const container = document.querySelector('.tiles-container');
                
                // 设置初始位置和大小
                Object.assign(tile.element.style, {
                    transform: calculatePosition(position),
                    width: `${this.gridConfig.tile_size}px`,
                    height: `${this.gridConfig.tile_size}px`
                });
                tile.element.dataset.size = "1x1";

                // 添加到容器
                container.appendChild(tile.element);

                // Init
                initTileSystem();
                // 保存所有磁贴状态
                saveAllTileStates();
                console.log('场景添加成功:', newScenario);
                return true;
            } catch (error) {
                console.error('添加场景失败:', error);
                showGlobalToast('添加场景失败');
                return false;
            }
        }

        updateContact(oldName, updatedContact) {
            const contacts = this.config.Learn_config[mother_language].contacts;
            const index = contacts.findIndex(c => c.name === oldName);
            if (index !== -1) {
                contacts[index] = updatedContact;
                this.loadConfig(); // 重新加载配置以更新界面
                saveAllTileStates();
            }
        }

        updateScenario(oldName, updatedScenario) {
            const scenes = this.config.Learn_config[mother_language].scenes;
            const index = scenes.findIndex(s => s.name === oldName);
            if (index !== -1) {
                scenes[index] = updatedScenario;
                this.loadConfig(); // 重新加载配置以更新界面
                saveAllTileStates();
            }
        }

        deleteContact(name) {
            const contacts = this.config.Learn_config[mother_language].contacts;
            const index = contacts.findIndex(c => c.name === name);
            if (index !== -1) {
                contacts.splice(index, 1);
                this.loadConfig(); // 重新加载配置以更新界面
                saveAllTileStates();
            }
        }

        deleteScenario(name) {
            const scenes = this.config.Learn_config[mother_language].scenes;
            const index = scenes.findIndex(s => s.name === name);
            if (index !== -1) {
                scenes.splice(index, 1);
                this.loadConfig(); // 重新加载配置以更新界面
                saveAllTileStates();
            }
        }
    }

    // 初始化
    const tileManager = new TileManager();

    // 初始化磁贴系统
    function initTileSystem() {
        const containers = document.querySelectorAll('.tiles-container[data-sortable="true"]');
        
        containers.forEach(container => {
            const grid = new TileGrid(container);
            const tiles = container.querySelectorAll('.tile');

            // 首先初始化所有磁贴的位置
            tiles.forEach(tile => {
                grid.initializeTilePosition(tile);

                // 为每个磁贴单独设置事件处理
                let isDragging = false;
                let isResizing = false;
                let currentX, currentY;
                let initialX, initialY;
                let xOffset = 0;
                let yOffset = 0;

                function handleDragStart(e) {
                    if (!e.target.closest('.tile-drag-handle')) return;
                    
                    const rect = tile.getBoundingClientRect();
                    const containerRect = container.getBoundingClientRect();
                    
                    xOffset = e.clientX - rect.left;
                    yOffset = e.clientY - rect.top;
                    
                    initialX = rect.left - containerRect.left;
                    initialY = rect.top - containerRect.top;
                    currentX = initialX;
                    currentY = initialY;
                    
                    isDragging = true;
                    tile.classList.add('dragging');
                    tile.style.zIndex = '1000';
                }

                function handleDragMove(e) {
                    if (!isDragging) return;
                    e.preventDefault();

                    const containerRect = container.getBoundingClientRect();
                    const newX = e.clientX - containerRect.left - xOffset;
                    const newY = e.clientY - containerRect.top - yOffset;
                    
                    currentX = newX;
                    currentY = newY;
                    
                    grid.showPreview(newX, newY, tile.offsetWidth, tile.offsetHeight);
                    tile.style.transform = `translate3d(${newX}px, ${newY}px, 0)`;
                }

                function handleDragEnd() {
                    if (!isDragging) return;
                    
                    isDragging = false;
                    tile.classList.remove('dragging');
                    tile.style.zIndex = '';
                    
                    grid.hidePreview();
                    
                    const gridPos = grid.getGridPosition(currentX, currentY);
                    
                    if (!grid.updateTilePosition(tile, gridPos.x, gridPos.y)) {
                        grid.updateTilePosition(tile, initialX, initialY);
                    }
                }

                // 绑定事件到当前磁贴
                tile.addEventListener('mousedown', handleDragStart);
                document.addEventListener('mousemove', handleDragMove);
                document.addEventListener('mouseup', handleDragEnd);
                
                // 触摸事件处理
                tile.addEventListener('touchstart', (e) => {
                    if (!e.target.closest('.tile-drag-handle')) return;
                    e.preventDefault();
                    
                    const touch = e.touches[0];
                    handleDragStart({
                        clientX: touch.clientX,
                        clientY: touch.clientY,
                        target: e.target
                    });
                }, { passive: false });

                document.addEventListener('touchmove', (e) => {
                    if (!isDragging) return;
                    e.preventDefault();
                    
                    const touch = e.touches[0];
                    handleDragMove({
                        clientX: touch.clientX,
                        clientY: touch.clientY,
                        preventDefault: () => {}
                    });
                }, { passive: false });

                document.addEventListener('touchend', handleDragEnd);

                // 添加调整大小的事件处理
                const resizeHandle = tile.querySelector('.tile-resize-handle');
                if (resizeHandle) {
                    let startWidth, startHeight, startX, startY;

                    function handleResizeStart(e, isTouch = false) {
                        e.stopPropagation();
                        isResizing = true;
                        
                        const point = isTouch ? e.touches[0] : e;
                        startX = point.clientX;
                        startY = point.clientY;
                        startWidth = tile.offsetWidth;
                        startHeight = tile.offsetHeight;
                        
                        tile.classList.add('resizing');
                    }

                    function handleResizeMove(e, isTouch = false) {
                        if (!isResizing) return;
                        e.preventDefault();

                        const point = isTouch ? e.touches[0] : e;
                        const deltaX = point.clientX - startX;
                        const deltaY = point.clientY - startY;
                        
                        let newWidth = Math.max(grid.gridSize, 
                            Math.round((startWidth + deltaX) / grid.gridSize) * grid.gridSize);
                        let newHeight = Math.max(grid.gridSize, 
                            Math.round((startHeight + deltaY) / grid.gridSize) * grid.gridSize);

                        // 如果是聊天磁贴，强制执行最小尺寸限制
                        const tileInstance = tileInstances.get(tile);
                        if (tileInstance instanceof ChatTile) {
                            newWidth = Math.max(newWidth, 4*Global_grid_config.tile_size); 
                            newHeight = Math.max(newHeight, 4*Global_grid_config.tile_size);
                        }

                        const currentTransform = window.getComputedStyle(tile).transform;
                        const matrix = new DOMMatrix(currentTransform);
                        
                        // 更新大小前检查新位置是否可用
                        const oldSize = tile.dataset.size;
                        const sizeX = Math.round(newWidth / grid.gridSize);
                        const sizeY = Math.round(newHeight / grid.gridSize);
                        tile.dataset.size = `${sizeX}x${sizeY}`;

                        if (grid.isPositionAvailable(matrix.m41, matrix.m42, tile)) {
                            tile.style.width = `${newWidth}px`;
                            tile.style.height = `${newHeight}px`;
                            // 更新网格映射
                            grid.updateTilePosition(tile, matrix.m41, matrix.m42);
                        } else {
                            // 如果新位置不可用，恢复原始大小
                            tile.dataset.size = oldSize;
                        }
                    }

                    function handleResizeEnd() {
                        if (!isResizing) return;
                        isResizing = false;
                        tile.classList.remove('resizing');
                    }

                    // 鼠标事件
                    resizeHandle.addEventListener('mousedown', e => handleResizeStart(e));
                    document.addEventListener('mousemove', e => handleResizeMove(e));
                    document.addEventListener('mouseup', handleResizeEnd);

                    // 触摸事件
                    resizeHandle.addEventListener('touchstart', e => handleResizeStart(e, true), { passive: false });
                    document.addEventListener('touchmove', e => handleResizeMove(e, true), { passive: false });
                    document.addEventListener('touchend', handleResizeEnd);
                }
            });
        });
    }

    // 添加位置格式转换函数
    function parseTransformToArray(transform) {
        if (!transform) return [0, 0, 0];
        
        // 从 transform 样式中提取位置
        const match = transform.match(/translate3d\((\d+)px,\s*(\d+)px,\s*(\d+)px\)/);
        if (!match) return [0, 0, 0];
        
        const gridSize = Global_grid_config.tile_size;
        return [
            Math.round(parseInt(match[1]) / gridSize),
            Math.round(parseInt(match[2]) / gridSize),
            parseInt(match[3])
        ];
    }

    // 修改 saveAllTileStates 函数中的相关部分
    async function saveAllTileStates() {
        const saveBtn = document.querySelector('.save-btn');
        saveBtn.classList.add('saving');
        
        try {
            const tiles = Array.from(document.querySelectorAll('.tile'));
            const contactTiles = [];
            const scenarioTiles = [];
            const functionTiles = [];
            let chatTile = {}; // 将 const 改为 let

            tiles.forEach(tile => {
                const tileInstance = tileInstances.get(tile);
                console.log(tileInstance);
                if (!tileInstance) return;

                const transform = tile.style.transform;
                const size = tile.dataset.size;
                const position = parseTransformToArray(transform);

                if (tileInstance instanceof ChatTile) {
                    chatTile = {
                        tile: {
                            position: position,
                            size: size || '1x1'
                        }
                    };
                } else if (tileInstance instanceof FunctionTile) {
                    functionTiles.push({
                        name: tileInstance.name,
                        tile: {
                            position: position,
                            size: size || '1x1'
                        }
                    });
                } else if (tileInstance instanceof ContactTile) {
                    contactTiles.push({
                        name: tileInstance.name,
                        target_language: tileInstance.contact.target_language,
                        prompt: tileInstance.contact.prompt,
                        speed: tileInstance.contact.speed,
                        voice_engine: tileInstance.contact.voice_engine,
                        icon: tileInstance.contact.icon,
                        tile: {
                            position: position,
                            size: size || '1x1'
                        }
                    });
                } else if (tileInstance instanceof ScenarioTile) {
                    scenarioTiles.push({
                        name: tileInstance.name,
                        prompt: tileInstance.scenario.prompt,
                        tile: {
                            position: position,
                            size: size || '1x1'
                        }
                    });
                }
            });

            // 发送功能磁贴更新
            if (functionTiles.length > 0) {
                await fetch('/api/tile/update', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        type: 'function',
                        tile_instance: functionTiles,
                        mother_language: mother_language
                    })
                });
            }

            // 发送聊天磁贴更新
            if (Object.keys(chatTile).length > 0) {
                await fetch('/api/tile/update', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        type: 'chat_tile',
                        tile_instance: chatTile,
                        mother_language: mother_language
                    })
                });
            }

            // 发送联系人更新
            if (contactTiles.length > 0) {
                await fetch('/api/tile/update', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        type: 'contact',
                        tile_instance: contactTiles,
                        mother_language: mother_language
                    })
                });
            }

            // 发送场景更新
            if (scenarioTiles.length > 0) {
                await fetch('/api/tile/update', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        type: 'scenario',
                        tile_instance: scenarioTiles,
                        mother_language: mother_language
                    })
                });
            }

            saveBtn.innerHTML = '<i class="fas fa-check"></i>';
            setTimeout(() => {
                saveBtn.innerHTML = '<i class="fas fa-save"></i>';
            }, 2000);
        } catch (error) {
            console.error('保存失败:', error);
            saveBtn.innerHTML = '<i class="fas fa-times"></i>';
            setTimeout(() => {
                saveBtn.innerHTML = '<i class="fas fa-save"></i>';
            }, 2000);
        } finally {
            saveBtn.classList.remove('saving');
        }
    }

    // 在文档加载完成后绑定保存按钮事件
    const saveBtn = document.querySelector('.save-btn');
    saveBtn.addEventListener('click', saveAllTileStates);

    // 基础消息框类
    class MessageBox {
        constructor(content, options = {}) {
            this.content = content;
            this.options = {
                buttons: [
                    {
                        icon: 'fa-copy',
                        title: '复制',
                        onClick: () => this.copyContent()
                    }
                ],
                ...options
            };
            this.element = this.createElement();
        }

        createElement() {
            const messageBox = document.createElement('div');
            messageBox.className = 'message-box';
            
            // 创建 Markdown 内容区域
            const contentArea = document.createElement('div');
            contentArea.className = 'message-content markdown-body';
            
            // 渲染 Markdown 内容
            if (typeof marked !== 'undefined') {
                try {
                    contentArea.innerHTML = marked.parse(this.content);
                } catch (e) {
                    contentArea.textContent = this.content;
                }
            } else {
                contentArea.textContent = this.content;
            }
            
            // 创建分隔线
            const divider = document.createElement('div');
            divider.className = 'message-divider';
            
            // 创建按钮区域
            const buttonArea = document.createElement('div');
            buttonArea.className = 'message-buttons';
            
            // 添加按钮
            this.options.buttons.forEach(btn => {
                const button = document.createElement('button');
                button.className = 'message-btn';
                button.innerHTML = `<i class="fas ${btn.icon}"></i>`;
                button.title = btn.title;
                button.addEventListener('click', btn.onClick);
                buttonArea.appendChild(button);
            });
            
            messageBox.appendChild(contentArea);
            messageBox.appendChild(divider);
            messageBox.appendChild(buttonArea);
            
            return messageBox;
        }

        async copyContent() {
            const content = this.element.querySelector('.message-content').textContent;
            try {
                await navigator.clipboard.writeText(content);
                this.showGlobalToast('已复制到剪贴板');
            } catch (err) {
                console.error('复制失败:', err);
                this.showGlobalToast('复制失败，请重试');
            }
        }

        // 修改为全局提示
        showGlobalToast(message) {
            // 移除现有的toast
            const existingToast = document.querySelector('.global-toast');
            if (existingToast) {
                existingToast.remove();
            }

            const toast = document.createElement('div');
            toast.className = 'global-toast';
            toast.textContent = message;
            document.body.appendChild(toast);

            // 2秒后自动消失
            setTimeout(() => {
                toast.classList.add('fade-out');
                setTimeout(() => toast.remove(), 300);
            }, 2000);
        }

        async streamContent(token) {
            if (token === '\n\n') {
                token = '\n';
            }
            const contentArea = this.element.querySelector('.message-content');
            if (!this.buffer) {
                this.buffer = '';  // 初始化buffer作为类属性
            }
            
            // 累积接收到的内容
            this.buffer += token;
            contentArea.innerHTML = this.buffer;
            // 每累积10个字符进行一次渲染
            if (this.buffer.length % 10 === 0) {
                if (typeof marked !== 'undefined') {
                    try {
                        contentArea.innerHTML = marked.parse(this.buffer);
                        
                        // 代码高亮
                        contentArea.querySelectorAll('pre code').forEach((block) => {
                            if (typeof hljs !== 'undefined') {
                                hljs.highlightElement(block);
                            }
                        });
                        
                        // 数学公式渲染
                        if (typeof MathJax !== 'undefined') {
                            MathJax.typesetPromise([contentArea]);
                        }
                    } catch (e) {
                        contentArea.textContent = this.buffer;
                    }
                } else {
                    contentArea.textContent = this.buffer;
                }
                
                // 滚动到底部
                this.scrollToBottom();
            }
            // 最后一次完整渲染
            if (typeof marked !== 'undefined') {
                contentArea.innerHTML = marked.parse(this.buffer);
                
                // 最终的代码高亮
                contentArea.querySelectorAll('pre code').forEach((block) => {
                    if (typeof hljs !== 'undefined') {
                        hljs.highlightElement(block);
                    }
                });
                
                // 最终的数学公式渲染
                if (typeof MathJax !== 'undefined') {
                    MathJax.typesetPromise([contentArea]);
                }
            }
        }

        scrollToBottom() {
            const chatMessages = this.element.closest('.chat-messages');
            if (chatMessages) {
                chatMessages.scrollTop = chatMessages.scrollHeight;
            }
        }
    }

    // 修改 UserMessage 类
    class UserMessage extends MessageBox {
        constructor(content, options = {}) {
            super(content, {
                ...options,
                buttons: [
                    {
                        icon: 'fa-copy',
                        title: '复制',
                        onClick: () => this.copyContent()
                    },
                    {
                        icon: 'fa-comment-dots',
                        title: '分析',
                        onClick: () => this.analyze()
                    }
                ]
            });
            this.element.classList.add('user-message');
        }
    }

    // 修改 AIMessage 类
    class AIMessage extends MessageBox {
        constructor(content, options = {}) {
            super(content, {
                ...options,
                buttons: [
                    {
                        icon: 'fa-copy',
                        title: '复制',
                        onClick: () => this.copyContent()
                    },
                    {
                        icon: 'fa-volume-up',
                        title: '朗读',
                        onClick: () => this.speak()
                    },
                    {
                        icon: 'fa-comment-dots',
                        title: '分析',
                        onClick: () => this.analyze()
                    },
                    {
                        icon: 'fa-language',
                        title: '翻译',
                        onClick: () => this.translate()
                    },
                    {
                        icon: 'fa-eye',
                        title: options.isListeningMode ? '显示' : '隐藏',
                        onClick: () => this.toggleVisibility()
                    }
                ]
            });
            this.element.classList.add('ai-message');
            this.isListeningMode = options.isListeningMode;
            this.cachedContent = ''; // 初始化缓存内容
            
            // 初始化消息状态，跟随全局听力模式
            if(this.isListeningMode){
                this.element.querySelector('.message-content').classList.add('content-masked');
            }
            else{
                this.element.querySelector('.message-content').classList.remove('content-masked');
            }
        }

        toggleVisibility() {
            // 修改当前AIMessage的isListeningMode状态
            this.isListeningMode = !this.isListeningMode;
            
            // 只修改内容区域的显示状态
            const content = this.element.querySelector('.message-content');
            content.classList.toggle('content-masked');
            
            // 修改按钮图标和标题
            const button = this.element.querySelector('.message-btn[title="显示"], .message-btn[title="隐藏"]');
            const eyeIcon = button?.querySelector('i');
            if (eyeIcon) {
                eyeIcon.classList.toggle('fa-eye');
                eyeIcon.classList.toggle('fa-eye-slash');
                button.title = this.isListeningMode ? '显示' : '隐藏';
            }
        }

        speak() {
            console.log('朗读功能待实现');
            this.showGlobalToast('朗读功能开发中');
        }

        analyze() {
            console.log('分析功能待实现');
            this.showGlobalToast('分析功能开发中');
        }

        translate() {
            console.log('翻译功能待实现');
            this.showGlobalToast('翻译功能开发中');
        }
    }
    class STT_uniform_engine {//输入为mother_language和模型，输出为文本迭代器(流式输出)
        //必须要有加载模型过程
        constructor(mother_language, model){
            this.mother_language = mother_language;
            this.model = model;
        }
    }

    class TTS_uniform_engine {//target_language和驱动模块(realtimeTTS或者GPT_SoVits)，输出为音频播放。
        //必须要有加载模型过程
        constructor(target_language, driver_module){
            this.target_language = target_language;
            this.driver_module = driver_module;
        }
    }
    async function Load_config() {
        try {
            const response = await fetch('./config.json');
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const config = await response.json();
            return config;
        } catch (error) {
            console.error('加载配置失败:', error);
            // 返回默认配置
            return {
                support_languages: ["zh", "en", "ja"],
                grid_config: {
                    tile_size: 120,
                    gap_size: 10
                },
                Learn_config: {
                    function_tiles: [],
                    chat_tile: {},
                    zh: { contacts: [], scenes: [] }
                }
            };
        }
    }
    function setupListeningMode() {
        const listeningModeBtn = document.querySelector('.listening-mode-btn');
        if (!listeningModeBtn) return;

        // 初始化听力模式状态
        const savedListeningMode = localStorage.getItem('listeningMode') === 'true';
        if (savedListeningMode) {
            document.body.classList.add('listening-mode');
            const btnIcon = listeningModeBtn.querySelector('i');
            if (btnIcon) {
                btnIcon.classList.remove('fa-eye');
                btnIcon.classList.add('fa-eye-slash');
            }
            
            // 更新所有现有消息的状态
            document.querySelectorAll('.ai-message').forEach(messageEl => {
                const content = messageEl.querySelector('.message-content');
                content.classList.add('content-masked');
                const button = messageEl.querySelector('.message-btn[title="显示"], .message-btn[title="隐藏"]');
                const eyeIcon = button?.querySelector('i');
                if (eyeIcon) {
                    eyeIcon.classList.remove('fa-eye');
                    eyeIcon.classList.add('fa-eye-slash');
                    button.title = '显示';
                }
            });
        }

        listeningModeBtn.addEventListener('click', () => {
            const isListeningMode = !document.body.classList.contains('listening-mode');
            document.body.classList.toggle('listening-mode');
            
            // 更新所有消息的状态
            document.querySelectorAll('.ai-message').forEach(messageEl => {
                const content = messageEl.querySelector('.message-content');
                const button = messageEl.querySelector('.message-btn[title="显示"], .message-btn[title="隐藏"]');
                const eyeIcon = button?.querySelector('i');
                
                if (isListeningMode) {
                    content.classList.add('content-masked');
                    if (eyeIcon) {
                        eyeIcon.classList.remove('fa-eye');
                        eyeIcon.classList.add('fa-eye-slash');
                        button.title = '显示';
                    }
                } else {
                    content.classList.remove('content-masked');
                    if (eyeIcon) {
                        eyeIcon.classList.add('fa-eye');
                        eyeIcon.classList.remove('fa-eye-slash');
                        button.title = '隐藏';
                    }
                }
            });

            // 更新按钮图标
            const btnIcon = listeningModeBtn.querySelector('i');
            if (btnIcon) {
                btnIcon.classList.toggle('fa-eye');
                btnIcon.classList.toggle('fa-eye-slash');
            }

            // 保存状态到 localStorage
            localStorage.setItem('listeningMode', isListeningMode);
        });
    }

    // 在文档加载完成后初始化听力模式
    document.addEventListener('DOMContentLoaded', () => {
        setupListeningMode();
    });

    // 添加联系人对话框
    function showAddContactDialog() {
        // 检查是否已存在对话框
        const existingModal = document.querySelector('.settings-modal');
        if (existingModal) {
            existingModal.remove();
        }

        const modal = document.createElement('div');
        modal.className = 'settings-modal modal';
        modal.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <h3>添加联系人</h3>
                    <button class="close-btn"><i class="fas fa-times"></i></button>
                </div>
                <div class="modal-body">
                    <div class="form-group">
                        <label for="contact-name">名称:</label>
                        <input type="text" id="contact-name" class="form-input" required>
                    </div>
                    <div class="form-group">
                        <label for="target-language">目标语言:</label>
                        <select id="target-language" class="form-select">
                            ${support_languages.filter(lang => lang !== mother_language).map(lang => {
                                const langNames = {
                                    'zh': '中文',
                                    'ja': '日本語',
                                    'en': 'English',
                                    'fr': 'Français',
                                    'de': 'Deutsch',
                                    'es': 'Español',
                                    'it': 'Italiano',
                                    'pt': 'Português',
                                    'ru': 'Русский',
                                    'ar': 'العربية'
                                };
                                return `<option value="${lang}">${langNames[lang] || lang}</option>`;
                            }).join('')}
                        </select>
                    </div>
                    <div class="form-group">
                        <label for="contact-prompt">提示词:</label>
                        <textarea id="contact-prompt" class="form-textarea" rows="3"></textarea>
                    </div>
                    <div class="form-group">
                        <label for="voice-engine">语音引擎:</label>
                        <select id="voice-engine" class="form-select">
                            <option value="RealtimeTTS">RealtimeTTS</option>
                            <option value="GPT_SoVits">GPT_SoVits</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label for="voice-speed">语速:</label>
                        <div class="speed-control">
                            <input type="range" id="voice-speed" class="form-range" 
                                   min="0.5" max="2" step="0.1" value="1.0">
                            <span id="speed-value">1.0</span>
                        </div>
                    </div>
                    <div class="form-group">
                        <label for="contact-icon">头像:</label>
                        <div class="avatar-select-container">
                            <select id="avatar-select" class="form-select">
                                <option value="">选择预设头像</option>
                            </select>
                            <div class="avatar-buttons">
                                <input type="file" id="contact-icon-upload" class="form-input" 
                                       accept="image/*" style="display: none;">
                                <input type="text" id="contact-icon" class="form-input" 
                                       value="./assets/avatars/default_avatar.png" style="display: none;">
                                <button type="button" class="icon-upload-btn">上传头像</button>
                            </div>
                        </div>
                        <div class="icon-preview">
                            <img src="./assets/avatars/default_avatar.png" alt="预览" id="icon-preview">
                        </div>
                    </div>
                    <button class="submit-btn">添加</button>
                </div>
            </div>
        `;

        document.body.appendChild(modal);
        modal.classList.add('active');

        // 初始化头像选择
        initAvatarSelection(modal);

        // 语速滑块事件
        const speedInput = modal.querySelector('#voice-speed');
        const speedValue = modal.querySelector('#speed-value');
        speedInput.addEventListener('input', () => {
            speedValue.textContent = speedInput.value;
        });

        // 关闭按钮事件
        const closeBtn = modal.querySelector('.close-btn');
        closeBtn.addEventListener('click', () => {
            modal.classList.remove('active');
            setTimeout(() => modal.remove(), 300);
        });

        // 提交按钮事件
        const submitBtn = modal.querySelector('.submit-btn');
        submitBtn.addEventListener('click', () => {
            const name = modal.querySelector('#contact-name').value.trim();
            const targetLang = modal.querySelector('#target-language').value;
            const prompt = modal.querySelector('#contact-prompt').value.trim() || 
                `你是一个${targetLang === 'en' ? '英语' : targetLang === 'ja' ? '日语' : '语言'}学习伙伴，帮助我学习${targetLang === 'en' ? '英语' : targetLang === 'ja' ? '日语' : targetLang}。`;
            const voiceEngine = modal.querySelector('#voice-engine').value;
            const speed = parseFloat(modal.querySelector('#voice-speed').value);
            const icon = modal.querySelector('#contact-icon').value;

            if (!name) {
                showGlobalToast('请输入联系人名称');
                return;
            }

            const contactData = {
                name: name,
                target_language: targetLang,
                prompt: prompt,
                speed: speed,
                voice_engine: voiceEngine,
                icon: icon
            };

            tileManager.addContact(contactData);
            modal.classList.remove('active');
            setTimeout(() => modal.remove(), 300);
            showGlobalToast('联系人添加成功');
        });
    }

    // 添加场景对话框
    function showAddScenarioDialog() {
        // 检查是否已存在对话框
        const existingModal = document.querySelector('.settings-modal');
        if (existingModal) {
            existingModal.remove();
        }

        const modal = document.createElement('div');
        modal.className = 'settings-modal modal';
        modal.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <h3>添加场景</h3>
                    <button class="close-btn"><i class="fas fa-times"></i></button>
                </div>
                <div class="modal-body">
                    <div class="form-group">
                        <label for="scenario-name">场景名称:</label>
                        <input type="text" id="scenario-name" class="form-input" required>
                    </div>
                    <div class="form-group">
                        <label for="scenario-prompt">场景提示词:</label>
                        <textarea id="scenario-prompt" class="form-textarea" rows="3" 
                            placeholder="描述场景的具体情况，例如：在咖啡厅中进行日常对话..."></textarea>
                    </div>
                    <button class="submit-btn">添加</button>
                </div>
            </div>
        `;

        document.body.appendChild(modal);
        modal.classList.add('active');

        // 关闭按钮事件
        const closeBtn = modal.querySelector('.close-btn');
        closeBtn.addEventListener('click', () => {
            modal.classList.remove('active');
            setTimeout(() => modal.remove(), 300);
        });

        // 提交按钮事件
        const submitBtn = modal.querySelector('.submit-btn');
        submitBtn.addEventListener('click', () => {
            const name = modal.querySelector('#scenario-name').value.trim();
            const prompt = modal.querySelector('#scenario-prompt').value.trim();

            if (!name) {
                showGlobalToast('请输入场景名称');
                return;
            }

            if (!prompt) {
                showGlobalToast('请输入场景提示词');
                return;
            }

            const scenarioData = {
                name: name,
                prompt: prompt
            };

            tileManager.addScenario(scenarioData);
            modal.classList.remove('active');
            setTimeout(() => modal.remove(), 300);
            showGlobalToast('场景添加成功');
        });
    }

    // 编辑联系人对话框
    function showEditContactDialog(contact) {
        if (!contact) {
            showGlobalToast('请将联系人拖入编辑区域');
            return;
        }

        const modal = document.createElement('div');
        modal.className = 'settings-modal modal';
        modal.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <h3>编辑联系人</h3>
                    <button class="close-btn"><i class="fas fa-times"></i></button>
                </div>
                <div class="modal-body">
                    <div class="form-group">
                        <label for="contact-name">名称:</label>
                        <input type="text" id="contact-name" class="form-input" value="${contact.name}" required>
                    </div>
                    <div class="form-group">
                        <label for="target-language">目标语言:</label>
                        <select id="target-language" class="form-select">
                            ${support_languages.filter(lang => lang !== mother_language).map(lang => {
                                const langNames = {
                                    'zh': '中文',
                                    'ja': '日本語',
                                    'en': 'English',
                                    'fr': 'Français',
                                    'de': 'Deutsch',
                                    'es': 'Español',
                                    'it': 'Italiano',
                                    'pt': 'Português',
                                    'ru': 'Русский',
                                    'ar': 'العربية'
                                };
                                return `<option value="${lang}" ${contact.target_language === lang ? 'selected' : ''}>
                                    ${langNames[lang] || lang}
                                </option>`;
                            }).join('')}
                        </select>
                    </div>
                    <div class="form-group">
                        <label for="contact-prompt">提示词:</label>
                        <textarea id="contact-prompt" class="form-textarea" rows="3">${contact.prompt}</textarea>
                    </div>
                    <div class="form-group">
                        <label for="voice-engine">语音引擎:</label>
                        <select id="voice-engine" class="form-select">
                            <option value="RealtimeTTS" ${contact.voice_engine === 'RealtimeTTS' ? 'selected' : ''}>RealtimeTTS</option>
                            <option value="GPT_SoVits" ${contact.voice_engine === 'GPT_SoVits' ? 'selected' : ''}>GPT_SoVits</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label for="voice-speed">语速:</label>
                        <div class="speed-control">
                            <input type="range" id="voice-speed" class="form-range" 
                                   min="0.5" max="2" step="0.1" value="${contact.speed}">
                            <span id="speed-value">${contact.speed}</span>
                        </div>
                    </div>
                    <div class="form-group">
                        <label for="contact-icon">头像:</label>
                        <div class="avatar-select-container">
                            <select id="avatar-select" class="form-select">
                                <option value="">选择预设头像</option>
                            </select>
                            <div class="avatar-buttons">
                                <input type="file" id="contact-icon-upload" class="form-input" 
                                       accept="image/*" style="display: none;">
                                <input type="text" id="contact-icon" class="form-input" 
                                       value="${contact.icon}" style="display: none;">
                                <button type="button" class="icon-upload-btn">上传头像</button>
                            </div>
                        </div>
                        <div class="icon-preview">
                            <img src="${contact.icon}" alt="预览" id="icon-preview">
                        </div>
                    </div>
                    <button class="submit-btn">保存修改</button>
                </div>
            </div>
        `;

        document.body.appendChild(modal);
        modal.classList.add('active');

        // 初始化头像选择,传入当前头像
        initAvatarSelection(modal, contact.icon);

        // 语速滑块事件
        const speedInput = modal.querySelector('#voice-speed');
        const speedValue = modal.querySelector('#speed-value');
        speedInput.addEventListener('input', () => {
            speedValue.textContent = speedInput.value;
        });

        // 关闭按钮事件
        const closeBtn = modal.querySelector('.close-btn');
        closeBtn.addEventListener('click', () => {
            modal.classList.remove('active');
            setTimeout(() => modal.remove(), 300);
        });

        // 提交按钮事件
        const submitBtn = modal.querySelector('.submit-btn');
        submitBtn.addEventListener('click', () => {
            const name = modal.querySelector('#contact-name').value.trim();
            const targetLang = modal.querySelector('#target-language').value;
            const prompt = modal.querySelector('#contact-prompt').value.trim();
            const voiceEngine = modal.querySelector('#voice-engine').value;
            const speed = parseFloat(modal.querySelector('#voice-speed').value);
            const icon = modal.querySelector('#contact-icon').value;

            if (!name) {
                showGlobalToast('请输入联系人名称');
                return;
            }

            const updatedContact = {
                ...contact,
                name: name,
                target_language: targetLang,
                prompt: prompt,
                speed: speed,
                voice_engine: voiceEngine,
                icon: icon
            };

            tileManager.updateContact(contact.name, updatedContact);
            modal.classList.remove('active');
            setTimeout(() => modal.remove(), 300);
            showGlobalToast('联系人修改成功');
        });
    }

    // 编辑场景对话框
    function showEditScenarioDialog(scenario) {
        if (!scenario) {
            showGlobalToast('请将场景拖入编辑区域');
            return;
        }

        const modal = document.createElement('div');
        modal.className = 'settings-modal modal';
        modal.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <h3>编辑场景</h3>
                    <button class="close-btn"><i class="fas fa-times"></i></button>
                </div>
                <div class="modal-body">
                    <div class="form-group">
                        <label for="scenario-name">场景名称:</label>
                        <input type="text" id="scenario-name" class="form-input" value="${scenario.name}" required>
                    </div>
                    <div class="form-group">
                        <label for="scenario-prompt">场景提示词:</label>
                        <textarea id="scenario-prompt" class="form-textarea" rows="3">${scenario.prompt}</textarea>
                    </div>
                    <button class="submit-btn">保存修改</button>
                </div>
            </div>
        `;

        document.body.appendChild(modal);
        modal.classList.add('active');

        // 关闭按钮事件
        const closeBtn = modal.querySelector('.close-btn');
        closeBtn.addEventListener('click', () => {
            modal.classList.remove('active');
            setTimeout(() => modal.remove(), 300);
        });

        // 提交按钮事件
        const submitBtn = modal.querySelector('.submit-btn');
        submitBtn.addEventListener('click', () => {
            const name = modal.querySelector('#scenario-name').value.trim();
            const prompt = modal.querySelector('#scenario-prompt').value.trim();

            if (!name) {
                showGlobalToast('请输入场景名称');
                return;
            }

            if (!prompt) {
                showGlobalToast('请输入场景提示词');
                return;
            }

            const updatedScenario = {
                ...scenario,
                name: name,
                prompt: prompt
            };

            tileManager.updateScenario(scenario.name, updatedScenario);
            modal.classList.remove('active');
            setTimeout(() => modal.remove(), 300);
            showGlobalToast('场景修改成功');
        });
    }

    // 回收站对话框
    function showRecycleBinDialog(tile) {
        if (!tile) {
            showGlobalToast('请将要删除的磁贴拖入回收站');
            return;
        }

        const modal = document.createElement('div');
        modal.className = 'settings-modal modal';
        modal.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <h3>删除确认</h3>
                    <button class="close-btn"><i class="fas fa-times"></i></button>
                </div>
                <div class="modal-body">
                    <p>确定要删除 "${tile.name}" 吗？此操作不可恢复。</p>
                    <div class="button-group">
                        <button class="cancel-btn">取消</button>
                        <button class="delete-btn">删除</button>
                    </div>
                </div>
            </div>
        `;

        document.body.appendChild(modal);
        modal.classList.add('active');

        // 关闭按钮事件
        const closeBtn = modal.querySelector('.close-btn');
        closeBtn.addEventListener('click', () => {
            modal.classList.remove('active');
            setTimeout(() => modal.remove(), 300);
        });

        // 取消按钮事件
        const cancelBtn = modal.querySelector('.cancel-btn');
        cancelBtn.addEventListener('click', () => {
            modal.classList.remove('active');
            setTimeout(() => modal.remove(), 300);
        });

        // 删除按钮事件
        const deleteBtn = modal.querySelector('.delete-btn');
        deleteBtn.addEventListener('click', () => {
            if (tile instanceof ContactTile) {
                tileManager.deleteContact(tile.name);
            } else if (tile instanceof ScenarioTile) {
                tileManager.deleteScenario(tile.name);
            }
            modal.classList.remove('active');
            setTimeout(() => modal.remove(), 300);
            showGlobalToast('删除成功');
        });
    }

    // 获取头像列表的函数
    async function getAvatarList() {
        try {
            const response = await fetch('/api/avatars');
            const avatars = await response.json();
            return avatars;
        } catch (error) {
            console.error('获取头像列表失败:', error);
            return ['default_avatar.png']; // 至少返回默认头像
        }
    }

    // 修改头像选择部分的HTML和功能
    function initAvatarSelection(modal, currentIcon = './assets/avatars/default_avatar.png') {
        const iconInput = modal.querySelector('#contact-icon');
        const iconPreview = modal.querySelector('#icon-preview');
        const iconUpload = modal.querySelector('#contact-icon-upload');
        const avatarSelect = modal.querySelector('#avatar-select');
        const uploadBtn = modal.querySelector('.icon-upload-btn');

        // 加载头像列表
        getAvatarList().then(avatars => {
            avatarSelect.innerHTML = '<option value="">选择预设头像</option>';
            avatars.forEach(avatar => {
                const option = document.createElement('option');
                option.value = `./assets/avatars/${avatar}`;
                option.textContent = avatar;
                if (currentIcon === option.value) {
                    option.selected = true;
                }
                avatarSelect.appendChild(option);
            });
        });

        // 下拉框change事件
        avatarSelect.addEventListener('change', () => {
            if (avatarSelect.value) {
                iconInput.value = avatarSelect.value;
                iconPreview.src = avatarSelect.value;
            }
        });

        // 上传按钮点击事件
        uploadBtn.addEventListener('click', () => {
            iconUpload.click();
        });

        // 文件上传change事件
        iconUpload.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (file) {
                if (file.size > 2 * 1024 * 1024) { // 2MB限制
                    showGlobalToast('图片大小不能超过2MB');
                    return;
                }

                const reader = new FileReader();
                reader.onload = (e) => {
                    const img = new Image();
                    img.onload = () => {
                        // 创建canvas进行图片压缩
                        const canvas = document.createElement('canvas');
                        const ctx = canvas.getContext('2d');
                        const maxSize = 200;
                        
                        let width = img.width;
                        let height = img.height;
                        
                        if (width > height) {
                            if (width > maxSize) {
                                height *= maxSize / width;
                                width = maxSize;
                            }
                        } else {
                            if (height > maxSize) {
                                width *= maxSize / height;
                                height = maxSize;
                            }
                        }
                        
                        canvas.width = width;
                        canvas.height = height;
                        ctx.drawImage(img, 0, 0, width, height);
                        
                        const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
                        iconInput.value = dataUrl;
                        iconPreview.src = dataUrl;
                    };
                    img.src = e.target.result;
                };
                reader.readAsDataURL(file);
            }
        });
    }
});
