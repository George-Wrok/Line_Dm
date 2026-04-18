/**
 * Main Logic for LINE EDM Pro
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

async function init() {
    try {
        await liff.init({ liffId });
        if (!liff.isLoggedIn()) {
            liff.login();
        } else {
            loadUserProfile();
        }
    } catch (err) {
        console.error('LIFF Init Error:', err);
        alert('LIFF 初始化失敗，請檢查設定或重新整理');
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
    const text = msgInput.value;
    previewText.textContent = text || '您的訊息預覽會顯示在這裡...';
    
    // Enable/Disable send button
    sendBtn.disabled = !(text.trim() || selectedFile);
}

async function handleFileSelect(file) {
    if (!file) return;
    
    selectedFile = file;
    const dataUrl = await window.Uploader.readAsDataURL(file);
    
    // Show in Editor
    imagePreview.src = dataUrl;
    imagePreview.classList.remove('hidden');
    uploadPlaceholder.classList.add('hidden');
    removeImgBtn.classList.remove('hidden');
    
    // Show in Preview
    previewMsgImg.src = dataUrl;
    previewImageBox.classList.remove('hidden');
    
    updatePreview();
}

function removeImage() {
    selectedFile = null;
    currentImageUrl = null;
    imagePreview.src = '';
    imagePreview.classList.add('hidden');
    uploadPlaceholder.classList.remove('hidden');
    removeImgBtn.classList.add('hidden');
    
    previewMsgImg.src = '';
    previewImageBox.classList.add('hidden');
    updatePreview();
}

/**
 * The core forwarding logic
 */
async function startForwarding() {
    const text = msgInput.value.trim();
    
    if (!liff.isLoggedIn()) {
        liff.login();
        return;
    }

    loading.classList.remove('hidden');
    
    try {
        const messages = [];
        
        // 1. If there's an image, upload it first
        if (selectedFile) {
            currentImageUrl = await window.Uploader.uploadToImgBB(selectedFile);
            messages.push({
                type: 'image',
                originalContentUrl: currentImageUrl,
                previewImageUrl: currentImageUrl
            });
        }
        
        // 2. Add text message
        if (text) {
            messages.push({
                type: 'text',
                text: text
            });
        }

        if (messages.length === 0) return;

        // 3. Trigger Share Target Picker
        if (liff.isApiAvailable('shareTargetPicker')) {
            const res = await liff.shareTargetPicker(messages);
            if (res) {
                console.log('Successfully shared');
                alert('已成功送出！您也可以繼續發送給下一組人。');
            } else {
                console.log('Share canceled');
            }
        } else {
            alert('您的 LINE 版本不支援 shareTargetPicker 或未開啟該功能。');
        }
    } catch (err) {
        console.error('Send Error:', err);
        alert('發送過程中發生錯誤：' + err.message);
    } finally {
        loading.classList.add('hidden');
    }
}

// Event Listeners
msgInput.addEventListener('input', updatePreview);

dropZone.addEventListener('click', () => imageInput.click());
imageInput.addEventListener('change', (e) => handleFileSelect(e.target.files[0]));

dropZone.addEventListener('dragover', (e) => {
    e.preventDefault();
    dropZone.classList.add('drag-active');
});

dropZone.addEventListener('dragleave', () => dropZone.classList.remove('drag-active'));

dropZone.addEventListener('drop', (e) => {
    e.preventDefault();
    dropZone.classList.remove('drag-active');
    handleFileSelect(e.dataTransfer.files[0]);
});

removeImgBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    removeImage();
});

sendBtn.addEventListener('click', startForwarding);

logoutBtn.addEventListener('click', () => {
    liff.logout();
    location.reload();
});

// Start the APP
init();
