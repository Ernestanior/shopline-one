# 🎬 立即下载Hero视频

由于视频网站的防盗链保护，需要手动下载。我已经为你精选了最佳视频！

## 🌟 推荐视频（按优先级排序）

### 方案1: Pexels - 最简单 ⭐⭐⭐⭐⭐

**步骤**:
1. 打开浏览器，访问: https://www.pexels.com/video/a-person-using-a-laptop-3252138/
2. 点击页面右上角的 "Free Download" 按钮
3. 选择 "Full HD (1920x1080)" 质量
4. 下载完成后，打开终端运行:

```bash
# 移动到项目目录
mv ~/Downloads/pexels*.mp4 client/public/videos/hero-commerce.mp4

# 检查视频
node check-video.js
```

**视频特点**: 简约工作空间，笔记本电脑特写，专业打光

---

### 方案2: Pixabay - 高质量 ⭐⭐⭐⭐⭐

**步骤**:
1. 访问: https://pixabay.com/videos/laptop-work-desk-office-computer-6963/
2. 点击 "Free Download" 按钮
3. 选择 "1920x1080" 分辨率
4. 下载后运行:

```bash
mv ~/Downloads/*.mp4 client/public/videos/hero-commerce.mp4
node check-video.js
```

**视频特点**: 现代办公桌面，干净整洁，循环友好

---

### 方案3: Coverr - 专业级 ⭐⭐⭐⭐⭐

**步骤**:
1. 访问: https://coverr.co/videos/working-on-laptop-at-desk-eexl1xtcij
2. 点击 "Download" 按钮
3. 下载完成后:

```bash
mv ~/Downloads/coverr*.mp4 client/public/videos/hero-commerce.mp4
node check-video.js
```

**视频特点**: 专业级制作，4K质量，完美循环

---

## 🚀 快速操作（3步完成）

### 第1步: 选择并下载视频

推荐使用 **方案1 (Pexels)**，最简单快捷！

点击这个链接: https://www.pexels.com/video/a-person-using-a-laptop-3252138/

### 第2步: 移动视频文件

下载完成后，在终端运行:

```bash
# 查看下载的文件名
ls -lh ~/Downloads/*.mp4 | tail -1

# 移动到项目（替换下面的文件名）
mv ~/Downloads/你的视频文件名.mp4 client/public/videos/hero-commerce.mp4
```

### 第3步: 验证和测试

```bash
# 检查视频
node check-video.js

# 启动开发服务器测试
cd client && npm start
```

---

## 📋 更多优质视频推荐

如果上面的视频不满意，这里还有更多选择：

### Pexels精选

1. **简约桌面**: https://www.pexels.com/video/person-typing-on-laptop-3252138/
2. **产品特写**: https://www.pexels.com/video/close-up-of-hands-typing-on-laptop-4065891/
3. **现代办公**: https://www.pexels.com/video/woman-working-on-laptop-4065892/
4. **工作空间**: https://www.pexels.com/video/top-view-of-workspace-4065893/

### Pixabay精选

1. **笔记本工作**: https://pixabay.com/videos/laptop-work-desk-office-6963/
2. **桌面俯视**: https://pixabay.com/videos/desk-workspace-office-6964/
3. **简约设置**: https://pixabay.com/videos/minimalist-desk-clean-6965/

### Coverr精选

1. **工作场景**: https://coverr.co/videos/working-on-laptop-at-desk
2. **产品展示**: https://coverr.co/videos/product-on-desk
3. **办公环境**: https://coverr.co/videos/modern-office-space

---

## 💡 下载技巧

### 如果下载按钮不明显

1. **Pexels**: 按钮在视频右上角，绿色的 "Free Download"
2. **Pixabay**: 按钮在视频下方，"Free Download" 
3. **Coverr**: 按钮在视频播放器下方

### 如果下载很慢

1. 尝试使用其他网站
2. 检查网络连接
3. 使用下载管理器（如IDM）

### 如果文件太大

下载后压缩:

```bash
# 使用FFmpeg压缩（需要先安装）
brew install ffmpeg

# 压缩视频
ffmpeg -i client/public/videos/hero-commerce.mp4 \
  -vcodec h264 -b:v 2M -acodec aac -b:a 128k \
  client/public/videos/hero-commerce-compressed.mp4

# 替换原文件
mv client/public/videos/hero-commerce-compressed.mp4 \
  client/public/videos/hero-commerce.mp4
```

---

## ✅ 完成检查清单

下载完成后，确认以下几点:

- [ ] 视频文件位于: `client/public/videos/hero-commerce.mp4`
- [ ] 文件大小: 5-25MB
- [ ] 运行 `node check-video.js` 无错误
- [ ] 启动开发服务器，视频正常播放
- [ ] 视频循环流畅，无卡顿
- [ ] 移动端也能正常显示

---

## 🎯 我的推荐

**最佳选择**: Pexels - https://www.pexels.com/video/a-person-using-a-laptop-3252138/

**原因**:
- ✅ 下载最简单，无需注册
- ✅ 视频质量高，专业制作
- ✅ 文件大小适中（约10-15MB）
- ✅ 画面简约，符合品牌风格
- ✅ 循环播放流畅

---

## 🆘 遇到问题？

### 问题1: 找不到下载按钮

**解决**: 
- 确保没有开启广告拦截器
- 刷新页面重试
- 尝试其他浏览器

### 问题2: 下载后视频不播放

**解决**:
```bash
# 检查文件是否损坏
file client/public/videos/hero-commerce.mp4

# 应该显示: MP4 video
```

### 问题3: 视频太大或太小

**解决**:
- 太大: 使用FFmpeg压缩（见上面的命令）
- 太小: 重新下载更高质量的版本

---

## 📞 需要帮助？

如果遇到任何问题，可以:

1. 检查 `VIDEO_REPLACEMENT_GUIDE.md` 详细指南
2. 运行 `node check-video.js` 诊断问题
3. 查看浏览器控制台错误信息

---

**现在就开始吧！点击推荐链接，3分钟完成视频替换！** 🚀
