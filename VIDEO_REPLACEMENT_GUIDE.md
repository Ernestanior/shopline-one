# 🎬 Hero视频替换指南

## 当前视频位置

- **主视频**: `client/public/videos/hero-commerce.mp4`
- **备用视频**: `client/public/videos/mega-menu-preview.mp4`

## 推荐视频来源

### 1. Coverr.co ⭐ (最推荐)

**网址**: https://coverr.co/stock-video-footage/workspace

**优点**:
- 完全免费，无需注册
- 高质量4K视频
- 专业级制作
- 下载简单快捷

**推荐视频类型**:
- Minimalist Desk Setup (简约桌面)
- Product Showcase (产品展示)
- Clean Workspace (干净工作空间)
- Modern Office (现代办公室)

### 2. Pexels Videos

**网址**: https://www.pexels.com/search/videos/minimalist%20workspace/

**优点**:
- 海量视频库
- 免费商用
- 高质量内容

**推荐搜索词**:
- "minimalist workspace"
- "product showcase"
- "desk setup"
- "modern office"

### 3. Pixabay Videos

**网址**: https://pixabay.com/videos/search/workspace/

**优点**:
- 免费4K视频
- 无版权限制
- 多种风格

### 4. Videvo

**网址**: https://www.videvo.net/free-stock-video-footage/workspace/

**优点**:
- 专业级视频
- 部分免费内容

## 视频选择标准

### ✅ 推荐特征

1. **画面质量**
   - 分辨率: 1920x1080 或更高
   - 清晰度: 高清或4K
   - 帧率: 24fps或30fps

2. **视觉风格**
   - 简约、干净的画面
   - 柔和的光线
   - 专业的构图
   - 中性或暖色调

3. **内容主题**
   - 产品特写
   - 工作空间俯视图
   - 简约桌面设置
   - 现代办公环境

4. **动作效果**
   - 慢动作或平滑移动
   - 轻微的平移或旋转
   - 稳定的镜头

5. **技术规格**
   - 时长: 10-30秒
   - 文件大小: 5-20MB
   - 格式: MP4 (H.264编码)
   - 循环播放友好

### ❌ 避免的特征

- 过于杂乱的画面
- 快速移动或抖动
- 低分辨率视频
- 过大的文件 (>50MB)
- 过于鲜艳的颜色
- 分散注意力的元素

## 下载步骤

### 方法1: 从Coverr.co下载 (推荐)

1. 访问 https://coverr.co/stock-video-footage/workspace
2. 浏览视频，找到喜欢的
3. 点击视频进入详情页
4. 点击 "Free Download" 按钮
5. 选择合适的分辨率 (建议1920x1080)
6. 下载完成

### 方法2: 从Pexels下载

1. 访问 https://www.pexels.com/search/videos/minimalist%20workspace/
2. 搜索关键词
3. 点击视频预览
4. 点击 "Download" 按钮
5. 选择 "Full HD" 或 "HD" 质量
6. 下载完成

### 方法3: 从Pixabay下载

1. 访问 https://pixabay.com/videos/search/workspace/
2. 浏览或搜索视频
3. 点击视频
4. 点击 "Free Download" 按钮
5. 选择分辨率
6. 下载完成

## 替换步骤

### 1. 备份当前视频

```bash
# 备份现有视频
cp client/public/videos/hero-commerce.mp4 client/public/videos/hero-commerce.mp4.backup
```

### 2. 重命名新视频

```bash
# 将下载的视频重命名
mv ~/Downloads/your-downloaded-video.mp4 hero-commerce.mp4
```

### 3. 移动到项目目录

```bash
# 移动到正确位置
mv hero-commerce.mp4 client/public/videos/hero-commerce.mp4
```

### 4. 检查视频

```bash
# 运行检查脚本
node check-video.js
```

### 5. 测试视频

```bash
# 启动开发服务器
cd client
npm start

# 访问 http://localhost:3000
# 检查hero section的视频是否正常播放
```

## 视频优化

### 如果视频文件太大

#### 使用FFmpeg压缩 (推荐)

```bash
# 安装FFmpeg (macOS)
brew install ffmpeg

# 压缩视频
ffmpeg -i input.mp4 -vcodec h264 -acodec aac -b:v 2M -b:a 128k hero-commerce.mp4
```

