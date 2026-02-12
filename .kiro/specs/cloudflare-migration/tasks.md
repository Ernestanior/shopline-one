# Implementation Plan: Cloudflare Migration

## Overview

本实现计划将电商应用从 Node.js + Express + MySQL 迁移到 Cloudflare Pages + Workers + D1。迁移将分阶段进行，每个阶段都包含具体的编码任务，确保功能完整性和系统稳定性。

## Tasks

### Phase 1: 基础设施准备

- [x] 1. 创建 Cloudflare 资源和配置文件
  - 创建 D1 数据库实例
  - 创建 R2 存储桶
  - 创建 wrangler.toml 配置文件，包含数据库和存储桶绑定
  - 配置环境变量和密钥
  - _Requirements: 11.1, 11.2, 11.3, 11.4_

- [x] 2. 创建 D1 数据库 schema
  - 编写 schema.sql 文件，包含所有 10 个表的 SQLite 定义
  - 将 MySQL 数据类型转换为 SQLite 兼容类型
  - 创建所有必需的索引
  - 定义外键约束
  - _Requirements: 1.1, 1.2, 1.3_

- [x] 2.1 编写 schema 验证测试
  - **Property 1: Schema Migration Completeness**
  - **Validates: Requirements 1.1, 1.3**

- [x] 3. 创建数据库初始化和种子脚本
  - 编写 init-d1.ts 脚本执行 schema 创建
  - 编写 seed-d1.ts 脚本插入示例产品数据
  - 创建管理员账户初始化脚本
  - _Requirements: 1.4, 1.5_

### Phase 2: Workers API 核心设置

- [x] 4. 初始化 Workers 项目结构
  - 使用 `npm create cloudflare@latest` 创建项目
  - 设置 TypeScript 配置
  - 安装依赖：hono, zod, jose (JWT)
  - 创建目录结构：routes/, middleware/, services/, types/
  - _Requirements: 2.1_

- [x] 5. 实现数据库服务层
  - 创建 DatabaseService 类封装 D1 操作
  - 实现通用查询方法：query, queryOne, execute
  - 实现事务支持方法
  - _Requirements: 2.6, 2.7_

- [x] 5.1 编写数据库服务测试
  - **Property 2: Data Type Conversion Correctness**
  - **Validates: Requirements 1.2**

- [x] 6. 实现认证服务
  - 使用 Web Crypto API 实现 hashPassword 函数
  - 使用 Web Crypto API 实现 verifyPassword 函数
  - 使用 jose 库实现 issueToken 函数
  - 使用 jose 库实现 verifyToken 函数
  - _Requirements: 2.4, 5.2_

- [x] 6.1 编写密码哈希属性测试
  - **Property 3: Password Hash Round-Trip**
  - **Validates: Requirements 2.4, 5.2**

- [x] 6.2 编写 JWT 认证属性测试
  - **Property 4: JWT Authentication Flow**
  - **Validates: Requirements 2.3, 5.1, 5.3, 5.5**

### Phase 3: 中间件实现

- [x] 7. 实现 CORS 中间件
  - 创建 corsMiddleware 函数
  - 支持配置允许的源列表
  - 开发环境允许 localhost
  - _Requirements: 2.5, 13.1_

- [x] 7.1 编写 CORS 策略测试
  - **Property 16: CORS Policy Enforcement**
  - **Validates: Requirements 13.1**

- [x] 8. 实现认证中间件
  - 创建 authMiddleware 提取和验证 JWT token
  - 创建 requireAuth 中间件保护端点
  - 创建 requireAdmin 中间件检查管理员权限
  - 实现 Cookie 管理函数：setAuthCookie, clearAuthCookie
  - _Requirements: 2.5, 5.4, 5.5, 5.6_

- [x] 8.1 编写权限检查测试
  - **Property 13: Admin Permission Enforcement**
  - **Validates: Requirements 5.6**

- [-] 9. 实现错误处理中间件
  - 创建 AppError 类
  - 创建 errorHandler 函数处理所有错误类型
  - 实现统一的错误响应格式
  - 添加错误日志记录
  - _Requirements: 2.5, 12.1, 12.2, 12.3, 12.5_

- [ ] 9.1 编写错误处理测试
  - **Property 14: Error Response Consistency**
  - **Validates: Requirements 12.1, 12.3, 12.4**

- [ ] 10. 实现输入验证中间件
  - 创建 validate 中间件使用 Zod schema
  - 定义常用的验证 schema（注册、登录、产品等）
  - _Requirements: 12.4, 13.3_

