#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const videoPath = path.join(__dirname, 'client/public/videos/hero-commerce.mp4');

console.log('🔍 检查视频文件...\n');

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
  
  console.log('\n💡 提示: 启动开发服务器测试视频播放');
  console.log('   cd client && npm start');
} else {
  console.log('❌ 视频文件不存在');
  console.log('📁 期望路径:', videoPath);
  console.log('\n请按照 download-hero-video.js 的说明下载视频');
}
