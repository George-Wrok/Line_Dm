/**
 * Image Uploader Module for LINE EDM Pro
 * Handles local image selection and uploading to a remote URL (LINE requires HTTPS URLs)
 */

const Uploader = {
    // You can replace this with your own Imgur Client ID
    // Register one at: https://api.imgur.com/oauth2/addclient
    clientId: '', 

    /**
     * Upload an image file to Imgur
     * @param {File} file 
     * @returns {Promise<string>} The direct image URL
     */
    async uploadToImgur(file) {
        if (!this.clientId) {
            throw new Error('請先在設定中輸入 Imgur Client ID，或聯絡開發者。');
        }

        const formData = new FormData();
        formData.append('image', file);

        try {
            const response = await fetch('https://api.imgur.com/3/image', {
                method: 'POST',
                headers: {
                    Authorization: `Client-ID ${this.clientId}`
                },
                body: formData
            });

            const data = await response.json();
            if (data.success) {
                return data.data.link;
            } else {
                throw new Error(data.data.error || '上傳失敗');
            }
        } catch (error) {
            console.error('Upload Error:', error);
            throw error;
        }
    },

    /**
     * Utility to read file as DataURL for local preview
     */
    readAsDataURL(file) {
        return new Promise((resolve) => {
            const reader = new FileReader();
            reader.onload = (e) => resolve(e.target.result);
            reader.readAsDataURL(file);
        });
    }
};

window.Uploader = Uploader;
