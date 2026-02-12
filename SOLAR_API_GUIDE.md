# 🌞 Solar API 集成指南

## 概述

本项目已集成 SolisCloud API，用于监控光伏电站的实时数据和历史发电量。

## API配置

### 认证信息

API密钥配置在 `server/soliscloud-api.js` 中：

```javascript
const SOLIS_CONFIG = {
  keyId: '1300386381676661773',
  keySecret: 'eccae4b90e0e4560a412d6839ffac42e',
  apiUrl: 'https://www.soliscloud.com:13333'
};
```

### 安全机制

- **HMAC-SHA1签名**: 每个请求都使用密钥签名
- **MD5内容校验**: 请求体使用MD5哈希验证
- **HTTPS加密**: 所有通信通过HTTPS加密
- **时间戳验证**: 使用UTC时间戳防止重放攻击

## API端点

### 1. 获取电站列表

```http
GET /api/solar/stations
```

**响应示例:**
```json
{
  "success": true,
  "code": "0",
  "msg": "success",
  "data": {
    "pageNo": 1,
    "pageSize": 20,
    "total": 5,
    "records": [
      {
        "id": "123456",
        "name": "我的电站",
        "capacity": 10.5,
        "location": "北京市",
        "status": "1"
      }
    ]
  }
}
```

### 2. 获取电站详情

```http
GET /api/solar/stations/:id
```

**参数:**
- `id` - 电站ID

**响应示例:**
```json
{
  "success": true,
  "code": "0",
  "msg": "success",
  "data": {
    "id": "123456",
    "name": "我的电站",
    "capacity": 10.5,
    "currentPower": 8.2,
    "todayEnergy": 45.6,
    "totalEnergy": 12345.67,
    "status": "1"
  }
}
```

### 3. 获取逆变器列表

```http
GET /api/solar/stations/:id/inverters
```

**参数:**
- `id` - 电站ID

**响应示例:**
```json
{
  "success": true,
  "code": "0",
  "msg": "success",
  "data": {
    "records": [
      {
        "id": "INV001",
        "sn": "SN123456789",
        "model": "Solis-10K",
        "power": 8200,
        "status": "1"
      }
    ]
  }
}
```

### 4. 获取逆变器详情

```http
GET /api/solar/inverters/:id
```

**参数:**
- `id` - 逆变器ID

**响应示例:**
```json
{
  "success": true,
  "code": "0",
  "msg": "success",
  "data": {
    "id": "INV001",
    "power": 8200,
    "voltage": 380,
    "current": 21.5,
    "temperature": 45.2,
    "status": "1"
  }
}
```

### 5. 获取日发电量

```http
GET /api/solar/stations/:id/day/:date
```

**参数:**
- `id` - 电站ID
- `date` - 日期 (格式: YYYY-MM-DD)

**示例:**
```http
GET /api/solar/stations/123456/day/2024-02-11
```

**响应示例:**
```json
{
  "success": true,
  "code": "0",
  "msg": "success",
  "data": {
    "date": "2024-02-11",
    "energy": 45.6,
    "records": [
      {
        "time": "08:00",
        "power": 2.5
      },
      {
        "time": "09:00",
        "power": 5.8
      }
    ]
  }
}
```

### 6. 获取月发电量

```http
GET /api/solar/stations/:id/month/:month
```

**参数:**
- `id` - 电站ID
- `month` - 月份 (格式: YYYY-MM)

**示例:**
```http
GET /api/solar/stations/123456/month/2024-02
```

**响应示例:**
```json
{
  "success": true,
  "code": "0",
  "msg": "success",
  "data": {
    "month": "2024-02",
    "energy": 1234.5,
    "records": [
      {
        "date": "2024-02-01",
        "energy": 45.6
      },
      {
        "date": "2024-02-02",
        "energy": 48.2
      }
    ]
  }
}
```

### 7. 获取年发电量

```http
GET /api/solar/stations/:id/year/:year
```

**参数:**
- `id` - 电站ID
- `year` - 年份 (格式: YYYY)

**示例:**
```http
GET /api/solar/stations/123456/year/2024
```

**响应示例:**
```json
{
  "success": true,
  "code": "0",
  "msg": "success",
  "data": {
    "year": "2024",
    "energy": 15678.9,
    "records": [
      {
        "month": "2024-01",
        "energy": 1234.5
      },
      {
        "month": "2024-02",
        "energy": 1456.7
      }
    ]
  }
}
```

## 错误处理

所有API端点都包含错误处理：

```json
{
  "error": "Failed to fetch station list",
  "message": "Network timeout"
}
```

**常见错误码:**
- `500` - 服务器内部错误
- `401` - 认证失败
- `404` - 资源不存在
- `429` - 请求过于频繁

## 测试

### 使用测试脚本

```bash
node test-solar-api.js
```

这将测试所有API功能并显示详细结果。

### 使用curl测试

