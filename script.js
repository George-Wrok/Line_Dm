/**
 * Main Logic for LINE DM | 快速群發助手
 */

const liffId = '2009827667-om3Bmciu';
let currentImageUrl = null;
let selectedFile = null;

// DOM Elements
const msgInput = document.getElementById('message-input');
const imageInput = document.getElementById('image-input');
const dropZone = document.getElementById('drop-zone');
const previewText = document.getElementById('preview-text');
const previewMsgImg = document.getElementById('msg-img-preview');
const previewImageBox = document.getElementById('preview-image-box');
const sendBtn = document.getElementById('send-btn');
const loading = document.getElementById('loading');
const imagePreview = document.getElementById('image-preview');
const uploadPlaceholder = document.querySelector('.upload-placeholder');
const removeImgBtn = document.getElementById('remove-img');

const userProfileBox = document.getElementById('user-profile');
const userImg = document.getElementById('user-img');
const userName = document.getElementById('user-name');
const logoutBtn = document.getElementById('logout-btn');

// Mode Tabs & Template Elements
const tabBtns = document.querySelectorAll('.tab-btn');
const standardContent = document.getElementById('standard-mode-content');
const flexContent = document.getElementById('flex-mode-content');
const flexJsonInput = document.getElementById('flex-json-input');
const templateSelect = document.getElementById('template-select');
const templateInfoCard = document.getElementById('template-info-card');
const templateDesc = document.getElementById('template-desc');

let currentMode = 'standard'; 
let lastValidFlexJson = null;
let templateData = []; // Store registry info

async function init() {
    try {
        await liff.init({ liffId });
        if (!liff.isLoggedIn()) {
            liff.login();
        } else {
            loadUserProfile();
        }
        await initTemplates();
    } catch (err) {
        console.error('LIFF Init Error:', err);
    }
}

/**
 * Fetch the registry and populate the dropdown
 */
async function initTemplates() {
    try {
        const response = await fetch('templates/registry.json');
        templateData = await response.json();
        
        templateSelect.innerHTML = '<option value="">--- 請選擇範本 ---</option>';
        templateData.forEach((tpl, index) => {
            const option = document.createElement('option');
            option.value = index; // Store index to access full data
            option.textContent = tpl.name;
            templateSelect.appendChild(option);
        });
    } catch (err) {
        console.error('Failed to load templates:', err);
        templateSelect.innerHTML = '<option value="">❌ 範本載入失敗</option>';
    }
}

async function loadUserProfile() {
    try {
        const profile = await liff.getProfile();
        userProfileBox.classList.remove('hidden');
        userImg.src = profile.pictureUrl;
        userName.textContent = profile.displayName;
    } catch (err) {
        console.error('Profile Load Error:', err);
    }
}

function updatePreview() {
    if (currentMode === 'standard') {
        const text = msgInput.value;
        previewText.textContent = text || '您的訊息預覽會顯示在這裡...';
        sendBtn.disabled = !(text.trim() || selectedFile);
    } else {
        if (lastValidFlexJson) {
            renderFlexPreview(lastValidFlexJson.contents);
        } else {
            previewText.innerHTML = '<div style="padding:20px; text-align:center; color:#888;">請選擇上方範本以檢視樣式</div>';
        }
        sendBtn.disabled = !lastValidFlexJson;
    }
}

/**
 * Upgraded Flex Message Preview Renderer (Recursive)
 */
function renderFlexPreview(contents) {
    let bubble = contents;
    if (contents.type === 'carousel') {
        bubble = contents.contents[0];
    }
    
    let html = '<div class="flex-preview-root" style="border-radius:12px; overflow:hidden; background:#fff;">';
    
    // Header
    if (bubble.header) {
        const h = bubble.header;
        const hPad = h.paddingAll || '0px';
        const hBg = h.backgroundColor || 'transparent';
        html += `<div style="padding:${hPad}; background:${hBg}; position:relative; overflow:hidden;">${parseComponent(h.contents)}</div>`;
    }
    
    // Hero
    if (bubble.hero) {
        html += parseComponent(bubble.hero);
    }
    
    // Body
    if (bubble.body) {
        const b = bubble.body;
        const bPad = b.paddingAll || '20px';
        const bBg = b.backgroundColor || '#ffffff';
        html += `<div style="padding:${bPad}; background:${bBg}; position:relative; overflow:hidden;">${parseComponent(b.contents)}</div>`;
    }
    
    // Footer
    if (bubble.footer) {
        const f = bubble.footer;
        const fPad = f.paddingAll || '12px';
        const fBg = f.backgroundColor || 'transparent';
        html += `<div style="padding:${fPad}; background:${fBg};">${parseComponent(f.contents)}</div>`;
    }
    
    html += '</div>';
    previewText.innerHTML = html;
}

/**
 * Recursive Parser for Flex Components
 */
