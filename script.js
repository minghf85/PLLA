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

document.addEventListener('DOMContentLoaded', function() {
    const menuToggle = document.getElementById('menu-toggle');
    const sidebar = document.getElementById('sidebar');
    const mainContent = document.querySelector('.main-content');
    const resizer = document.getElementById('mainResizer');
    const sections = document.querySelectorAll('.contacts-section, .scenarios-section');
    const themeBtn = document.querySelector('.theme-btn');
    
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
            this.gridSize = 120;
            this.gap = 10;
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
                    }

                    this.overlappingTile = overlappingTile;

                    // 设置新的重叠效果
                    if (overlappingTile && overlappingTile.dataset.tileId === 'chat') {
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
                }
            }
        }

        handleOverlapTimeout(draggedTile, targetTile) {
            // 检查是否是联系人拖入场景
            if (draggedTile.classList.contains('contact-tile') && 
                targetTile.classList.contains('scenario-tile')) {
                
                const contactTileInstance = tileInstances.get(draggedTile);
                const scenarioTileInstance = tileInstances.get(targetTile);
                
                if (contactTileInstance && scenarioTileInstance) {
                    contactTileInstance.handleSceneDrop(scenarioTileInstance);
                }
            }
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
                        <i class="fas ${this.icon}" style="color: ${this.color}"></i>
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
            this.element.dataset.size = `${Math.round(width/120)}x${Math.round(height/120)}`;
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
            super(`contact_${name}`, {
                title: name,
                description: data.description,
                icon: 'fa-user',
                color: '#2ecc71',
                size: data.size || '1x1'
            });
            
            this.contact = data;
            this.name = name;
            this.bindEvents();
        }

        bindEvents() {
            // 双击事件
            this.element.addEventListener('dblclick', () => {
                // 进入默认场景对话
                window.location.href = `chat.html?contact=${this.name}&scene=default`;
            });
        }

        // 处理拖入场景
        handleSceneDrop(sceneTile) {
            const sceneName = sceneTile.scenario.scene_name;
            window.location.href = `chat.html?contact=${this.name}&scene=${sceneName}`;
        }
    }

    // 学习场景磁贴类
    class ScenarioTile extends BaseTile {
        constructor(name, data) {
            super(`scenario_${name}`, {
                title: name,
                description: data.description,
                icon: 'fa-book',
                color: '#e74c3c',
                size: data.size || '1x1'
            });
            
            this.scenario = data;
            this.bindEvents();
        }

        bindEvents() {
            this.element.addEventListener('click', () => this.onClick());
        }

        onClick() {
            // 打开学习场景
            console.log('打开场景:', this.scenario);
        }

        onDoubleClick(e) {
            console.log('编辑场景:', this.scenario);
            // 实现场景编辑界面
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
            icon: 'fa-bars',
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
            icon: 'fa-search',
            color: '#9b59b6',
            action: () => {
                console.log('搜索功能待实现');
                // TODO: 实现搜索功能
            }
        },
        theme: {
            title: '主题切换',
            icon: savedTheme === 'dark' ? 'fa-sun' : 'fa-moon',  // 根据当前主题设置初始图标
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
            icon: 'fa-user-plus',
            color: '#2ecc71',
            action: () => {
                console.log('添加联系人功能待实现');
                // TODO: 实现添加联系人功能
            }
        },
        'add-scenario': {
            title: '添加场景',
            icon: 'fa-plus-square',
            color: '#e74c3c',
            action: () => {
                console.log('添加场景功能待实现');
                // TODO: 实现添加场景功能
            }
        },
        'edit-contact': {
            title: '编辑联系人',
            icon: 'fa-user-edit',
            color: '#e67e22',
            action: () => {
                console.log('编辑联系人功能待实现');
                // TODO: 实现编辑联系人功能
            }
        },
        'edit-scenario': {
            title: '编辑场景',
            icon: 'fa-edit',
            color: '#1abc9c',
            action: () => {
                console.log('编辑场景功能待实现');
                // TODO: 实现编辑场景功能
            }
        },
        save: {
            title: '保存布局',
            icon: 'fa-save',
            color: '#34495e',
            action: saveAllTileStates
        }
    };

    // 修改 FunctionTile 类的构造函数
    class FunctionTile extends BaseTile {
        constructor(id) {
            const functionConfig = config[id];
            if (!functionConfig) {
                throw new Error(`未找到功能配置: ${id}`);
            }

            super(id, {
                title: functionConfig.title,
                icon: functionConfig.icon,
                color: functionConfig.color,
                description: ''
            });

            this.action = functionConfig.action;
            this.element.dataset.tileId = id; // 确保添加标识
            this.bindEvents();
        }

        bindEvents() {
            // 双击触发功能，添加防抖
            let lastClickTime = 0;
            this.element.addEventListener('dblclick', (e) => {
                const currentTime = new Date().getTime();
                if (currentTime - lastClickTime > 300) { // 防抖间隔
                    lastClickTime = currentTime;
                    if (this.action) {
                        e.preventDefault();
                        e.stopPropagation();
                        this.action();
                    }
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
                icon: options.icon || 'fa-window-maximize',
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
            const current_contact = this.current_contact;
            const current_scenario = this.current_scenario;
            // 设置最小尺寸
            tile.style.minWidth = '480px';
            tile.style.minHeight = '480px';
            
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
                                        <span class="contact-name">${current_contact}</span>
                                    </span>
                                    <span class="divider">·</span>
                                    <span class="current-scenario">
                                        <i class="fas fa-book"></i>
                                        <span class="scenario-name">${current_scenario}</span>
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
            let isListeningMode = false;
            listeningModeBtn.addEventListener('click', () => {
                isListeningMode = !isListeningMode;
                const icon = listeningModeBtn.querySelector('i');
                icon.classList.toggle('fa-eye');
                icon.classList.toggle('fa-eye-slash');
                
                // 获取所有 AI 消息并切换模糊效果
                const aiMessages = messagesContainer.querySelectorAll('.ai-message .message-content');
                aiMessages.forEach(message => {
                    message.classList.toggle('content-masked');
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

            // 发送消息的函数
            const sendMessage = () => {
                const message = input.value.trim();
                if (message) {
                    // 创建用户消息
                    const userMsg = new UserMessage(message);
                    messagesContainer.appendChild(userMsg.element);
                    
                    // 滚动到最新消息
                    scrollToLatest();
                    
                    // 清空输入
                    input.value = '';
                    
                    // 模拟AI回复，展示 Markdown 丰富文本效果
                    setTimeout(async () => {
                        const aiMsg = new AIMessage('');
                        messagesContainer.appendChild(aiMsg.element);
                        
                        const richContent = `
# Markdown 展示示例

这是一段普通文本，展示基本的 *斜体* 和 **粗体** 效果。

## 代码示例
\`\`\`python
def hello_world():
    print("你好，世界！")
    return True
\`\`\`

<ruby>
  日本語 <rp>(</rp><rt>にほんご</rt><rp>)</rp>
</ruby>
を
<ruby>
  勉強 <rp>(</rp><rt>べんきょう</rt><rp>)</rp>
</ruby>
しています。

## 列表示例
- 无序列表项 1
- 无序列表项 2
  - 嵌套列表项
  - 另一个嵌套项

1. 有序列表项 1
2. 有序列表项 2

## 引用和高亮
> 这是一段引用文本
> 可以有多行

这段文本包含 \`行内代码\` 和 ==高亮文本==

## 表格示例
| 功能 | 说明 |
|------|------|
| 粗体 | **文本** |
| 斜体 | *文本* |
| 代码 | \`代码\` |

## 特殊标记
- ✅ 已完成任务
- ❌ 未完成任务
- ⚠️ 警告信息
- 💡 提示信息

## 数学公式
当 $a \\ne 0$ 时，方程 $ax^2 + bx + c = 0$ 有两个解：
$$x = {-b \\pm \\sqrt{b^2-4ac} \\over 2a}$$
`;
                        
                        await aiMsg.streamContent(richContent);
                        scrollToLatest();
                    }, 1000);
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
            const minWidth = 480;  // 4 * 120px
            const minHeight = 480; // 4 * 120px
            
            const finalWidth = Math.max(width, minWidth);
            const finalHeight = Math.max(height, minHeight);
            
            // 更新 dataset.size 以反映实际大小
            const sizeW = Math.max(4, Math.round(finalWidth / 120));
            const sizeH = Math.max(4, Math.round(finalHeight / 120));
            this.element.dataset.size = `${sizeW}x${sizeH}`;
            
            // 设置样式
            this.element.style.width = `${finalWidth}px`;
            this.element.style.height = `${finalHeight}px`;
        }

        // 添加验证尺寸的方法
        validateSize() {
            const width = parseInt(this.element.style.width);
            const height = parseInt(this.element.style.height);
            if (width < 480 || height < 480) {
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
            this.gridConfig = null;
            this.loadConfig();
        }

        async loadConfig() {
            try {
                const response = await fetch('/api/config');
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                this.config = await response.json();
                
                // 确保配置中包含必要的结构
                if (!this.config.Learn_config) {
                    this.config.Learn_config = {};
                }
                if (!this.config.Learn_config.zh) {
                    this.config.Learn_config.zh = {};
                }
                
                // 确保使用正确的网格配置
                this.gridConfig = this.config.Learn_config.zh.grid_config || {
                    tile_size: 120,
                    gap_size: 10
                };
                
                await this.generateTiles();
            } catch (error) {
                console.error('加载配置失败:', error);
                // 使用默认配置
                this.config = {
                    Learn_config: {
                        zh: {
                            grid_config: {
                                tile_size: 120,
                                gap_size: 10
                            },
                            function_tiles: {},
                            contact: {},
                            scene: {},
                            chat_tile: {
                                tile: {
                                    position: 'translate3d(0px, 0px, 0)',
                                    size: '4x4'
                                }
                            }
                        }
                    }
                };
                this.gridConfig = this.config.Learn_config.zh.grid_config;
                await this.generateTiles();
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

            // 创建所有磁贴
            const allTiles = [
                // 功能磁贴
                ...Object.entries(this.config.Learn_config.zh.function_tiles || {})
                    .map(([name, data]) => {
                        const tile = new FunctionTile(name);
                        if (data.tile) {
                            // 应用保存的布局
                            const tileSize = this.calculateTileSize(data.tile.size);
                            Object.assign(tile.element.style, {
                                transform: data.tile.position,
                                width: `${tileSize.width}px`,
                                height: `${tileSize.height}px`
                            });
                            tile.element.dataset.size = data.tile.size;
                        }
                        return tile;
                    }),

                // 联系人磁贴
                ...Object.entries(this.config.Learn_config.zh.contact || {})
                    .map(([name, data]) => {
                        const tile = new ContactTile(name, data);
                        if (data.tile) {
                            const tileSize = this.calculateTileSize(data.tile.size);
                            Object.assign(tile.element.style, {
                                transform: data.tile.position,
                                width: `${tileSize.width}px`,
                                height: `${tileSize.height}px`
                            });
                            tile.element.dataset.size = data.tile.size;
                        }
                        return tile;
                    }),

                // 场景磁贴
                ...Object.entries(this.config.Learn_config.zh.scene || {})
                    .map(([name, data]) => {
                        const tile = new ScenarioTile(name, data);
                        if (data.tile) {
                            const tileSize = this.calculateTileSize(data.tile.size);
                            Object.assign(tile.element.style, {
                                transform: data.tile.position,
                                width: `${tileSize.width}px`,
                                height: `${tileSize.height}px`
                            });
                            tile.element.dataset.size = data.tile.size;
                        }
                        return tile;
                    }),

                // 聊天磁贴
                (() => {
                    const chatTileConfig = this.config.Learn_config.zh.chat_tile;
                    const chatTile = new ChatTile('chat_tile', {
                        title: '聊天',
                        size: '4x4'
                    });
                    
                    // 应用保存的布局
                    if (chatTileConfig && chatTileConfig.tile) {
                        const tileSize = this.calculateTileSize(chatTileConfig.tile.size);
                        Object.assign(chatTile.element.style, {
                            transform: chatTileConfig.tile.position,
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
                            newWidth = Math.max(newWidth, 480);  // 4 * 120px
                            newHeight = Math.max(newHeight, 480); // 4 * 120px
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

    // 添加文件夹相关的CSS样式
    const style = document.createElement('style');
    style.textContent = `
        .tile {
            transition: transform 0.2s ease;
        }
        
        .tile.dragging {
            opacity: 0.8;
            z-index: 1000;
        }

        .tile-preview {
            position: absolute;
            border: 2px dashed var(--text-color);
            background: rgba(128, 128, 128, 0.1);
            pointer-events: none;
            z-index: 999;
        }

        [data-theme="dark"] .tile-preview {
            border-color: rgba(255, 255, 255, 0.5);
            background: rgba(255, 255, 255, 0.1);
        }

        [data-theme="light"] .tile-preview {
            border-color: rgba(0, 0, 0, 0.5);
            background: rgba(0, 0, 0, 0.1);
        }

        .tile-overlapping {
            transform: scale(1.05);
            box-shadow: 0 0 15px rgba(var(--primary-rgb), 0.5);
            border: 2px solid var(--primary-color);
        }

        .tile-overlap-complete {
            animation: overlap-flash 0.5s ease;
        }

        @keyframes overlap-flash {
            0% { transform: scale(1.05); }
            50% { transform: scale(1.1); }
            100% { transform: scale(1.05); }
        }

    `;
    document.head.appendChild(style);

    // 添加保存所有磁贴状态的函数
    async function saveAllTileStates() {
        const saveBtn = document.querySelector('.save-btn');
        saveBtn.classList.add('saving');
        
        try {
            const tiles = Array.from(document.querySelectorAll('.tile'));
            const savePromises = tiles.map(tile => {
                const tileInstance = tileInstances.get(tile);
                if (tileInstance) {
                    // 如果是聊天磁贴，先验证尺寸
                    if (tileInstance instanceof ChatTile) {
                        tileInstance.validateSize();
                    }

                    const state = {
                        position: tile.style.transform,
                        size: tile.dataset.size,
                        width: tile.style.width,
                        height: tile.style.height
                    };

                    // 根据磁贴类型构建不同的请求体
                    let requestBody;
                    if (tileInstance instanceof ChatTile) {
                        requestBody = {
                            id: 'chat_tile',
                            type: 'chat_tile',
                            state: state
                        };
                    } else if (tileInstance instanceof ContactTile) {
                        requestBody = {
                            id: `contact_${tileInstance.name}`,
                            state: state
                        };
                    } else if (tileInstance instanceof ScenarioTile) {
                        requestBody = {
                            id: `scenario_${tileInstance.scenario.scene_name}`,
                            state: state
                        };
                    } else if (tileInstance instanceof FunctionTile) {
                        requestBody = {
                            id: `function_${tileInstance.id}`,
                            state: state
                        };
                    }

                    if (requestBody) {
                        return fetch('/api/tile/update', {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json',
                            },
                            body: JSON.stringify(requestBody)
                        }).then(response => response.json());
                    }
                }
                return Promise.resolve();
            });

            const results = await Promise.all(savePromises);
            const success = results.every(result => result && result.success);

            if (success) {
                saveBtn.innerHTML = '<i class="fas fa-check"></i>';
                setTimeout(() => {
                    saveBtn.innerHTML = '<i class="fas fa-save"></i>';
                }, 2000);
            } else {
                throw new Error('部分磁贴保存失败');
            }
        } catch (error) {
            console.error('保存磁贴状态时出错:', error);
            saveBtn.innerHTML = '<i class="fas fa-exclamation-triangle"></i>';
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
            
            // 初始化 marked 配置
            if (typeof marked !== 'undefined') {
                marked.setOptions({
                    renderer: new marked.Renderer(),
                    highlight: function(code, language) {
                        if (typeof hljs !== 'undefined') {
                            return hljs.highlightAuto(code).value;
                        }
                        return code;
                    },
                    gfm: true,
                    breaks: true,
                    sanitize: false,
                    smartLists: true,
                    smartypants: false,
                    xhtml: false
                });
            }
            
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

        copyContent() {
            const content = this.element.querySelector('.message-content').textContent;
            navigator.clipboard.writeText(content).then(() => {
                console.log('已复制到剪贴板');
            });
        }

        async streamContent(text) {
            const contentArea = this.element.querySelector('.message-content');
            contentArea.innerHTML = '';
            
            let buffer = '';
            const chars = Array.from(text);
            
            for (let char of chars) {
                buffer += char;
                
                // 每次累积一定数量的字符或遇到换行时进行一次渲染
                if (char === '\n' || buffer.length % 10 === 0) {
                    if (typeof marked !== 'undefined') {
                        try {
                            contentArea.innerHTML = marked.parse(buffer);
                            
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
                            contentArea.textContent = buffer;
                        }
                    } else {
                        contentArea.textContent = buffer;
                    }
                    
                    // 滚动到底部
                    this.scrollToBottom();
                    
                    // 添加延迟以实现打字效果
                    await new Promise(resolve => setTimeout(resolve, 30));
                }
            }
            
            // 最后一次完整渲染
            if (typeof marked !== 'undefined') {
                contentArea.innerHTML = marked.parse(buffer);
                
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
                        title: '隐藏/显示',
                        onClick: () => this.toggleVisibility()
                    }
                ]
            });
            this.element.classList.add('ai-message');
            
            // 检查听力模式状态
            const listeningMode = document.querySelector('.listening-mode .fa-eye-slash');
            if (listeningMode) {
                this.element.querySelector('.message-content').classList.add('content-masked');
            }
        }
    }
});
