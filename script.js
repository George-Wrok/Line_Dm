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
 * Upgraded Flex Message Preview Renderer (Professional Version)
 */
function renderFlexPreview(contents) {
    let bubble = contents;
    if (contents.type === 'carousel') {
        bubble = contents.contents[0]; 
    }
    
    // 渲染 Bubble 主體
    const bg = bubble.styles && bubble.styles.body ? bubble.styles.body.backgroundColor : (bubble.backgroundColor || '#fff');
    let html = `<div class="flex-preview-root" style="background-color: ${bg}; position: relative; display: flex; flex-direction: column;">`;
    
    // 1. Header
    if (bubble.header) {
        html += `<div class="flex-preview-header" style="${getBoxStyle(bubble.header)}">${parseComponent(bubble.header)}</div>`;
    }
    
    // 2. Hero
    if (bubble.hero) {
        html += `<div class="flex-preview-hero-container">${parseComponent(bubble.hero)}</div>`;
    }
    
    // 3. Body
    if (bubble.body) {
        html += `<div class="flex-preview-body" style="${getBoxStyle(bubble.body)}">${parseComponent(bubble.body)}</div>`;
    }
    
    // 4. Footer
    if (bubble.footer) {
        html += `<div class="flex-preview-footer" style="${getBoxStyle(bubble.footer)}">${parseComponent(bubble.footer)}</div>`;
    }
    
    html += '</div>';
    previewText.innerHTML = html;
}

function getBoxStyle(box) {
    if (!box) return '';
    const bg = box.backgroundColor ? `background-color: ${box.backgroundColor};` : '';
    const pad = box.paddingAll ? `padding: ${parseInt(box.paddingAll)}px;` : 'padding: 12px;';
    return `${bg} ${pad}`;
}

/**
 * Recursive Parser for Flex Components (V3)
 */
function parseComponent(item) {
    if (!item) return '';
    if (Array.isArray(item)) return item.map(sub => parseComponent(sub)).join('');
    if (item.contents && item.type !== 'text') return parseComponent(item.contents);

    const commonStyle = `
        flex: ${item.flex !== undefined ? item.flex : 'none'};
        margin-top: ${item.margin ? '8px' : '0'};
    `;

    switch (item.type) {
        case 'box':
            const layout = item.layout === 'horizontal' ? 'row' : 'column';
            const align = item.alignItems ? `align-items: ${item.alignItems};` : '';
            const justify = item.justifyContent ? `justify-content: ${item.justifyContent};` : '';
            const boxBg = item.backgroundColor ? `background-color: ${item.backgroundColor}; padding: 8px; border-radius: 4px;` : '';
            return `<div class="flex-box" style="display:flex; flex-direction:${layout}; ${align} ${justify} ${boxBg} gap:4px; ${commonStyle}">
                ${parseComponent(item.contents)}
            </div>`;
            
        case 'text':
            const tStyle = `
                color: ${item.color || 'inherit'};
                font-size: ${getTextSize(item.size)};
                font-weight: ${item.weight === 'bold' ? 'bold' : 'normal'};
                text-align: ${item.align || 'left'};
                white-space: ${item.wrap ? 'normal' : 'nowrap'};
                ${commonStyle}
            `;
            return `<div style="${tStyle}">${item.text || ''}</div>`;
            
        case 'image':
            const ratio = item.aspectRatio ? item.aspectRatio.replace(':', '/') : '1/1';
            return `<img src="${item.url}" style="width:100%; aspect-ratio:${ratio}; object-fit:${item.aspectMode || 'cover'}; border-radius: 4px; ${commonStyle}" />`;
            
        case 'button':
            return `<div class="flex-preview-btn" style="background:${item.style === 'primary' ? 'var(--primary)' : '#eee'}; color:${item.style === 'primary' ? '#fff' : '#333'}; ${commonStyle}">
                ${item.action ? item.action.label : '按鈕'}
            </div>`;
            
        case 'separator':
            return `<hr style="border:none; border-top:1px solid #ddd; width:100%; margin:8px 0;" />`;
            
        default:
            return '';
    }
}

function getTextSize(size) {
    const map = { 'xxs': '0.6rem', 'xs': '0.7rem', 'sm': '0.8rem', 'md': '0.9rem', 'lg': '1rem', 'xl': '1.1rem', 'xxl': '1.3rem' };
    return map[size] || '0.85rem';
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
