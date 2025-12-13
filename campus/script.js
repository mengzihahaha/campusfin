// 1. 核心元素和配置
const mapContainer = document.querySelector('.map-container');
const zoomInBtn = document.getElementById('zoomIn');
const zoomOutBtn = document.getElementById('zoomOut');
const zoomResetBtn = document.getElementById('zoomReset');
let currentImgIndex = 0; // 当前显示的图片索引（默认第1张）
let currentImages = []; // 当前地点的所有图片路径（单图/多图）

// 缩放配置（最大放大4倍）
let currentScale = 1;
const scaleStep = 0.1;
const minScale = 0.5;
const maxScale = 4;

// 拖拽配置
let isDragging = false;
let startX, startY;
let offsetX = 0, offsetY = 0;

// 2. 板块切换功能
const tabBtns = document.querySelectorAll('.tab-btn');
const tabContents = document.querySelectorAll('.tab-content');

tabBtns.forEach(btn => {
    btn.addEventListener('click', () => {
        const targetTab = btn.dataset.tab;

        // 切换按钮激活状态
        tabBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');

        // 切换板块内容
        tabContents.forEach(content => {
            content.classList.remove('active');
            if (content.id === `${targetTab}-tab`) {
                content.classList.add('active');
            }
        });

        // 切换板块时隐藏弹窗
        popup.style.display = 'none';
        popup.classList.remove('active');
    });
});

// 3. 缩放功能
zoomInBtn.addEventListener('click', () => {
    if (currentScale < maxScale) {
        currentScale += scaleStep;
        updateMapTransform();
    }
});

zoomOutBtn.addEventListener('click', () => {
    if (currentScale > minScale) {
        currentScale -= scaleStep;
        updateMapTransform();
    }
});

zoomResetBtn.addEventListener('click', () => {
    currentScale = 1;
    offsetX = 0;
    offsetY = 0;
    updateMapTransform();
    popup.style.display = 'none';
    popup.classList.remove('active');
});

// 鼠标滚轮缩放
mapContainer.addEventListener('wheel', (e) => {
    e.preventDefault();
    if (e.deltaY < 0 && currentScale < maxScale) {
        currentScale += scaleStep;
    } else if (e.deltaY > 0 && currentScale > minScale) {
        currentScale -= scaleStep;
    }
    updateMapTransform();
});

// 4. 拖拽功能
mapContainer.addEventListener('mousedown', (e) => {
    isDragging = true;
    const rect = mapContainer.getBoundingClientRect();
    startX = e.clientX - rect.left - offsetX;
    startY = e.clientY - rect.top - offsetY;
    mapContainer.style.userSelect = 'none';
    popup.style.display = 'none';
    popup.classList.remove('active');
});

document.addEventListener('mousemove', (e) => {
    if (!isDragging) return;
    const rect = mapContainer.getBoundingClientRect();
    offsetX = e.clientX - rect.left - startX;
    offsetY = e.clientY - rect.top - startY;
    updateMapTransform();
});

document.addEventListener('mouseup', () => {
    isDragging = false;
    mapContainer.style.userSelect = '';
});

mapContainer.addEventListener('mouseleave', () => {
    isDragging = false;
    mapContainer.style.userSelect = '';
});

// 统一更新地图缩放和偏移
function updateMapTransform() {
    mapContainer.style.transform = `translate(${offsetX}px, ${offsetY}px) scale(${currentScale})`;
}

// 5. 图文弹窗功能（核心修改：支持底图点击）
const popup = document.getElementById('custom-popup');
const popupTitle = document.getElementById('popup-title');
const popupImg = document.getElementById('popup-img');
const popupDesc = document.getElementById('popup-desc');
const popupClose = document.getElementById('popup-close');

