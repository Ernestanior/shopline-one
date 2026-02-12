#!/usr/bin/env node

/**
 * 下载高质量Hero视频
 * 
 * 推荐视频来源:
 * 1. Coverr.co - https://coverr.co/stock-video-footage/workspace
 * 2. Pexels - https://www.pexels.com/search/videos/minimalist%20workspace/
 * 3. Pixabay - https://pixabay.com/videos/search/workspace/
 * 
 * 推荐搜索关键词:
 * - "minimalist workspace"
 * - "product showcase"
 * - "desk setup"
 * - "modern office"
 * - "clean workspace"
 * - "premium product"
 */

const https = require('https');
const http = require('http');
const fs = require('fs');
const path = require('path');
const { URL } = require('url');

console.log('🎬 Hero视频下载指南\n');
console.log('由于视频网站的下载限制，请按以下步骤手动下载:\n');

console.log('📋 推荐视频网站:\n');

console.log('1️⃣ Coverr.co (推荐)');
console.log('   网址: https://coverr.co/stock-video-footage/workspace');
console.log('   特点: 高质量4K视频，完全免费，无需注册');
console.log('   推荐视频:');
console.log('   - "Minimalist Desk Setup" - 简约桌面设置');
console.log('   - "Product on Desk" - 产品展示');
console.log('   - "Clean Workspace" - 干净的工作空间');
console.log('   - "Modern Office" - 现代办公室\n');

console.log('2️⃣ Pexels Videos');
console.log('   网址: https://www.pexels.com/search/videos/minimalist%20workspace/');
console.log('   特点: 海量高质量视频，免费商用');
console.log('   推荐搜索: "minimalist workspace", "product showcase"\n');

console.log('3️⃣ Pixabay Videos');
console.log('   网址: https://pixabay.com/videos/search/workspace/');
console.log('   特点: 免费4K视频，无版权限制\n');

console.log('4️⃣ Videvo');
console.log('   网址: https://www.videvo.net/free-stock-video-footage/workspace/');
console.log('   特点: 专业级视频，部分免费\n');

console.log('📝 下载步骤:\n');
console.log('1. 访问上述任一网站');
console.log('2. 搜索关键词: "minimalist workspace" 或 "product showcase"');
console.log('3. 选择一个高质量视频 (建议1920x1080或更高)');
console.log('4. 下载视频文件 (MP4格式)');
console.log('5. 将视频重命名为: hero-commerce.mp4');
console.log('6. 将文件移动到: client/public/videos/hero-commerce.mp4\n');

console.log('💡 视频选择建议:\n');
console.log('✅ 推荐特征:');
console.log('   - 简约、干净的画面');
console.log('   - 柔和的光线');
console.log('   - 产品或工作空间特写');
console.log('   - 慢动作或平滑移动');
console.log('   - 专业的构图');
console.log('   - 时长: 10-30秒');
console.log('   - 分辨率: 1920x1080 或更高');
console.log('   - 文件大小: 5-20MB\n');

console.log('❌ 避免:');
console.log('   - 过于杂乱的画面');
console.log('   - 快速移动或抖动');
console.log('   - 低分辨率视频');
console.log('   - 过大的文件 (>50MB)\n');

console.log('🎨 推荐视频风格:\n');
console.log('1. "Minimalist Product Showcase"');
console.log('   - 产品在简约背景上的特写');
console.log('   - 柔和的旋转或平移');
console.log('   - 专业的打光\n');

console.log('2. "Clean Desk Setup"');
console.log('   - 整洁的桌面俯视图');
console.log('   - 笔记本、咖啡、笔记本等元素');
console.log('   - 自然光线\n');

console.log('3. "Modern Workspace"');
console.log('   - 现代办公环境');
console.log('   - 简约设计元素');
console.log('   - 专业氛围\n');

console.log('📦 下载后的操作:\n');
console.log('1. 检查视频文件:');
console.log('   node check-video.js\n');

console.log('2. 替换视频:');
console.log('   mv ~/Downloads/your-video.mp4 client/public/videos/hero-commerce.mp4\n');

console.log('3. 测试视频:');
console.log('   - 启动开发服务器: cd client && npm start');
console.log('   - 访问: http://localhost:3000');
console.log('   - 检查hero section的视频播放\n');

console.log('🔧 如果视频太大，可以压缩:\n');
console.log('使用FFmpeg压缩 (需要先安装FFmpeg):');
console.log('ffmpeg -i input.mp4 -vcodec h264 -acodec aac -b:v 2M -b:a 128k hero-commerce.mp4\n');

console.log('或使用在线工具:');
console.log('- https://www.freeconvert.com/video-compressor');
console.log('- https://www.videosmaller.com/\n');

console.log('✨ 完成后，刷新浏览器即可看到新视频！\n');

// 创建一个简单的视频检查脚本
const checkVideoScript = `#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const videoPath = path.join(__dirname, 'client/public/videos/hero-commerce.mp4');

console.log('🔍 检查视频文件...\\n');

if (fs.existsSync(videoPath)) {
  const stats = fs.statSync(videoPath);
  const fileSizeInMB = (stats.size / (1024 * 1024)).toFixed(2);
  
  console.log('✅ 视频文件存在');
  console.log('📁 路径:', videoPath);
  console.log('📦 大小:', fileSizeInMB, 'MB');
  
  if (stats.size > 50 * 1024 * 1024) {
    console.log('⚠️  警告: 文件较大 (>50MB)，建议压缩');
  } else if (stats.size < 1 * 1024 * 1024) {
    console.log('⚠️  警告: 文件较小 (<1MB)，可能质量不佳');
  } else {
    console.log('✅ 文件大小合适');
  }
  
  console.log('\\n💡 提示: 启动开发服务器测试视频播放');
  console.log('   cd client && npm start');
} else {
  console.log('❌ 视频文件不存在');
  console.log('📁 期望路径:', videoPath);
  console.log('\\n请按照 download-hero-video.js 的说明下载视频');
}
`;

fs.writeFileSync('check-video.js', checkVideoScript);
console.log('📝 已创建视频检查脚本: check-video.js');
console.log('   运行: node check-video.js\n');

console.log('🎯 快速链接:\n');
console.log('Coverr Workspace: https://coverr.co/stock-video-footage/workspace');
console.log('Pexels Workspace: https://www.pexels.com/search/videos/minimalist%20workspace/');
console.log('Pixabay Workspace: https://pixabay.com/videos/search/workspace/\n');

console.log('祝你找到完美的视频！🎬✨');