function parseComponent(item) {
    if (!item) return '';
    
    if (Array.isArray(item)) {
        return item.map(sub => parseComponent(sub)).join('');
    }

    // 將 LINE 的 offset 轉換為 CSS，支援 px、% 等
    const getOffset = (val) => val ? val : 'auto';
    const isAbsolute = item.position === 'absolute';
    
    let baseStyle = '';
    if (isAbsolute) {
        baseStyle += `position: absolute; `;
        if (item.offsetTop) baseStyle += `top: ${item.offsetTop}; `;
        if (item.offsetBottom) baseStyle += `bottom: ${item.offsetBottom}; `;
        if (item.offsetStart) baseStyle += `left: ${item.offsetStart}; `;
        if (item.offsetEnd) baseStyle += `right: ${item.offsetEnd}; `;
    } else {
        baseStyle += `position: relative; `; // 讓子元素的 absolute 參考此層
    }

    if (item.backgroundColor) baseStyle += `background-color: ${item.backgroundColor}; `;
    if (item.cornerRadius) baseStyle += `border-radius: ${item.cornerRadius}; `;
    
    // Padding 處理
    if (item.paddingAll) {
        baseStyle += `padding: ${item.paddingAll}; `;
    } else {
        if (item.paddingTop) baseStyle += `padding-top: ${item.paddingTop}; `;
        if (item.paddingBottom) baseStyle += `padding-bottom: ${item.paddingBottom}; `;
        if (item.paddingStart) baseStyle += `padding-left: ${item.paddingStart}; `;
        if (item.paddingEnd) baseStyle += `padding-right: ${item.paddingEnd}; `;
    }

    // Width/Height 處理
    if (item.width) baseStyle += `width: ${item.width}; `;
    if (item.height) baseStyle += `height: ${item.height}; `;
    if (item.margin) {
        const marginMap = { 'xs': '2px', 'sm': '4px', 'md': '8px', 'lg': '12px', 'xl': '16px', 'xxl': '20px' };
        baseStyle += `margin-top: ${marginMap[item.margin] || item.margin}; `;
    }
    if (item.flex !== undefined && item.flex > 0) {
        baseStyle += `flex: ${item.flex}; `;
    }

    switch (item.type) {
        case 'box':
            const isHorizontal = item.layout === 'horizontal' || item.layout === 'baseline';
            const alignItems = item.layout === 'baseline' ? 'baseline' : 'stretch';
            const spacingMap = { 'xs': '2px', 'sm': '4px', 'md': '8px', 'lg': '12px', 'xl': '16px', 'xxl': '20px' };
            const gap = item.spacing ? (spacingMap[item.spacing] || item.spacing) : '0px';
            
            return `<div class="flex-box-${item.layout}" style="display:flex; flex-direction:${isHorizontal ? 'row' : 'column'}; align-items:${alignItems}; gap:${gap}; ${baseStyle} overflow:hidden;">
                ${parseComponent(item.contents)}
            </div>`;
            
        case 'text':
            const sizeMap = { 'xxs': '0.6rem', 'xs': '0.7rem', 'sm': '0.8rem', 'md': '0.9rem', 'lg': '1rem', 'xl': '1.1rem', 'xxl': '1.3rem', '3xl': '1.6rem' };
            const weight = item.weight === 'bold' ? 'bold' : 'normal';
            const align = item.align || 'left';
            const deco = item.decoration || 'none';
            baseStyle += `color: ${item.color || 'inherit'}; font-size: ${sizeMap[item.size] || item.size || '0.9rem'}; font-weight: ${weight}; text-align: ${align}; text-decoration: ${deco}; `;
            if (item.wrap) baseStyle += `white-space: pre-wrap; word-break: break-word; `;
            else baseStyle += `white-space: nowrap; overflow: hidden; text-overflow: ellipsis; `;
            
            return `<div class="flex-text" style="${baseStyle}">${item.text || ''}</div>`;
            
        case 'image':
            let imgStyle = `width:100%; display:block; object-fit:${item.aspectMode === 'cover' ? 'cover' : 'contain'}; ${baseStyle}`;
            if (item.aspectRatio) {
                const ratio = item.aspectRatio.replace(':', '/');
                imgStyle += `aspect-ratio: ${ratio}; `;
            } else {
                imgStyle += `aspect-ratio: 1/1; `;
            }
            return `<img src="${item.url}" style="${imgStyle}" />`;
            
        case 'button':
            return `<div class="flex-preview-btn" style="background:${item.style === 'primary' ? 'var(--primary)' : '#eee'}; color:${item.style === 'primary' ? '#fff' : '#333'}; padding: 8px; text-align: center; border-radius: 6px; font-weight: bold; cursor:pointer; ${baseStyle}">
                ${item.action ? item.action.label : 'Button'}
            </div>`;
            
        case 'icon':
            const iconSizeMap = { 'xxs': '12px', 'xs': '16px', 'sm': '20px', 'md': '24px', 'lg': '28px', 'xl': '32px', 'xxl': '40px', '3xl': '48px' };
            const iconSize = iconSizeMap[item.size] || item.size || '24px';
            return `<img src="${item.url}" style="width:${iconSize}; height:${iconSize}; object-fit:contain; ${baseStyle}" />`;
            
        case 'separator':
            return `<div style="height:1px; background-color:${item.color || '#eeeeee'}; margin:${item.margin ? '8px' : '4px'} 0; ${baseStyle}"></div>`;
            
        case 'filler':
            return `<div style="flex-grow:1; ${baseStyle}"></div>`;
            
        default:
            if (item.contents) return `<div style="${baseStyle}">${parseComponent(item.contents)}</div>`;
            return '';
    }
}

