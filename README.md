# LINE EDM Pro 使用手冊

本工具幫助您快速將促銷文案與圖片轉傳給多位 LINE 好友。

## 如何開始使用？

### 1. 部署網頁 (重要)
LINE 的群發功能要求網頁必須建立在 **HTTPS** 協定下。您可以選擇以下免費平台部署：
- **GitHub Pages**: 將本資料夾上傳至 GitHub 儲存庫並開啟 Pages 服務。
- **Vercel / Netlify**: 拖拽資料夾即可完成部署。

### 2. 回到 LINE Developers 設定
部署成功後，您會得到一個網址 (例如 `https://your-name.github.io/LINE_EDM/`)。
請回到您的 LINE Developers 後台：
- 進入您的 **LIFF App** 設定頁面。
- 找到 **Endpoint URL**，將原本填的 google.com 改成您**正式的部署網址**。

### 3. 加入圖片功能 (Imgur ID)
為了能發送圖片檔案，程式使用了 Imgur 服務。
- 第一次發送圖片時，網頁會詢問您的 **Imgur Client ID**。
- 您可以到 [Imgur API 註冊頁面](https://api.imgur.com/oauth2/addclient) 免費申請一個。
- 申請時選擇 "Anonymous usage without user authorization" 即可。

## 操作流程
1. 打開網頁。
2. 登入 LINE（若是在 LINE 內點開會自動登入）。
3. 輸入文案、上傳圖片。
4. 點擊 **"開始群發"**。
5. 在跳出的選單中勾選好友（一次可多選 10-15 位）。
6. 送出後，若還有客戶要傳，再次點擊按鈕即可（目前的文案會保留，不用重新打）。

---
**祝您行銷順利！**
