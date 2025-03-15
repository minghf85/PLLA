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

    // 暗色/亮色主题切换
    let isDarkMode = localStorage.getItem('darkMode') === 'true';
    
    // 初始化主题
    if (isDarkMode) {
        document.body.classList.add('dark-mode');
        themeBtn.innerHTML = '<i class="fas fa-sun"></i>';
    }

    themeBtn.addEventListener('click', function() {
        isDarkMode = !isDarkMode;
        document.body.classList.toggle('dark-mode');
        
        // 更新图标
        themeBtn.innerHTML = isDarkMode ? 
            '<i class="fas fa-sun"></i>' : 
            '<i class="fas fa-moon"></i>';
        
        // 保存主题设置
        localStorage.setItem('darkMode', isDarkMode);
    });

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
            this.gridMap = new Map(); // 存储网格位置和对应的磁贴
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
                        console.log('预览框结束重叠:', this.overlappingTile.dataset.tileId);
                    }

                    this.overlappingTile = overlappingTile;

                    // 设置新的重叠效果
                    if (overlappingTile) {
                        overlappingTile.classList.add('tile-overlapping');
                        console.log('预览框开始重叠:', overlappingTile.dataset.tileId);
                        
                        // 设置新的计时器
                        this.overlappingTimer = setTimeout(() => {
                            console.log('预览框重叠超过2秒:', overlappingTile.dataset.tileId);
                            this.handleOverlapTimeout(draggedTile, overlappingTile);
                        }, 2000);
                    }
                }
            }
        }

        handleOverlapTimeout(draggedTile, targetTile) {
            // 这里可以添加振动反馈
            if (window.navigator.vibrate) {
                window.navigator.vibrate(50);
            }
            
            // 添加视觉反馈
            targetTile.classList.add('tile-overlap-complete');
            setTimeout(() => targetTile.classList.remove('tile-overlap-complete'), 500);
            
            console.log('处理重叠超时:', {
                dragged: draggedTile.dataset.tileId,
                target: targetTile.dataset.tileId
            });
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

        // 更新磁贴位置，考虑磁贴大小
        updateTilePosition(tile, x, y) {
            const gridPos = this.getGridPosition(x, y);
            const size = this.getTileSize(tile);
            
            // 移除旧位置的所有占用格子
            this.gridMap.forEach((value, key) => {
                if (value === tile) {
                    this.gridMap.delete(key);
                }
            });

            // 设置新位置的所有占用格子
            for (let i = 0; i < size.w; i++) {
                for (let j = 0; j < size.h; j++) {
                    const key = `${gridPos.x + i * this.gridSize},${gridPos.y + j * this.gridSize}`;
                    this.gridMap.set(key, tile);
                }
            }

            tile.style.transform = `translate3d(${gridPos.x}px, ${gridPos.y}px, 0)`;
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

            for (let i = 0; i < size.w; i++) {
                for (let j = 0; j < size.h; j++) {
                    const key = `${gridPos.x + i * this.gridSize},${gridPos.y + j * this.gridSize}`;
                    const occupyingTile = this.gridMap.get(key);
                    if (occupyingTile && occupyingTile !== tile) {
                        return false;
                    }
                }
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
            // 找到一个可用的位置
            let x = 0, y = 0;
            const size = this.getTileSize(tile);
            
            while (!this.isPositionAvailable(x, y, tile)) {
                x += this.gridSize;
                if (x >= this.container.offsetWidth - this.gridSize) {
                    x = 0;
                    y += this.gridSize;
                }
            }
            
            this.updateTilePosition(tile, x, y);
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

    // 基础磁贴类
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
            this.overlappingTimer = null;
            this.bindBaseEvents();
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

        bindBaseEvents() {
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
            this.bindEvents();
        }

        bindEvents() {
            this.element.addEventListener('click', () => this.onClick());
        }

        onClick() {
            // 打开联系人详情
            console.log('打开联系人:', this.contact);
        }

        onDoubleClick(e) {
            console.log('编辑联系人:', this.contact);
            // 实现联系人编辑界面
        }

        onOverlapTimeout() {
            console.log('联系人磁贴重叠超时:', this.contact);
            // 实现重叠处理逻辑
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

    // 功能磁贴类
    class FunctionTile extends BaseTile {
        constructor(type, options = {}) {
            const config = FunctionTile.getConfig(type);
            super(`function_${type}`, {
                ...config,
                ...options,
                size: '1x1',
                resizable: false
            });
            
            this.type = type;
            this.bindEvents();
        }

        static getConfig(type) {
            const configs = {
                menu: {
                    title: '菜单',
                    icon: 'fa-bars',
                    color: '#9b59b6'
                },
                search: {
                    title: '搜索',
                    icon: 'fa-search',
                    color: '#3498db'
                },
                theme: {
                    title: '主题',
                    icon: 'fa-lightbulb',
                    color: '#f1c40f'
                },
                'add-contact': {
                    title: '添加联系人',
                    icon: 'fa-user-plus',
                    color: '#27ae60'
                },
                'add-scenario': {
                    title: '添加场景',
                    icon: 'fa-plus',
                    color: '#c0392b'
                },
                'edit-contact': {
                    title: '编辑联系人',
                    icon: 'fa-user-edit',
                    color: '#16a085'
                },
                'edit-scenario': {
                    title: '编辑场景',
                    icon: 'fa-edit',
                    color: '#d35400'
                }
            };
            return configs[type] || {};
        }

        bindEvents() {
            this.element.addEventListener('click', () => this.onClick());
        }

        onClick() {
            switch (this.type) {
                case 'menu':
                    document.getElementById('sidebar').classList.toggle('active');
                    break;
                case 'theme':
                    document.body.classList.toggle('dark-theme');
                    break;
                case 'search':
                    // 实现搜索功能
                    break;
                case 'add-contact':
                    // 实现添加联系人功能
                    break;
                case 'add-scenario':
                    // 实现添加场景功能
                    break;
                case 'edit-contact':
                    console.log('打开联系人编辑器');
                    // 实现编辑联系人功能
                    break;
                case 'edit-scenario':
                    console.log('打开场景编辑器');
                    // 实现编辑场景功能
                    break;
            }
        }
    }

    // 修改 TileManager 类
    class TileManager {
        constructor() {
            this.config = null;
            this.loadConfig();
        }

        async loadConfig() {
            try {
                const response = await fetch('config.json');
                this.config = await response.json();
                this.generateTiles();
            } catch (error) {
                console.error('加载配置文件失败:', error);
            }
        }

        generateTiles() {
            const container = document.querySelector('.tiles-container');
            container.innerHTML = '';

            // 添加功能磁贴
            const functionTiles = [
                new FunctionTile('menu'),
                new FunctionTile('search'),
                new FunctionTile('theme'),
                new FunctionTile('add-contact'),
                new FunctionTile('add-scenario'),
                new FunctionTile('edit-contact'),
                new FunctionTile('edit-scenario')
            ];

            // 添加联系人磁贴
            const contacts = this.config.Learn_config.zh.contact;
            const contactTiles = Object.entries(contacts).map(
                ([name, data]) => new ContactTile(name, data)
            );

            // 添加场景磁贴
            const scenarios = this.config.Learn_config.zh.scene;
            const scenarioTiles = Object.entries(scenarios).map(
                ([name, data]) => new ScenarioTile(name, data)
            );

            // 将所有磁贴添加到容器
            [...functionTiles, ...contactTiles, ...scenarioTiles].forEach(tile => {
                container.appendChild(tile.element);
            });

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

            // 初始化所有磁贴位置
            tiles.forEach(tile => {
                grid.initializeTilePosition(tile);
            });

            tiles.forEach(tile => {
                let isDragging = false;
                let isResizing = false;
                let currentX, currentY;
                let initialX, initialY;
                let xOffset = 0;
                let yOffset = 0;

                // 鼠标事件处理
                function handleDragStart(e) {
                    if (!e.target.closest('.tile-drag-handle')) return;
                    
                    const rect = tile.getBoundingClientRect();
                    const containerRect = container.getBoundingClientRect();
                    
                    xOffset = e.clientX - rect.left;
                    yOffset = e.clientY - rect.top;
                    
                    // 记录初始位置
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
                    
                    // 更新当前位置
                    currentX = newX;
                    currentY = newY;
                    
                    // 显示预览网格
                    grid.showPreview(newX, newY, tile.offsetWidth, tile.offsetHeight);
                    
                    // 移动磁贴
                    tile.style.transform = `translate3d(${newX}px, ${newY}px, 0)`;
                }

                function handleDragEnd() {
                    if (!isDragging) return;
                    
                    isDragging = false;
                    tile.classList.remove('dragging');
                    tile.style.zIndex = '';
                    
                    // 隐藏预览网格
                    grid.hidePreview();
                    
                    // 对齐到网格
                    const gridPos = grid.getGridPosition(currentX, currentY);
                    
                    // 检查新位置是否可用
                    if (grid.isPositionAvailable(gridPos.x, gridPos.y, tile)) {
                        grid.updateTilePosition(tile, gridPos.x, gridPos.y);
                    } else {
                        // 如果位置不可用，返回原始位置
                        grid.updateTilePosition(tile, initialX, initialY);
                    }
                    
                    saveTilePositions(container);
                }

                // 检查重叠的辅助函数
                function findOverlappingTile(dragTile, x, y) {
                    const dragRect = {
                        left: x,
                        top: y,
                        right: x + dragTile.offsetWidth,
                        bottom: y + dragTile.offsetHeight
                    };
                    
                    const tiles = Array.from(container.querySelectorAll('.tile'));
                    
                    for (const tile of tiles) {
                        if (tile === dragTile) continue;
                        
                        const rect = tile.getBoundingClientRect();
                        const containerRect = container.getBoundingClientRect();
                        const tileRect = {
                            left: rect.left - containerRect.left,
                            top: rect.top - containerRect.top,
                            right: rect.right - containerRect.left,
                            bottom: rect.bottom - containerRect.top
                        };
                        
                        // 检查重叠
                        const overlap = !(dragRect.right < tileRect.left || 
                                         dragRect.left > tileRect.right || 
                                         dragRect.bottom < tileRect.top || 
                                         dragRect.top > tileRect.bottom);
                        
                        if (overlap) return tile;
                    }
                    
                    return null;
                }

                // 触摸事件处理
                function handleTouchStart(e) {
                    if (!e.target.closest('.tile-drag-handle')) return;
                    e.preventDefault();
                    
                    const touch = e.touches[0];
                    handleDragStart({
                        clientX: touch.clientX,
                        clientY: touch.clientY,
                        target: e.target
                    });
                }

                function handleTouchMove(e) {
                    if (!isDragging) return;
                    e.preventDefault();
                    
                    const touch = e.touches[0];
                    handleDragMove({
                        clientX: touch.clientX,
                        clientY: touch.clientY,
                        preventDefault: () => {}
                    });
                }

                function handleTouchEnd(e) {
                    handleDragEnd();
                }

                // 调整大小处理
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
                        
                        const newWidth = Math.max(grid.gridSize, 
                            Math.round((startWidth + deltaX) / grid.gridSize) * grid.gridSize);
                        const newHeight = Math.max(grid.gridSize, 
                            Math.round((startHeight + deltaY) / grid.gridSize) * grid.gridSize);

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
                        } else {
                            // 如果新位置不可用，恢复原始大小
                            tile.dataset.size = oldSize;
                        }
                    }

                    function handleResizeEnd() {
                        if (!isResizing) return;
                        isResizing = false;
                        tile.classList.remove('resizing');
                        saveTilePositions(container);
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

                // 添加事件监听器
                tile.addEventListener('mousedown', handleDragStart);
                document.addEventListener('mousemove', handleDragMove);
                document.addEventListener('mouseup', handleDragEnd);
                
                tile.addEventListener('touchstart', handleTouchStart, { passive: false });
                document.addEventListener('touchmove', handleTouchMove, { passive: false });
                document.addEventListener('touchend', handleTouchEnd);
            });
        });
    }

    // 保存磁贴位置
    function saveTilePositions(container) {
        const positions = Array.from(container.querySelectorAll('.tile')).map(tile => ({
            id: tile.dataset.tileId,
            transform: tile.style.transform,
            width: tile.style.width,
            height: tile.style.height
        }));
        
        const containerId = container.closest('section').id;
        localStorage.setItem(`tilePositions_${containerId}`, JSON.stringify(positions));
    }

    // 加载保存的磁贴位置
    function loadTilePositions() {
        document.querySelectorAll('.tiles-container[data-sortable="true"]').forEach(container => {
            const containerId = container.closest('section').id;
            const savedPositions = localStorage.getItem(`tilePositions_${containerId}`);
            
            if (savedPositions) {
                const positions = JSON.parse(savedPositions);
                positions.forEach(pos => {
                    const tile = container.querySelector(`[data-tile-id="${pos.id}"]`);
                    if (tile) {
                        tile.style.transform = pos.transform;
                        tile.style.width = pos.width;
                        tile.style.height = pos.height;
                    }
                });
            }
        });
    }

    initTileSystem();
    loadTilePositions();

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
});