- [ ] 10.1 编写输入验证测试
  - **Property 15: Input Validation Completeness**
  - **Validates: Requirements 12.4, 13.3**

### Phase 4: 认证 API 实现

- [x] 11. 实现用户注册 API
  - 创建 POST /api/auth/register 路由
  - 验证邮箱和密码格式
  - 检查邮箱是否已注册
  - 哈希密码并创建用户记录
  - 颁发 JWT token 并设置 cookie
  - _Requirements: 5.1, 5.2, 5.3, 5.4_

- [x] 12. 实现用户登录 API
  - 创建 POST /api/auth/login 路由
  - 验证邮箱和密码
  - 查询用户并验证密码
  - 颁发 JWT token 并设置 cookie
  - _Requirements: 5.1, 5.3, 5.4_

- [ ] 13. 实现用户登出和获取当前用户 API
  - 创建 POST /api/auth/logout 路由清除 cookie
  - 创建 GET /api/auth/me 路由返回当前用户信息
  - _Requirements: 5.1, 5.5_

- [ ] 13.1 编写认证流程集成测试
  - 测试注册、登录、获取用户信息、登出完整流程
  - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5_

### Phase 5: 产品 API 实现

- [x] 14. 实现产品查询 API
  - 创建 GET /api/products 路由
  - 支持按类别筛选（query 参数）
  - 按 featured 和 created_at 排序
  - _Requirements: 8.1, 8.2_

- [x] 15. 实现产品详情 API
  - 创建 GET /api/products/:id 路由
  - 返回单个产品的完整信息
  - 处理产品不存在的情况
  - _Requirements: 8.3_

- [ ] 16. 实现分类列表 API
  - 创建 GET /api/categories 路由
  - 返回所有产品分类
  - _Requirements: 8.1_

- [ ] 16.1 编写产品 API 测试
  - **Property 10: Product CRUD Operations** (查询部分)
  - **Validates: Requirements 8.1, 8.2, 8.3**

### Phase 6: 购物车 API 实现

- [x] 17. 实现购物车查询 API
  - 创建 GET /api/cart 路由
  - 需要认证
  - 返回购物车项及关联的产品信息
  - _Requirements: 6.2_

- [x] 18. 实现添加到购物车 API
  - 创建 POST /api/cart/items 路由
  - 需要认证
  - 检查产品是否存在
  - 如果已存在则更新数量，否则创建新项
  - _Requirements: 6.1_

- [ ] 19. 实现更新和删除购物车项 API
  - 创建 PUT /api/cart/items/:id 路由更新数量
  - 创建 DELETE /api/cart/items/:id 路由删除项
  - 创建 DELETE /api/cart 路由清空购物车
  - 需要认证
  - _Requirements: 6.3, 6.4, 6.5_

- [ ] 19.1 编写购物车操作测试
  - **Property 8: Cart Item Persistence**
  - **Validates: Requirements 6.1, 6.2, 6.3, 6.4, 6.5**

### Phase 7: 订单 API 实现

- [ ] 20. 实现创建订单 API
  - 创建 POST /api/orders 路由
  - 验证订单数据（商品、联系信息、地址）
  - 生成订单号
  - 创建订单记录和订单项（使用事务）
  - _Requirements: 7.1_

- [ ] 20.1 编写订单创建测试
  - **Property 9: Order Creation Completeness**
  - **Validates: Requirements 7.1**

- [x] 21. 实现用户订单查询 API
  - 创建 GET /api/user/orders 路由返回订单列表
  - 创建 GET /api/user/orders/:id 路由返回订单详情
  - 需要认证
  - 只返回当前用户的订单
  - _Requirements: 7.2, 7.3_

- [x] 22. 实现订单状态更新 API
  - 创建 PATCH /api/user/orders/:id/payment 路由更新支付状态
  - 创建 DELETE /api/user/orders/:id 路由删除订单
  - 需要认证
  - 验证订单所有权
  - _Requirements: 7.4_

### Phase 8: 用户资料 API 实现

- [x] 23. 实现用户资料 API
  - 创建 GET /api/user/profile 路由查询资料
  - 创建 PUT /api/user/profile 路由更新资料
  - 需要认证
  - 支持创建和更新操作
  - _Requirements: 9.1, 9.2_

- [x] 24. 实现用户地址 API
  - 创建 GET /api/user/addresses 路由查询地址列表
  - 创建 POST /api/user/addresses 路由添加地址
  - 创建 PUT /api/user/addresses/:id 路由更新地址
  - 创建 DELETE /api/user/addresses/:id 路由删除地址
  - 需要认证
  - _Requirements: 9.3_