// 通用弹窗显示函数（居中显示）
// 弹窗显示函数（支持多图切换）
function showPopup(point) {
    const popup = document.getElementById('custom-popup');
    const titleElem = document.getElementById('popup-title');
    const imgElem = document.getElementById('popup-img');
    const descElem = document.getElementById('popup-desc');
    const nextBtn = document.getElementById('img-next');
    const paginationElem = document.getElementById('img-pagination');

    // 1. 填充基本信息
    titleElem.textContent = point.name;
    descElem.textContent = point.desc;

    // 2. 处理图片（区分单图/多图）
    if (Array.isArray(point.img)) {
        // 多图情况
        currentImages = point.img; // 存储当前地点的所有图片
        currentImgIndex = 0; // 重置为第1张
        imgElem.src = currentImages[currentImgIndex]; // 显示第1张图
        // 显示切换按钮和页码
        nextBtn.style.display = 'block';
        paginationElem.style.display = 'block';
        // 更新页码（索引+1，因为用户习惯从1开始）
        paginationElem.textContent = `${currentImgIndex + 1}/${currentImages.length}`;
    } else {
        // 单图情况（兼容原有功能）
        currentImages = []; // 清空多图数据
        imgElem.src = point.img || ''; // 显示单图（无图则空）
        // 隐藏切换按钮和页码
        nextBtn.style.display = 'none';
        paginationElem.style.display = 'none';
    }

    // 3. 弹窗居中显示（原有逻辑不变）
    popup.style.display = 'block';
    setTimeout(() => {
        popup.classList.add('active');
    }, 10);
    const windowWidth = window.innerWidth;
    const windowHeight = window.innerHeight;
    const popupWidth = popup.offsetWidth;
    const popupHeight = popup.offsetHeight;
    const centerX = (windowWidth - popupWidth) / 2;
    const centerY = (windowHeight - popupHeight) / 2;
    popup.style.left = `${centerX}px`;
    popup.style.top = `${centerY}px`;

    // 4. 点击空白处关闭弹窗（原有逻辑不变）
    document.addEventListener('click', closePopupOnOutsideClick);
}

// 点击建筑显示弹窗（复用通用函数）
const buildings = document.querySelectorAll('.building');
buildings.forEach(building => {
    building.addEventListener('click', (e) => {
        e.stopPropagation(); // 阻止事件冒泡到地图
        const point = {
            name: building.dataset.name,
            desc: building.dataset.desc,
            img: building.dataset.img
        };
        showPopup(point);
    });
});

// 6. 底图点击事件（点击底图位置匹配弹窗 + 可视化调试）
const debugLayer = document.getElementById('debug-layer');
let debugRects = []; // 存储所有地点的调试矩形

// 初始化：绘制所有地点的area范围（透明红色矩形）
// 初始化：绘制所有地点的area范围（修改后：不显示任何矩形）
// 初始化：绘制所有地点的area范围（完全透明，不可见）
function drawAllDebugAreas() {
    debugLayer.innerHTML = ''; // 清空之前的矩形
    debugRects = [];
    window.mapPoints?.forEach((point, index) => {
        const area = point.area;
        const rect = document.createElement('div');
        rect.style.position = 'absolute';
        rect.style.left = `${area.left}px`;
        rect.style.top = `${area.top}px`;
        rect.style.width = `${area.right - area.left}px`;
        rect.style.height = `${area.bottom - area.top}px`;
        // 关键修改：边框和背景都设为完全透明（alpha值0）
        rect.style.border = '2px solid rgba(0,0,0,0)'; // 透明边框
        rect.style.backgroundColor = 'rgba(0,0,0,0)'; // 透明背景
        rect.style.pointerEvents = 'none';
        rect.title = point.name; // 鼠标悬浮仍显示地点名称（可选保留）
        debugLayer.appendChild(rect);
        debugRects.push(rect);
    });
}

// 页面加载完成后，初始化调试矩形
window.addEventListener('load', drawAllDebugAreas);

// 底图点击事件（新增：显示点击坐标 + 高亮匹配的范围）
mapContainer.addEventListener('click', (e) => {
    console.log('=== 底图被点击了 ===');
    const rect = mapContainer.getBoundingClientRect();
    const clickX = (e.clientX - rect.left - offsetX) / currentScale;
    const clickY = (e.clientY - rect.top - offsetY) / currentScale;
    console.log('点击的原始坐标：', Math.round(clickX), Math.round(clickY));

    // 高亮匹配的地点范围（红色变橙色，透明度50%）
  // 只判断匹配结果，不修改矩形样式（保持初始化时的完全透明）
let matchedPoint = null;
debugRects.forEach((rect, index) => {
    const point = window.mapPoints[index];
    const area = point.area;
    if (clickX >= area.left && clickX <= area.right && clickY >= area.top && clickY <= area.bottom) {
        matchedPoint = point;
        // 可选：匹配成功时也不高亮（完全透明），删掉下面两行即可
        // rect.style.border = '2px solid rgba(255,165,0,0.5)';
        // rect.style.backgroundColor = 'rgba(255,165,0,0.2)';
    }
    // 删掉else分支！不恢复任何颜色
});

    // 显示弹窗或隐藏
    if (matchedPoint) {
        console.log('匹配成功！', matchedPoint.name);
        showPopup(matchedPoint);
    } else {
        console.log('未匹配到任何地点');
        popup.classList.remove('active');
        setTimeout(() => {
            popup.style.display = 'none';
        }, 300);
    }
});

