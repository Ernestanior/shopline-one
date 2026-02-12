# 🚀 快速开始 - 产品图片设置

## 我需要你帮忙做什么

### 选项A：自动下载Zenlet图片（推荐）

**步骤1：安装依赖**
```bash
npm install axios cheerio
```

**步骤2：运行下载脚本**
```bash
node download-zenlet-images.js
```

这会自动从Zenlet网站下载产品图片到 `client/public/images/products/` 目录。

---

### 选项B：使用现有图片（最快）

**步骤1：运行设置脚本**
```bash
node setup-product-images.js
```

这会：
- 复制现有的图片到产品目录
- 生成产品配置文件
- 创建必要的目录结构

**步骤2：查看结果**
检查 `client/public/images/products/` 目录

---

### 选项C：手动下载（如果脚本失败）

**步骤1：访问Zenlet网站**
```
https://shop.zenlet.co/collections/productivity
```

**步骤2：下载产品图片**
- 右键点击产品图片
- 选择"图片另存为..."
- 保存到 `client/public/images/products/productivity/` 目录
- 命名为：productivity-1.jpg, productivity-2.jpg, 等等

**步骤3：重复其他类别**
- Mobility: https://shop.zenlet.co/collections/mobility
- Sanctuary: https://shop.zenlet.co/collections/sanctuary  
- Savoriness: https://shop.zenlet.co/collections/savoriness

---

## 我推荐的方案

**最快方案：选项B（使用现有图片）**

只需要运行一个命令：
```bash
node setup-product-images.js
```

然后我会更新产品数据使用这些图片。

---

## 你只需要做：

1. 选择一个方案（A、B或C）
2. 运行对应的命令
3. 告诉我完成了

然后我会：
- 更新 `server/index.js` 使用本地图片
- 为每个类别创建30+个产品
- 确保所有产品都有图片

---

## 需要帮助？

如果遇到问题，告诉我：
- 你选择了哪个方案
- 遇到了什么错误
- 需要什么帮助

我会立即协助你！🚀