```bash
# 启动服务器
npm start

# 在另一个终端测试API
curl http://localhost:5001/api/solar/stations

# 测试电站详情（替换123456为实际ID）
curl http://localhost:5001/api/solar/stations/123456

# 测试今日发电量
curl http://localhost:5001/api/solar/stations/123456/day/2024-02-11
```

### 使用Postman测试

1. 导入以下请求到Postman
2. 设置Base URL: `http://localhost:5001`
3. 测试各个端点

## 前端集成示例

### React组件示例

```tsx
import React, { useState, useEffect } from 'react';
import { apiFetch } from '../lib/api';

interface Station {
  id: string;
  name: string;
  capacity: number;
  currentPower: number;
  todayEnergy: number;
}

const SolarDashboard: React.FC = () => {
  const [stations, setStations] = useState<Station[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStations = async () => {
      try {
        const response = await apiFetch('/api/solar/stations');
        if (response.success && response.data) {
          setStations(response.data.records);
        }
      } catch (error) {
        console.error('Failed to fetch stations:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchStations();
  }, []);

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="solar-dashboard">
      <h1>Solar Monitoring</h1>
      <div className="stations-grid">
        {stations.map(station => (
          <div key={station.id} className="station-card">
            <h3>{station.name}</h3>
            <p>Capacity: {station.capacity} kW</p>
            <p>Current Power: {station.currentPower} kW</p>
            <p>Today's Energy: {station.todayEnergy} kWh</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default SolarDashboard;
```

### 实时数据更新

```tsx
useEffect(() => {
  // 每30秒更新一次数据
  const interval = setInterval(() => {
    fetchStations();
  }, 30000);

  return () => clearInterval(interval);
}, []);
```

## 数据缓存建议

为了减少API调用次数，建议实现缓存：

```javascript
// server/cache.js
const NodeCache = require('node-cache');
const cache = new NodeCache({ stdTTL: 300 }); // 5分钟缓存

function getCachedData(key, fetchFunction) {
  const cached = cache.get(key);
  if (cached) {
    return Promise.resolve(cached);
  }
  
  return fetchFunction().then(data => {
    cache.set(key, data);
    return data;
  });
}

module.exports = { getCachedData };
```

## 性能优化

### 1. 批量请求

```javascript
// 同时获取多个电站的数据
const stationIds = ['123', '456', '789'];
const promises = stationIds.map(id => 
  apiFetch(`/api/solar/stations/${id}`)
);
const results = await Promise.all(promises);
```

### 2. 数据聚合

```javascript
// 在服务器端聚合数据
app.get('/api/solar/dashboard', async (req, res) => {
  try {
    const [stations, inverters, todayData] = await Promise.all([
      solisAPI.getStationList(),
      solisAPI.getInverterList(stationId),
      solisAPI.getStationDay(stationId, today)
    ]);
    
    res.json({
      stations: stations.data,
      inverters: inverters.data,
      todayData: todayData.data
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
```

### 3. WebSocket实时推送

```javascript
// 使用Socket.io推送实时数据
const io = require('socket.io')(server);

setInterval(async () => {
  const data = await solisAPI.getStationDetail(stationId);
  io.emit('solar-update', data);
}, 5000); // 每5秒推送一次
```

## 安全建议

1. **环境变量**: 将API密钥移到环境变量
   ```javascript
   const SOLIS_CONFIG = {
     keyId: process.env.SOLIS_KEY_ID,
     keySecret: process.env.SOLIS_KEY_SECRET,
     apiUrl: process.env.SOLIS_API_URL
   };
   ```

2. **速率限制**: 添加API速率限制
   ```javascript
   const rateLimit = require('express-rate-limit');
   
   const solarLimiter = rateLimit({
     windowMs: 15 * 60 * 1000, // 15分钟
     max: 100 // 最多100个请求
   });
   
   app.use('/api/solar', solarLimiter);
   ```

3. **认证保护**: 要求用户登录才能访问
   ```javascript
   app.get('/api/solar/*', requireAuth, async (req, res) => {
     // 处理请求
   });
   ```

## 故障排查

### 问题1: 认证失败

**症状**: 返回401错误

**解决方案**:
1. 检查API密钥是否正确
2. 确认时间戳格式正确
3. 验证签名算法实现

### 问题2: 网络超时

**症状**: 请求超时

**解决方案**:
1. 检查网络连接
2. 确认防火墙设置
3. 增加超时时间

### 问题3: 数据为空

**症状**: 返回空数据

**解决方案**:
1. 确认账户有电站数据
2. 检查电站ID是否正确
3. 验证日期格式

## 文档和资源

- **SolisCloud官网**: https://www.soliscloud.com
- **API文档**: 联系SolisCloud获取
- **技术支持**: support@soliscloud.com

## 更新日志

### 2024-02-11
- ✅ 初始集成完成
- ✅ 添加7个API端点
- ✅ 实现HMAC-SHA1认证
- ✅ 添加错误处理和日志
- ✅ 创建测试脚本

## 许可证

本集成代码遵循项目主许可证。SolisCloud API使用需遵守其服务条款。
