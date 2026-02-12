#!/usr/bin/env node

/**
 * 自动下载高质量Hero视频
 * 从Mixkit.co下载免费的workspace视频
 */

const https = require('https');
const http = require('http');
const fs = require('fs');
const path = require('path');
const { URL } = require('url');

console.log('🎬 开始自动下载Hero视频...\n');

// Mixkit视频直链列表 (这些是高质量的workspace/product视频)
const videoOptions = [
  {
    name: 'Minimalist Desk Setup',
    url: 'https://assets.mixkit.co/videos/preview/mixkit-person-working-on-a-laptop-in-a-minimalist-workspace-50633-large.mp4',
    description: '简约工作空间，笔记本电脑特写'
  },
  {
    name: 'Clean Workspace',
    url: 'https://assets.mixkit.co/videos/preview/mixkit-top-view-of-a-person-working-on-a-laptop-50632-large.mp4',
    description: '俯视工作空间，干净整洁'
  },
  {
    name: 'Modern Office',
    url: 'https://assets.mixkit.co/videos/preview/mixkit-woman-working-on-laptop-in-modern-office-50631-large.mp4',
    description: '现代办公环境'
  },
  {
    name: 'Product Showcase',
    url: 'https://assets.mixkit.co/videos/preview/mixkit-rotating-product-on-white-background-50630-large.mp4',
    description: '产品展示，白色背景'
  }
];

// 选择第一个视频（你可以修改索引来选择不同的视频）
const selectedVideo = videoOptions[0];

console.log(`📹 选择视频: ${selectedVideo.name}`);
console.log(`📝 描述: ${selectedVideo.description}`);
console.log(`🔗 URL: ${selectedVideo.url}\n`);

const outputPath = path.join(__dirname, 'client/public/videos/hero-commerce.mp4');
const tempPath = path.join(__dirname, 'temp-video.mp4');

// 确保目录存在
const videoDir = path.dirname(outputPath);
if (!fs.existsSync(videoDir)) {
  fs.mkdirSync(videoDir, { recursive: true });
  console.log('📁 创建视频目录:', videoDir);
}

// 备份现有视频
if (fs.existsSync(outputPath)) {
  const backupPath = outputPath + '.backup';
  fs.copyFileSync(outputPath, backupPath);
  console.log('💾 已备份现有视频到:', backupPath);
}

function downloadFile(url, dest) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const protocol = urlObj.protocol === 'https:' ? https : http;
    
    const file = fs.createWriteStream(dest);
    let downloadedSize = 0;
    let totalSize = 0;
    
    console.log('⬇️  开始下载...\n');
    
    const request = protocol.get(url, (response) => {
      if (response.statusCode === 302 || response.statusCode === 301) {
        // 处理重定向
        file.close();
        fs.unlinkSync(dest);
        return downloadFile(response.headers.location, dest)
          .then(resolve)
          .catch(reject);
      }
      
      if (response.statusCode !== 200) {
        file.close();
        fs.unlinkSync(dest);
        return reject(new Error(`下载失败，状态码: ${response.statusCode}`));
      }
      
      totalSize = parseInt(response.headers['content-length'], 10);
      
      response.on('data', (chunk) => {
        downloadedSize += chunk.length;
        const progress = ((downloadedSize / totalSize) * 100).toFixed(1);
        const downloadedMB = (downloadedSize / 1024 / 1024).toFixed(2);
        const totalMB = (totalSize / 1024 / 1024).toFixed(2);
        
        process.stdout.write(`\r📦 进度: ${progress}% (${downloadedMB}MB / ${totalMB}MB)`);
      });
      
      response.pipe(file);
      
      file.on('finish', () => {
        file.close();
        console.log('\n✅ 下载完成!\n');
        resolve();
      });
    });
    
    request.on('error', (err) => {
      file.close();
      fs.unlinkSync(dest);
      reject(err);
    });
    
    file.on('error', (err) => {
      file.close();
      fs.unlinkSync(dest);
      reject(err);
    });
  });
}

// 开始下载
downloadFile(selectedVideo.url, tempPath)
  .then(() => {
    // 移动到最终位置
    fs.renameSync(tempPath, outputPath);
    console.log('📁 视频已保存到:', outputPath);
    
    // 检查文件大小
    const stats = fs.statSync(outputPath);
    const fileSizeInMB = (stats.size / (1024 * 1024)).toFixed(2);
    console.log('📦 文件大小:', fileSizeInMB, 'MB\n');
    
    if (stats.size > 50 * 1024 * 1024) {
      console.log('⚠️  警告: 文件较大 (>50MB)，建议压缩');
      console.log('💡 运行: ffmpeg -i client/public/videos/hero-commerce.mp4 -vcodec h264 -b:v 2M client/public/videos/hero-commerce-compressed.mp4\n');
    } else {
      console.log('✅ 文件大小合适\n');
    }
    
    console.log('🎉 视频替换完成！');
    console.log('\n📝 下一步:');
    console.log('1. 启动开发服务器: cd client && npm start');
    console.log('2. 访问: http://localhost:3000');
    console.log('3. 检查hero section的视频播放\n');
    
    console.log('💡 如果想选择其他视频，编辑 auto-download-video.js');
    console.log('   修改 selectedVideo = videoOptions[0] 中的索引 (0-3)\n');
  })
  .catch((error) => {
    console.error('\n❌ 下载失败:', error.message);
    console.log('\n💡 备选方案:');
    console.log('1. 检查网络连接');
    console.log('2. 手动下载视频:');
    console.log('   访问: https://mixkit.co/free-stock-video/workspace/');
    console.log('   下载视频后运行: mv ~/Downloads/video.mp4 client/public/videos/hero-commerce.mp4\n');
    
    // 清理临时文件
    if (fs.existsSync(tempPath)) {
      fs.unlinkSync(tempPath);
    }
  });
