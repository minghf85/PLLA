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

        // 修改创建文件夹方法
        createFolder(tile1, tile2) {
            // 如果任一磁贴是文件夹，则不创建新文件夹
            if (tile1.classList.contains('folder') || tile2.classList.contains('folder')) {
                return null;
            }

            const folder = document.createElement('div');
            folder.className = 'tile folder';
            folder.dataset.tileId = `folder_${Date.now()}`;
            folder.dataset.size = '1x1';
            
            // 使用第一个磁贴的位置
            const transform = window.getComputedStyle(tile1).transform;
            folder.style.transform = transform;
            
            // 创建文件夹内容
            folder.innerHTML = `
                <div class="tile-drag-handle">
                    <i class="fas fa-grip-vertical"></i>
                </div>
                <div class="folder-content">
                    <div class="folder-grid">
                        <div class="folder-preview"></div>
                        <div class="folder-items hidden"></div>
                    </div>
                </div>
            `;

            const folderPreview = folder.querySelector('.folder-preview');
            const folderItems = folder.querySelector('.folder-items');
            
            // 添加磁贴到文件夹
            this.addTileToFolder(tile1, folder);
            this.addTileToFolder(tile2, folder);
            
            // 更新预览显示
            this.updateFolderPreview(folder);
            
            // 添加双击事件处理
            folder.addEventListener('dblclick', () => {
                folderPreview.classList.toggle('hidden');
                folderItems.classList.toggle('hidden');
            });
            
            // 添加文件夹到容器
            this.container.appendChild(folder);
            this.updateTilePosition(folder, 
                this.getGridPosition(folder.getBoundingClientRect().left, 
                folder.getBoundingClientRect().top));
            
            return folder;
        }

        // 添加磁贴到文件夹
        addTileToFolder(tile, folder) {
            const folderItems = folder.querySelector('.folder-items');
            const clone = tile.cloneNode(true);
            clone.style.transform = 'none';  // 重置transform
            folderItems.appendChild(clone);
            tile.remove();
        }

        // 更新文件夹预览
        updateFolderPreview(folder) {
            const preview = folder.querySelector('.folder-preview');
            const items = folder.querySelectorAll('.folder-items > .tile');
            
            preview.innerHTML = '';
            items.forEach((item, index) => {
                if (index < 9) {  // 只显示前9个
                    const previewItem = item.cloneNode(true);
                    previewItem.style.transform = 'none';
                    preview.appendChild(previewItem);
                }
            });

            // 如果有更多项目，显示数量标记
            if (items.length > 9) {
                const counter = document.createElement('div');
                counter.className = 'folder-counter';
                counter.textContent = `+${items.length - 9}`;
                preview.appendChild(counter);
            }
        }
    }

    // 添加配置加载和磁贴生成功能
    class TileManager {
        constructor() {
            this.config = null;
            this.loadConfig();
            this.initEventListeners();
            this.colors = [
                'rgb(255, 99, 132)',   // 红色
                'rgb(255, 159, 64)',   // 橙色
                'rgb(255, 205, 86)',   // 黄色
                'rgb(75, 192, 192)',   // 青色
                'rgb(54, 162, 235)',   // 蓝色
                'rgb(153, 102, 255)',  // 紫色
                'rgb(255, 99, 255)'    // 粉色
            ];
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
            const lang = 'zh'; // 可以根据需要设置语言
            const contacts = this.config.Learn_config[lang].contact;
            const scenes = this.config.Learn_config[lang].scene;

            // 生成联系人磁贴
            const contactsContainer = document.querySelector('#contacts .tiles-container');
            contactsContainer.innerHTML = ''; // 清空现有磁贴
            
            Object.entries(contacts).forEach(([name, data]) => {
                const tile = this.createContactTile(name, data);
                contactsContainer.appendChild(tile);
            });

            // 生成场景磁贴
            const scenesContainer = document.querySelector('#scenarios .tiles-container');
            scenesContainer.innerHTML = ''; // 清空现有磁贴
            
            Object.entries(scenes).forEach(([name, data]) => {
                const tile = this.createSceneTile(name, data);
                scenesContainer.appendChild(tile);
            });

            // 重新初始化拖拽系统
            initTileSystem();
        }

        createContactTile(name, data) {
            const tile = document.createElement('div');
            tile.className = 'tile';
            tile.dataset.tileId = `contact_${name}`;
            tile.dataset.size = '1x1';

            // 随机选择一个颜色
            const color = this.colors[Math.floor(Math.random() * this.colors.length)];
            tile.style.backgroundColor = color;
            tile.style.color = '#ffffff';  // 文字使用白色

            tile.innerHTML = `
                <div class="tile-drag-handle">
                    <i class="fas fa-grip-vertical"></i>
                </div>
                <div class="tile-resize-handle">
                    <i class="fas fa-expand-arrows-alt"></i>
                </div>
                <img src="${data.icon || 'default_avatar.png'}" alt="${name}">
                <h3>${name}</h3>
                <p>${data.T_lang === 'en' ? '英语教师' : 
                    data.T_lang === 'ja' ? '日语教师' : '语言教师'}</p>
            `;

            return tile;
        }

        createSceneTile(name, data) {
            const tile = document.createElement('div');
            tile.className = 'tile scene-tile';
            tile.dataset.tileId = `scene_${name}`;
            tile.dataset.size = '1x1';
            
            // 随机选择一个颜色
            const color = this.colors[Math.floor(Math.random() * this.colors.length)];
            tile.style.backgroundColor = color;
            tile.style.color = '#ffffff';  // 文字使用白色

            tile.innerHTML = `
                <div class="tile-drag-handle">
                    <i class="fas fa-grip-vertical"></i>
                </div>
                <div class="tile-resize-handle">
                    <i class="fas fa-expand-arrows-alt"></i>
                </div>
                <h3>${name}</h3>
                <p>${data.scene_prompt}</p>
            `;

            return tile;
        }

        initEventListeners() {
            // 添加联系人按钮点击事件
            document.querySelector('#contacts .add-btn').addEventListener('click', () => {
                this.showAddContactModal();
            });

            // 添加场景按钮点击事件
            document.querySelector('#scenarios .add-btn').addEventListener('click', () => {
                this.showAddSceneModal();
            });

            // 表单提交事件
            document.getElementById('addContactForm').addEventListener('submit', (e) => {
                e.preventDefault();
                this.handleAddContact();
            });
        }

        showAddContactModal() {
            const modal = document.getElementById('addContactModal');
            modal.classList.add('active');
        }

        async handleAddContact() {
            const formData = {
                name: document.getElementById('contactName').value,
                T_lang: document.getElementById('targetLang').value,
                prompt: document.getElementById('contactPrompt').value,
                voice_engine: document.getElementById('voiceEngine').value,
            };

            try {
                // 发送到后端保存
                const response = await fetch('/api/add_contact', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(formData)
                });

                if (response.ok) {
                    // 添加新磁贴
                    const contactsContainer = document.querySelector('#contacts .tiles-container');
                    const tile = this.createContactTile(formData.name, formData);
                    contactsContainer.appendChild(tile);
                    
                    // 重新初始化拖拽系统
                    initTileSystem();
                    
                    // 关闭模态框
                    document.getElementById('addContactModal').classList.remove('active');
                } else {
                    console.error('保存失败');
                }
            } catch (error) {
                console.error('保存失败:', error);
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
    `;
    document.head.appendChild(style);
});