#### 使用在线工具

1. **FreeConvert**
   - 网址: https://www.freeconvert.com/video-compressor
   - 上传视频
   - 选择压缩质量
   - 下载压缩后的文件

2. **VideoSmaller**
   - 网址: https://www.videosmaller.com/
   - 上传视频
   - 选择压缩选项
   - 下载结果

### 调整视频尺寸

```bash
# 调整为1920x1080
ffmpeg -i input.mp4 -vf scale=1920:1080 -c:a copy hero-commerce.mp4
```

### 裁剪视频长度

```bash
# 裁剪前15秒
ffmpeg -i input.mp4 -t 15 -c copy hero-commerce.mp4
```

## 推荐视频风格示例

### 风格1: Minimalist Product Showcase

**特点**:
- 产品在简约背景上的特写
- 柔和的旋转或平移
- 专业的打光
- 浅色背景

**适合场景**: 产品展示、品牌宣传

### 风格2: Clean Desk Setup

**特点**:
- 整洁的桌面俯视图
- 笔记本、咖啡、笔记本等元素
- 自然光线
- 温馨氛围

**适合场景**: 工作场景、生活方式

### 风格3: Modern Workspace

**特点**:
- 现代办公环境
- 简约设计元素
- 专业氛围
- 科技感

**适合场景**: 企业形象、专业服务

### 风格4: Product in Motion

**特点**:
- 产品的动态展示
- 慢动作特写
- 细节展示
- 高端质感

**适合场景**: 高端产品、奢侈品

## 视频规格建议

### 最佳规格

```
分辨率: 1920x1080 (Full HD)
帧率: 30fps
编码: H.264
音频: 无 (或静音)
时长: 15-20秒
文件大小: 8-15MB
比特率: 2-4 Mbps
```

### 可接受规格

```
分辨率: 1280x720 (HD) 或更高
帧率: 24fps 或 30fps
编码: H.264 或 H.265
时长: 10-30秒
文件大小: 5-25MB
```

## 常见问题

### Q: 视频不播放？

**A**: 检查以下几点:
1. 文件路径是否正确
2. 文件格式是否为MP4
3. 浏览器是否支持视频格式
4. 检查浏览器控制台错误

### Q: 视频加载太慢？

**A**: 
1. 压缩视频文件
2. 降低视频分辨率
3. 使用CDN托管视频

### Q: 视频循环不流畅？

**A**:
1. 确保视频首尾帧相似
2. 使用循环友好的视频
3. 调整视频时长

### Q: 移动端视频不显示？

**A**:
1. 检查移动端是否启用了视频播放
2. 确保视频文件不太大
3. 提供fallback图片

## 测试清单

完成替换后，请检查:

- [ ] 视频文件存在于正确位置
- [ ] 文件大小合适 (5-20MB)
- [ ] 桌面浏览器正常播放
- [ ] 移动端正常显示
- [ ] 视频循环流畅
- [ ] 加载速度快
- [ ] 视觉效果符合品牌风格
- [ ] 没有版权问题

## 备用方案

如果找不到合适的视频，可以使用静态图片替代：

```tsx
// 在 Home.tsx 中
const [videoOk, setVideoOk] = useState(false); // 改为false

// 这样会自动显示fallback图片
```

## 相关文件

- `client/src/pages/Home.tsx` - Hero section代码
- `client/public/videos/hero-commerce.mp4` - 主视频
- `client/public/videos/mega-menu-preview.mp4` - 备用视频
- `check-video.js` - 视频检查脚本
- `download-hero-video.js` - 下载指南脚本

## 快速链接

- **Coverr Workspace**: https://coverr.co/stock-video-footage/workspace
- **Pexels Workspace**: https://www.pexels.com/search/videos/minimalist%20workspace/
- **Pixabay Workspace**: https://pixabay.com/videos/search/workspace/
- **Videvo Workspace**: https://www.videvo.net/free-stock-video-footage/workspace/

## 总结

选择一个高质量的hero视频可以显著提升网站的专业度和视觉吸引力。建议选择简约、专业的视频，避免过于复杂或分散注意力的内容。

祝你找到完美的视频！🎬✨
