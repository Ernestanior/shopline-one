# 📸 Zenlet产品图片下载指南

## 方案1：自动下载脚本（推荐）

### 步骤：

1. **安装依赖**
```bash
npm install axios cheerio
```

2. **运行下载脚本**
```bash
node download-zenlet-images.js
```

3. **检查结果**
图片会保存到：`client/public/images/products/`

---

## 方案2：手动下载（如果脚本失败）

### Zenlet网站产品图片URL列表

访问这些页面并下载产品图片：

#### Productivity类别
https://shop.zenlet.co/collections/productivity

主要产品：
1. **Zenlet 2+** - 智能钱包
2. **Memo X** - 笔记本
3. **Tool Card** - 多功能工具卡
4. **Coin Slide** - 硬币收纳器

#### Mobility类别
https://shop.zenlet.co/collections/mobility

#### Sanctuary类别  
https://shop.zenlet.co/collections/sanctuary

#### Savoriness类别
https://shop.zenlet.co/collections/savoriness

### 手动下载步骤：

1. **访问产品页面**
   - 打开 https://shop.zenlet.co/collections/productivity

2. **下载产品图片**
   - 右键点击产品图片
   - 选择"在新标签页中打开图片"
   - 在新标签页中右键 -> "图片另存为..."
   - 保存到 `client/public/images/products/` 目录

3. **命名规则**
   ```
   productivity-1.jpg
   productivity-2.jpg
   productivity-3.jpg
   ...
   mobility-1.jpg
   mobility-2.jpg
   ...
   ```

4. **推荐下载数量**
   - Productivity: 至少10张
   - Mobility: 至少8张
   - Sanctuary: 至少8张
   - Savoriness: 至少8张

---

## 方案3：使用浏览器开发者工具批量获取URL

### 步骤：

1. **打开Zenlet网站**
   ```
   https://shop.zenlet.co/collections/productivity
   ```

2. **打开开发者工具**
   - Mac: `Cmd + Option + I`
   - Windows: `F12`

3. **在Console中运行以下代码**
   ```javascript
   // 提取所有产品图片URL
   const images = [];
   document.querySelectorAll('img').forEach(img => {
     const src = img.src || img.dataset.src;
     if (src && src.includes('cdn.shopify.com') && !src.includes('icon')) {
       // 获取高质量版本
       const highQualitySrc = src.split('?')[0] + '?width=800';
       images.push(highQualitySrc);
     }
   });
   
   // 去重
   const uniqueImages = [...new Set(images)];
   
   // 输出结果
   console.log('找到图片数量:', uniqueImages.length);
   console.log('图片URL列表:');
   uniqueImages.forEach((url, i) => {
     console.log(`${i + 1}. ${url}`);
   });
   
   // 复制到剪贴板
   copy(uniqueImages.join('\n'));
   console.log('\n✅ URL已复制到剪贴板！');
   ```

4. **使用下载工具**
   - 将URL列表粘贴到文本文件
   - 使用下载工具（如wget、curl、或浏览器扩展）批量下载

---

## 方案4：使用现有图片（快速方案）

如果下载困难，我们可以使用项目中已有的图片：

```
client/public/images/
├── zenlet-2.jpg      ✅ 已有
├── zenlet-3.jpg      ✅ 已有
├── memo-x.jpg        ✅ 已有
├── tool-card.jpg     ✅ 已有
├── coinslide.jpg     ✅ 已有
├── productivity.jpg  ✅ 已有
├── mobility.jpg      ✅ 已有
├── sanctuary.jpg     ✅ 已有
└── savoriness.jpg    ✅ 已有
```

我可以创建一个脚本，复制这些图片并生成多个变体用于不同产品。

---

## 需要我帮助的地方

请告诉我你想使用哪个方案：

1. **方案1** - 我帮你运行自动下载脚本
   - 你需要：运行 `npm install axios cheerio` 和 `node download-zenlet-images.js`

2. **方案2** - 你手动下载图片
   - 你需要：访问网站，下载图片到指定目录

3. **方案3** - 使用开发者工具获取URL
   - 你需要：在浏览器Console运行代码，复制URL给我

4. **方案4** - 使用现有图片生成变体
   - 我可以：立即创建脚本，复制和重命名现有图片

---

## 下载完成后

下载完图片后，我会：
1. 更新 `server/products-data.js` 使用本地图片路径
2. 为每个类别创建30+个产品
3. 确保所有产品都有对应的图片

请告诉我你选择哪个方案！🚀
