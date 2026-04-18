/**
 * Image Uploader Module for LINE EDM Pro
 * Handles local image selection and uploading to ImgBB (LINE requires HTTPS URLs)
 */

const Uploader = {
    // ImgBB API Key (Provided by user)
    apiKey: '564a8db97fa5a90f2be3d1ed5ede570d', 

    /**
     * Upload an image file to ImgBB
     * @param {File} file 
     * @returns {Promise<string>} The direct image URL
     */
    async uploadToImgBB(file) {
        if (!this.apiKey) {
            throw new Error('未設定 ImgBB API Key');
        }

        const formData = new FormData();
        formData.append('image', file);

        try {
            // ImgBB API endpoint: https://api.imgbb.com/1/upload
            const response = await fetch(`https://api.imgbb.com/1/upload?key=${this.apiKey}`, {
                method: 'POST',
                body: formData
            });

            const data = await response.json();
            if (data.success) {
                // data.data.url is the direct image link
                return data.data.url;
            } else {
                throw new Error(data.error.message || 'ImgBB 上傳失敗');
            }
        } catch (error) {
            console.error('ImgBB Upload Error:', error);
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