function handleTabSwitch(btn) {
    const mode = btn.dataset.mode;
    currentMode = mode;
    tabBtns.forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    
    if (mode === 'standard') {
        standardContent.classList.remove('hidden');
        flexContent.classList.add('hidden');
        previewImageBox.classList.toggle('hidden', !selectedFile);
    } else {
        standardContent.classList.add('hidden');
        flexContent.classList.remove('hidden');
        previewImageBox.classList.add('hidden');
    }
    updatePreview();
}

function validateFlexJson() {
    const rawVal = flexJsonInput.value.trim();
    if (!rawVal) {
        lastValidFlexJson = null;
        updatePreview();
        return;
    }

    try {
        let jsonObj = JSON.parse(rawVal);
        if (jsonObj.type === 'bubble' || jsonObj.type === 'carousel') {
            lastValidFlexJson = { type: 'flex', altText: '您收到了一則 Flex Message', contents: jsonObj };
        } else if (jsonObj.type === 'flex') {
            lastValidFlexJson = jsonObj;
        } else {
            throw new Error('Invalid format');
        }
    } catch (e) {
        lastValidFlexJson = null;
    }
    updatePreview();
}

async function loadTemplate(index) {
    if (index === "") {
        templateInfoCard.classList.add('hidden');
        flexJsonInput.value = "";
        validateFlexJson();
        return;
    }
    
    const tpl = templateData[index];
    templateDesc.textContent = tpl.desc || "無可用介紹。";
    templateInfoCard.classList.remove('hidden');

    try {
        const response = await fetch(`templates/${tpl.file}`);
        if (!response.ok) throw new Error('Network response was not ok');
        const content = await response.json();
        flexJsonInput.value = JSON.stringify(content, null, 2);
        validateFlexJson();
    } catch (err) {
        console.error('Failed to load template file:', err);
        alert('範本檔案讀取失敗');
    }
}

// Event Listeners
templateSelect.addEventListener('change', (e) => loadTemplate(e.target.value));
msgInput.addEventListener('input', updatePreview);
tabBtns.forEach(btn => btn.addEventListener('click', () => handleTabSwitch(btn)));
dropZone.addEventListener('click', () => imageInput.click());
imageInput.addEventListener('change', (e) => handleFileSelect(e.target.files[0]));
sendBtn.addEventListener('click', startForwarding);
logoutBtn.addEventListener('click', () => { liff.logout(); location.reload(); });
removeImgBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    removeImage();
});

async function handleFileSelect(file) {
    if (!file) return;
    selectedFile = file;
    const dataUrl = await window.Uploader.readAsDataURL(file);
    imagePreview.src = dataUrl;
    imagePreview.classList.remove('hidden');
    uploadPlaceholder.classList.add('hidden');
    removeImgBtn.classList.remove('hidden');
    previewMsgImg.src = dataUrl;
    if (currentMode === 'standard') previewImageBox.classList.remove('hidden');
    updatePreview();
}

async function startForwarding() {
    if (!liff.isLoggedIn()) { liff.login(); return; }
    loading.classList.remove('hidden');
    try {
        let messages = [];
        if (currentMode === 'standard') {
            if (selectedFile) {
                currentImageUrl = await window.Uploader.uploadToImgBB(selectedFile);
                messages.push({ type: 'image', originalContentUrl: currentImageUrl, previewImageUrl: currentImageUrl });
            }
            if (msgInput.value.trim()) messages.push({ type: 'text', text: msgInput.value.trim() });
        } else {
            if (!lastValidFlexJson) throw new Error('請先輸入正確的 Flex JSON');
            messages = [lastValidFlexJson];
        }
        if (messages.length === 0) return;
        if (liff.isApiAvailable('shareTargetPicker')) {
            const res = await liff.shareTargetPicker(messages);
            if (res) alert('已成功送出！');
        } else {
            alert('不支援 shareTargetPicker');
        }
    } catch (err) {
        alert('錯誤：' + err.message);
    } finally {
        loading.classList.add('hidden');
    }
}

function removeImage() {
    selectedFile = null;
    if (imageInput) imageInput.value = '';
    imagePreview.src = '';
    imagePreview.classList.add('hidden');
    uploadPlaceholder.classList.remove('hidden');
    removeImgBtn.classList.add('hidden');
    previewMsgImg.src = '';
    previewImageBox.classList.add('hidden');
    updatePreview();
}

init();
