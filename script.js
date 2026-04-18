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
const jsonStatus = document.getElementById('json-status');
const jsonError = document.getElementById('json-error');

let currentMode = 'standard'; 
let lastValidFlexJson = null;

async function init() {
    try {
        await liff.init({ liffId });
        if (!liff.isLoggedIn()) {
            liff.login();
        } else {
            loadUserProfile();
        }
        // Initialize Templates from External Files
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
        const templates = await response.json();
        
        templateSelect.innerHTML = '<option value="">--- 請選擇範本 ---</option>';
        templates.forEach(tpl => {
            const option = document.createElement('option');
            option.value = tpl.file;
            option.textContent = tpl.name;
            templateSelect.appendChild(option);
        });
        
        const customOption = document.createElement('option');
        customOption.value = "CUSTOM_EMPTY";
        customOption.textContent = "✨ 自定義 (清空內容)";
        templateSelect.appendChild(customOption);
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
        previewText.innerHTML = '<span style="color:var(--primary)">✨ Flex Message 模式已啟動</span><br><small>格式驗證後即可發送</small>';
        sendBtn.disabled = !lastValidFlexJson;
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
        jsonStatus.classList.add('hidden');
        jsonError.classList.add('hidden');
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
        } else if (Array.isArray(jsonObj) && jsonObj[0].type === 'flex') {
            lastValidFlexJson = jsonObj[0];
        } else {
            throw new Error('Invalid format');
        }
        jsonStatus.classList.remove('hidden');
        jsonError.classList.add('hidden');
    } catch (e) {
        jsonStatus.classList.add('hidden');
        jsonError.classList.remove('hidden');
        lastValidFlexJson = null;
    }
    updatePreview();
}

async function loadTemplate(fileName) {
    if (!fileName) return;
    
    if (fileName === "CUSTOM_EMPTY") {
        flexJsonInput.value = "";
        validateFlexJson();
        return;
    }

    try {
        const response = await fetch(`templates/${fileName}`);
        if (!response.ok) throw new Error('Network response was not ok');
        const content = await response.json();
        flexJsonInput.value = JSON.stringify(content, null, 2);
        validateFlexJson();
    } catch (err) {
        console.error('Failed to load template file:', err);
        alert('範本檔案讀取失敗，請檢查資料夾中是否存在該檔案。');
    }
}

// Event Listeners
templateSelect.addEventListener('change', (e) => loadTemplate(e.target.value));
msgInput.addEventListener('input', updatePreview);
flexJsonInput.addEventListener('input', validateFlexJson);
tabBtns.forEach(btn => btn.addEventListener('click', () => handleTabSwitch(btn)));
dropZone.addEventListener('click', () => imageInput.click());
imageInput.addEventListener('change', (e) => handleFileSelect(e.target.files[0]));
sendBtn.addEventListener('click', startForwarding);
logoutBtn.addEventListener('click', () => { liff.logout(); location.reload(); });

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

init();