- [x] 25. 实现用户支付方式 API
  - 创建 GET /api/user/payment-methods 路由查询支付方式列表
  - 创建 POST /api/user/payment-methods 路由添加支付方式
  - 创建 DELETE /api/user/payment-methods/:id 路由删除支付方式
  - 需要认证
  - _Requirements: 9.4_

- [ ] 26. 实现默认标志管理
  - 在添加/更新地址时处理默认标志
  - 在添加支付方式时处理默认标志
  - 确保每个用户只有一个默认项
  - _Requirements: 9.5_

- [ ] 26.1 编写用户资料测试
  - **Property 11: User Profile CRUD Operations**
  - **Property 12: Default Flag Uniqueness**
  - **Validates: Requirements 9.1, 9.2, 9.3, 9.4, 9.5**

### Phase 9: 文件上传 API 实现

- [ ] 27. 实现产品图片上传 API
  - 创建 POST /api/upload/product-image 路由
  - 解析 multipart/form-data
  - 验证文件类型（jpeg, jpg, png, gif, webp）
  - 验证文件大小（最大 5MB）
  - 生成唯一文件名
  - 上传到 R2 存储桶
  - 返回公共 URL
  - _Requirements: 3.2, 3.3, 3.4, 3.5_

- [ ] 27.1 编写文件上传测试
  - **Property 6: File Upload Round-Trip**
  - **Property 7: File Upload Validation**
  - **Validates: Requirements 3.2, 3.3, 3.4, 3.5**

### Phase 10: 管理员 API 实现

- [x] 28. 实现管理员产品管理 API
  - 创建 POST /api/admin/products 路由创建产品
  - 创建 PUT /api/admin/products/:id 路由更新产品
  - 创建 DELETE /api/admin/products/:id 路由删除产品
  - 需要管理员权限
  - _Requirements: 8.4, 8.5, 8.6_

- [x] 29. 实现管理员订单管理 API
  - 创建 GET /api/admin/orders 路由查询所有订单
  - 创建 GET /api/admin/orders/:id 路由查询订单详情
  - 创建 PUT /api/admin/orders/:id 路由更新订单状态
  - 需要管理员权限
  - _Requirements: 7.5_

- [ ] 30. 实现管理员用户和反馈查询 API
  - 创建 GET /api/admin/users 路由查询用户列表
  - 创建 GET /api/admin/feedback 路由查询反馈列表
  - 需要管理员权限
  - _Requirements: 10.4_

- [ ] 30.1 编写管理员 API 测试
  - **Property 10: Product CRUD Operations** (完整测试)
  - **Validates: Requirements 8.4, 8.5, 8.6, 7.5, 10.4**

### Phase 11: 公共 API 实现

- [ ] 31. 实现反馈和订阅 API
  - 创建 POST /api/contact 路由提交反馈
  - 创建 POST /api/newsletter/subscribe 路由订阅新闻通讯
  - 处理重复订阅情况
  - _Requirements: 10.1, 10.2, 10.3_

- [ ] 31.1 编写反馈和订阅测试
  - 测试反馈提交和订阅功能
  - _Requirements: 10.1, 10.2, 10.3_

### Phase 12: Workers 主入口和部署

- [ ] 32. 实现 Workers 主入口文件
  - 创建 src/index.ts
  - 初始化 Hono 应用
  - 注册所有中间件
  - 注册所有路由
  - 配置错误处理
  - _Requirements: 2.1, 2.2_

- [ ] 32.1 编写 API 兼容性测试
  - **Property 5: API Endpoint Compatibility**
  - **Validates: Requirements 2.2**

- [x] 33. 配置 Workers 部署
  - 完善 wrangler.toml 配置
  - 设置路由规则
  - 配置开发和生产环境
  - 使用 wrangler secret 设置 JWT_SECRET
  - _Requirements: 11.1, 11.2, 11.3, 11.4_

- [ ] 34. 部署 Workers 到开发环境
  - 执行 `wrangler deploy --env development`
  - 测试所有 API 端点
  - 验证数据库连接
  - 验证 R2 访问
  - _Requirements: 2.2_

### Phase 13: 数据迁移

- [ ] 35. 执行数据库 schema 创建
  - 使用 wrangler d1 execute 执行 schema.sql
  - 验证所有表已创建
  - 验证索引已创建
  - 验证外键约束已设置
  - _Requirements: 1.1, 1.3_

