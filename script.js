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
            this.tiles = new Map();
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
            const pos = this.getSnapPoint(x, y);
            this.preview.style.display = 'block';
            this.preview.style.left = `${pos.x}px`;
            this.preview.style.top = `${pos.y}px`;
            this.preview.style.width = `${width}px`;
            this.preview.style.height = `${height}px`;
        }

        hidePreview() {
            this.preview.style.display = 'none';
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

        // 检查位置是否可用
        isPositionAvailable(x, y, width, height, excludeTile) {
            for (const [tile, pos] of this.tiles.entries()) {
                if (tile === excludeTile) continue;
                if (this.checkCollision(
                    { x, y, width, height },
                    { x: pos.x, y: pos.y, width: tile.offsetWidth, height: tile.offsetHeight }
                )) {
                    return false;
                }
            }
            return true;
        }

        // 碰撞检测
        checkCollision(rect1, rect2) {
            return !(rect1.x + rect1.width < rect2.x ||
                    rect1.x > rect2.x + rect2.width ||
                    rect1.y + rect1.height < rect2.y ||
                    rect1.y > rect2.y + rect2.height);
        }

        // 找到最近的可用位置
        findNearestAvailablePosition(tile, x, y) {
            const width = tile.offsetWidth;
            const height = tile.offsetHeight;
            let bestPos = { x, y };
            let minDistance = Infinity;

            for (let i = 0; i < this.rows; i++) {
                for (let j = 0; j < this.columns; j++) {
                    const testX = j * (this.gridSize + this.gap);
                    const testY = i * (this.gridSize + this.gap);

                    if (this.isPositionAvailable(testX, testY, width, height, tile)) {
                        const distance = Math.sqrt(
                            Math.pow(testX - x, 2) + Math.pow(testY - y, 2)
                        );
                        if (distance < minDistance) {
                            minDistance = distance;
                            bestPos = { x: testX, y: testY };
                        }
                    }
                }
            }
            return bestPos;
        }

        // 更新磁贴位置
        updateTilePosition(tile, x, y) {
            const pos = this.findNearestAvailablePosition(tile, x, y);
            // 使用translate3d以启用硬件加速
            tile.style.transform = `translate3d(${pos.x}px, ${pos.y}px, 0)`;
            this.tiles.set(tile, pos);
        }
    }

    // 初始化磁贴系统
    function initTileSystem() {
        const containers = document.querySelectorAll('.tiles-container[data-sortable="true"]');
        
        containers.forEach(container => {
            const grid = new TileGrid(container);
            const tiles = container.querySelectorAll('.tile');

            tiles.forEach(tile => {
                let isDragging = false;
                let isResizing = false;
                let currentX, currentY;
                let initialX, initialY;
                let xOffset = 0;
                let yOffset = 0;

                // 初始化位置
                grid.updateTilePosition(tile, 0, 0);

                function handleDragStart(e) {
                    if (e.target.closest('.tile-resize-handle')) return;
                    if (!e.target.closest('.tile-drag-handle')) return;
                    
                    const rect = tile.getBoundingClientRect();
                    const containerRect = container.getBoundingClientRect();
                    
                    // 保存鼠标在磁贴内的相对位置
                    xOffset = e.clientX - rect.left;
                    yOffset = e.clientY - rect.top;
                    
                    // 保存磁贴当前位置
                    const transform = window.getComputedStyle(tile).transform;
                    const matrix = new DOMMatrix(transform === 'none' ? 'matrix(1,0,0,1,0,0)' : transform);
                    currentX = matrix.m41;
                    currentY = matrix.m42;
                    
                    isDragging = true;
                    tile.classList.add('dragging');
                }

                function handleDragMove(e) {
                    if (!isDragging) return;
                    e.preventDefault();

                    const containerRect = container.getBoundingClientRect();
                    
                    // 计算新位置（鼠标位置减去容器位置和磁贴内偏移）
                    const newX = e.clientX - containerRect.left - xOffset;
                    const newY = e.clientY - containerRect.top - yOffset;
                    
                    // 更新预览位置
                    const snapPoint = grid.getSnapPoint(newX, newY);
                    grid.showPreview(snapPoint.x, snapPoint.y, tile.offsetWidth, tile.offsetHeight);
                    
                    // 直接跟随鼠标移动
                    tile.style.transform = `translate3d(${newX}px, ${newY}px, 0)`;
                }

                function handleDragEnd() {
                    if (!isDragging) return;
                    
                    isDragging = false;
                    tile.classList.remove('dragging');
                    
                    // 获取预览位置并应用网格对齐
                    const previewRect = grid.preview.getBoundingClientRect();
                    const containerRect = container.getBoundingClientRect();
                    const finalX = previewRect.left - containerRect.left;
                    const finalY = previewRect.top - containerRect.top;
                    
                    grid.hidePreview();
                    grid.updateTilePosition(tile, finalX, finalY);
                    
                    saveTilePositions(container);
                }

                // 调整大小处理
                const resizeHandle = tile.querySelector('.tile-resize-handle');
                if (resizeHandle) {
                    let startWidth, startHeight, startX, startY;

                    resizeHandle.addEventListener('mousedown', e => {
                        e.stopPropagation();
                        isResizing = true;
                        
                        startX = e.clientX;
                        startY = e.clientY;
                        startWidth = tile.offsetWidth;
                        startHeight = tile.offsetHeight;
                        
                        tile.classList.add('resizing');
                    });

                    document.addEventListener('mousemove', e => {
                        if (!isResizing) return;
                        e.preventDefault();

                        const deltaX = e.clientX - startX;
                        const deltaY = e.clientY - startY;
                        
                        const newWidth = Math.max(grid.gridSize, 
                            Math.round((startWidth + deltaX) / grid.gridSize) * grid.gridSize);
                        const newHeight = Math.max(grid.gridSize, 
                            Math.round((startHeight + deltaY) / grid.gridSize) * grid.gridSize);

                        tile.style.width = `${newWidth}px`;
                        tile.style.height = `${newHeight}px`;

                        const sizeX = Math.round(newWidth / grid.gridSize);
                        const sizeY = Math.round(newHeight / grid.gridSize);
                        tile.dataset.size = `${sizeX}x${sizeY}`;
                    });

                    document.addEventListener('mouseup', () => {
                        if (!isResizing) return;
                        
                        isResizing = false;
                        tile.classList.remove('resizing');
                        saveTilePositions(container);
                    });
                }

                // 事件监听器
                tile.addEventListener('mousedown', handleDragStart);
                document.addEventListener('mousemove', handleDragMove);
                document.addEventListener('mouseup', handleDragEnd);
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
});