// 7. 校史分页功能
const pageBtns = document.querySelectorAll('.page-btn');
const historyPages = document.querySelectorAll('.history-page');
const currentPageText = document.getElementById('current-page');
let historyCurrentPage = 1;

function switchHistoryPage(targetPage) {
    historyCurrentPage = targetPage;
    currentPageText.textContent = historyCurrentPage;

    // 切换页面显示
    historyPages.forEach(page => {
        page.style.display = parseInt(page.dataset.page) === historyCurrentPage ? 'flex' : 'none';
    });

    // 切换按钮激活状态
    pageBtns.forEach(btn => {
        if (parseInt(btn.dataset.target) === historyCurrentPage) {
            btn.classList.add('active');
        } else {
            btn.classList.remove('active');
        }
    });
}

// 校史分页按钮点击事件
pageBtns.forEach(btn => {
    btn.addEventListener('click', () => {
        const targetPage = parseInt(btn.dataset.target);
        switchHistoryPage(targetPage);
    });
});

// 初始化校史分页（默认第1页）
switchHistoryPage(1);
// 图片切换：点击右侧按钮切换下一张
document.getElementById('img-next').addEventListener('click', () => {
    if (currentImages.length <= 1) return; // 只有1张图时不切换
    // 索引+1，循环切换（最后一张切回第1张）
    currentImgIndex = (currentImgIndex + 1) % currentImages.length;
    // 更新图片和页码
    document.getElementById('popup-img').src = currentImages[currentImgIndex];
    document.getElementById('img-pagination').textContent = `${currentImgIndex + 1}/${currentImages.length}`;
});

// 优化：点击图片本身也能切换（可选，增强体验）
document.getElementById('popup-img').addEventListener('click', () => {
    document.getElementById('img-next').click(); // 触发右侧按钮的点击事件
});

// 校史页面数字按钮与弹窗功能
document.addEventListener('DOMContentLoaded', function() {
  // 获取元素
  const numberButtons = document.querySelectorAll('.history-number-btn');
  const numberModal = document.querySelector('.history-number-modal');
  const modalText = document.querySelector('.modal-content-text');
  const closeBtn = document.querySelector('.modal-close-btn');
  const pageBtns = document.querySelectorAll('.page-btn');
  const tabBtns = document.querySelectorAll('.tab-btn');
  

  // 数字按钮点击事件：显示对应弹窗
  numberButtons.forEach(btn => {
    btn.addEventListener('click', function() {
      const num = this.getAttribute('data-num');
      const element = document.querySelector(`[data-modal="${num}"]`);
      const text = element.textContent;
      modalText.textContent = text;
      numberModal.style.display = 'flex';
    });
  });

  // 关闭按钮点击事件：隐藏弹窗
  closeBtn.addEventListener('click', function() {
    numberModal.style.display = 'none';
  });

  // 点击弹窗外部关闭弹窗
  numberModal.addEventListener('click', function(e) {
    if (e.target === numberModal) {
      numberModal.style.display = 'none';
    }
  });

  // 切换到校史其他页面（人文/祝福）时，隐藏弹窗
  pageBtns.forEach(btn => {
    btn.addEventListener('click', function() {
      const targetPage = this.getAttribute('data-target');
      if (targetPage !== '1') {
        numberModal.style.display = 'none';
      }
    });
  });

  // 切换到地图板块时，隐藏弹窗
  tabBtns.forEach(btn => {
    btn.addEventListener('click', function() {
      if (this.getAttribute('data-tab') === 'map') {
        numberModal.style.display = 'none';
      }
    });
  });
});