- [ ] 36. 迁移现有数据
  - 从 MySQL 导出数据
  - 转换数据格式（日期、JSON 等）
  - 导入数据到 D1
  - 验证数据完整性
  - _Requirements: 1.2_

- [ ] 37. 迁移产品图片到 R2
  - 批量上传现有图片到 R2
  - 更新数据库中的图片路径
  - 验证图片可访问
  - _Requirements: 3.1, 3.2, 3.3_

### Phase 14: 前端配置和部署

- [x] 38. 更新前端 API 配置
  - 创建 src/config/api.ts 配置文件
  - 使用环境变量配置 API_BASE_URL
  - 更新所有 API 调用使用新配置
  - _Requirements: 4.3_

- [x] 39. 配置前端环境变量
  - 在 .env 文件中设置 REACT_APP_API_URL
  - 配置开发和生产环境变量
  - _Requirements: 4.4_

- [ ] 40. 构建和部署前端到 Pages
  - 执行 `npm run build` 构建前端
  - 配置 Pages 项目
  - 配置 _redirects 文件支持 SPA 路由
  - 部署到 Cloudflare Pages
  - _Requirements: 4.1, 4.2, 4.5_

### Phase 15: 集成测试和验证

- [ ] 41. 执行端到端测试
  - 测试用户注册和登录流程
  - 测试产品浏览和搜索
  - 测试购物车操作
  - 测试订单创建流程
  - 测试用户资料管理
  - 测试管理员功能
  - _Requirements: 所有功能需求_

- [ ] 41.1 编写 E2E 测试套件
  - 使用 Playwright 编写完整的用户流程测试
  - _Requirements: 所有功能需求_

- [ ] 42. 性能测试
  - 测试 API 响应时间
  - 测试并发处理能力
  - 测试数据库查询性能
  - 验证 CDN 缓存效果
  - _Requirements: 14.1, 14.2, 14.3_

- [ ] 42.1 编写性能测试
  - **Property 19: Database Query Optimization**
  - **Validates: Requirements 14.3**

- [ ] 43. 安全测试
  - 测试 CORS 策略
  - 测试认证和授权
  - 测试输入验证
  - 测试 SQL 注入防护
  - 测试速率限制
  - _Requirements: 13.1, 13.2, 13.3, 13.4, 13.6_

- [ ] 43.1 编写安全测试
  - **Property 17: SQL Injection Prevention**
  - **Property 18: Sensitive Data Protection**
  - **Validates: Requirements 13.3, 13.6**

### Phase 16: 监控和文档

- [ ] 44. 配置监控和日志
  - 配置 Cloudflare Analytics
  - 实现自定义日志记录
  - 配置错误追踪（可选：Sentry）
  - 设置性能监控
  - _Requirements: 12.2_

- [x] 45. 编写部署文档
  - 记录部署步骤
  - 记录环境变量配置
  - 记录数据库迁移步骤
  - 记录回滚流程
  - _Requirements: 11.5_

### Phase 17: 生产部署

- [ ] 46. 部署到生产环境
  - 部署 Workers 到生产环境
  - 部署 Pages 到生产环境
  - 配置自定义域名
  - 配置 SSL/TLS
  - _Requirements: 13.5_

- [ ] 47. DNS 切换和验证
  - 更新 DNS 记录指向 Cloudflare
  - 验证所有功能正常工作
  - 监控错误率和性能
  - 准备回滚计划
  - _Requirements: 所有需求_

- [ ] 48. 最终验证和监控
  - 执行完整的功能测试
  - 监控系统性能和错误
  - 收集用户反馈
  - 准备优化计划
  - _Requirements: 所有需求_

## Notes

- 每个任务都引用了具体的需求，确保可追溯性
- 建议在每个 Phase 完成后进行检查点验证
- 属性测试使用 fast-check 库，每个测试至少运行 100 次迭代
- 单元测试使用 Vitest 框架
- 集成测试使用 Wrangler 的 unstable_dev API
- E2E 测试使用 Playwright
- 所有测试任务都是必需的，确保从一开始就有全面的测试覆盖

## Testing Configuration

### Property-Based Tests
- 库: fast-check
- 最少迭代次数: 100
- 标签格式: `Feature: cloudflare-migration, Property {number}: {property_text}`

### Unit Tests
- 框架: Vitest
- 覆盖率目标: 80%

### Integration Tests
- 工具: Wrangler unstable_dev
- 测试环境: 本地开发环境

### E2E Tests
- 框架: Playwright
- 测试环境: 部署后的开发环境
