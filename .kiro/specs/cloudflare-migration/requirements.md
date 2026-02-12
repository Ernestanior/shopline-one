# Requirements Document

## Introduction

本文档定义了将现有 Node.js + Express + MySQL 电商应用迁移到 Cloudflare Pages + Workers + D1 数据库的需求。该迁移旨在利用 Cloudflare 的边缘计算能力，提高应用性能、可扩展性和全球访问速度，同时保持所有现有功能正常工作。

## Glossary

- **System**: 整个电商应用系统，包括前端、后端 API 和数据库
- **Frontend**: React + TypeScript 前端应用
- **Backend**: 后端 API 服务
- **Database**: 数据存储层
- **D1**: Cloudflare 的 SQLite 数据库服务
- **Workers**: Cloudflare Workers 无服务器计算平台
- **Pages**: Cloudflare Pages 静态网站托管服务
- **R2**: Cloudflare R2 对象存储服务
- **Hono**: 轻量级 Web 框架，适用于 Cloudflare Workers
- **Migration**: 从旧技术栈迁移到新技术栈的过程

## Requirements

### Requirement 1: 数据库迁移

**User Story:** 作为开发者，我想要将 MySQL 数据库迁移到 Cloudflare D1，以便利用边缘数据库的性能优势。

#### Acceptance Criteria

1. THE System SHALL 创建 D1 数据库 schema，包含所有现有 MySQL 表的等效结构
2. WHEN 迁移 schema 时，THE System SHALL 将 MySQL 特定的数据类型转换为 SQLite 兼容的数据类型
3. WHEN 迁移 schema 时，THE System SHALL 保留所有表关系和外键约束
4. THE System SHALL 创建初始化脚本，用于在 D1 中创建所有必需的表
5. THE System SHALL 提供示例数据种子脚本，用于填充测试数据

### Requirement 2: 后端 API 重写

**User Story:** 作为开发者，我想要将 Express.js API 重写为 Cloudflare Workers，以便在边缘运行后端逻辑。

#### Acceptance Criteria

1. THE Backend SHALL 使用 Hono 框架替代 Express.js
2. WHEN 处理 HTTP 请求时，THE Backend SHALL 支持所有现有的 API 端点
3. WHEN 处理认证时，THE Backend SHALL 使用 Workers 兼容的 JWT 验证
4. WHEN 处理密码哈希时，THE Backend SHALL 使用 Web Crypto API 替代 bcrypt
5. THE Backend SHALL 实现中间件功能，包括 CORS、认证和错误处理
6. THE Backend SHALL 使用 D1 数据库绑定执行所有数据库查询
7. WHEN 执行数据库查询时，THE Backend SHALL 使用 SQLite 语法替代 MySQL 语法

### Requirement 3: 文件上传迁移

**User Story:** 作为开发者，我想要将文件上传功能迁移到 Cloudflare R2，以便在边缘存储和提供文件。

#### Acceptance Criteria

1. THE System SHALL 使用 Cloudflare R2 替代本地文件系统存储
2. WHEN 上传产品图片时，THE Backend SHALL 将文件存储到 R2 存储桶
3. WHEN 访问图片时，THE System SHALL 从 R2 提供图片文件
4. THE System SHALL 生成公共 URL 用于访问 R2 中的图片
5. THE Backend SHALL 验证上传文件的类型和大小限制

### Requirement 4: 前端部署配置

**User Story:** 作为开发者，我想要将 React 前端部署到 Cloudflare Pages，以便利用全球 CDN 加速。

#### Acceptance Criteria

1. THE Frontend SHALL 部署到 Cloudflare Pages
2. WHEN 构建前端时，THE System SHALL 生成静态资源文件
3. THE Frontend SHALL 配置 API 端点指向 Cloudflare Workers
4. THE System SHALL 配置环境变量用于不同环境（开发、生产）
5. THE Frontend SHALL 支持客户端路由和 SPA 回退

### Requirement 5: 认证系统迁移

**User Story:** 作为用户，我想要使用相同的认证方式登录，以便无缝过渡到新系统。

#### Acceptance Criteria

1. THE Backend SHALL 保持 JWT 认证机制
2. WHEN 用户注册时，THE Backend SHALL 使用 Web Crypto API 哈希密码
3. WHEN 用户登录时，THE Backend SHALL 验证密码并颁发 JWT token
4. THE Backend SHALL 在 HTTP-only cookie 中存储认证 token
5. WHEN 访问受保护的端点时，THE Backend SHALL 验证 JWT token
6. THE Backend SHALL 支持管理员权限检查

### Requirement 6: 购物车功能迁移

**User Story:** 作为用户，我想要使用购物车功能，以便管理我的购买商品。

#### Acceptance Criteria

1. WHEN 用户添加商品到购物车时，THE Backend SHALL 在 D1 数据库中创建或更新购物车项
2. WHEN 用户查看购物车时，THE Backend SHALL 返回所有购物车项及关联的产品信息
3. WHEN 用户更新购物车项数量时，THE Backend SHALL 更新 D1 数据库中的数量
4. WHEN 用户删除购物车项时，THE Backend SHALL 从 D1 数据库中删除该项
5. WHEN 用户清空购物车时，THE Backend SHALL 删除该用户的所有购物车项

### Requirement 7: 订单管理迁移

**User Story:** 作为用户，我想要创建和管理订单，以便完成购买流程。

#### Acceptance Criteria

1. WHEN 用户创建订单时，THE Backend SHALL 在 D1 数据库中创建订单记录和订单项
2. WHEN 用户查看订单列表时，THE Backend SHALL 返回该用户的所有订单
3. WHEN 用户查看订单详情时，THE Backend SHALL 返回订单信息和所有订单项
4. WHEN 用户更新支付状态时，THE Backend SHALL 更新 D1 数据库中的支付状态
5. WHEN 管理员查看所有订单时，THE Backend SHALL 返回系统中的所有订单

### Requirement 8: 产品管理迁移

**User Story:** 作为管理员，我想要管理产品信息，以便维护商品目录。

#### Acceptance Criteria

1. WHEN 查询产品列表时，THE Backend SHALL 从 D1 数据库返回产品列表
2. WHEN 按类别筛选产品时，THE Backend SHALL 返回指定类别的产品
3. WHEN 查询产品详情时，THE Backend SHALL 返回单个产品的完整信息
4. WHEN 管理员创建产品时，THE Backend SHALL 在 D1 数据库中插入新产品记录
5. WHEN 管理员更新产品时，THE Backend SHALL 更新 D1 数据库中的产品信息
6. WHEN 管理员删除产品时，THE Backend SHALL 从 D1 数据库中删除产品记录
7. WHEN 管理员上传产品图片时，THE Backend SHALL 将图片存储到 R2 并更新产品记录

### Requirement 9: 用户资料管理迁移

**User Story:** 作为用户，我想要管理我的个人资料、地址和支付方式，以便快速完成结账。

#### Acceptance Criteria

1. WHEN 用户查看个人资料时，THE Backend SHALL 从 D1 数据库返回用户资料信息
2. WHEN 用户更新个人资料时，THE Backend SHALL 更新 D1 数据库中的用户资料
3. WHEN 用户管理地址时，THE Backend SHALL 支持创建、读取、更新和删除地址记录
4. WHEN 用户管理支付方式时，THE Backend SHALL 支持创建、读取和删除支付方式记录
5. WHEN 用户设置默认地址或支付方式时，THE Backend SHALL 更新相应的默认标志

### Requirement 10: 反馈和订阅功能迁移

**User Story:** 作为用户，我想要提交反馈和订阅新闻通讯，以便与网站保持联系。

#### Acceptance Criteria

1. WHEN 用户提交反馈时，THE Backend SHALL 在 D1 数据库中创建反馈记录
2. WHEN 用户订阅新闻通讯时，THE Backend SHALL 在 D1 数据库中创建订阅记录
3. WHEN 用户已订阅时，THE Backend SHALL 返回已订阅消息而不是错误
4. WHEN 管理员查看反馈时，THE Backend SHALL 返回所有反馈记录

### Requirement 11: 部署配置

**User Story:** 作为开发者，我想要配置部署流程，以便自动化部署到 Cloudflare。

#### Acceptance Criteria

1. THE System SHALL 提供 wrangler.toml 配置文件用于 Workers 部署
2. THE System SHALL 配置 D1 数据库绑定
3. THE System SHALL 配置 R2 存储桶绑定
4. THE System SHALL 配置环境变量和密钥
5. THE System SHALL 提供部署脚本和文档
6. THE Frontend SHALL 配置 Cloudflare Pages 构建设置

### Requirement 12: 错误处理和日志

**User Story:** 作为开发者，我想要适当的错误处理和日志记录，以便调试和监控应用。

#### Acceptance Criteria

1. WHEN 发生错误时，THE Backend SHALL 返回适当的 HTTP 状态码和错误消息
2. THE Backend SHALL 记录错误信息用于调试
3. WHEN 数据库查询失败时，THE Backend SHALL 捕获错误并返回友好的错误消息
4. WHEN 验证失败时，THE Backend SHALL 返回详细的验证错误信息
5. THE Backend SHALL 实现全局错误处理中间件

### Requirement 13: 安全性迁移

**User Story:** 作为开发者，我想要保持应用的安全性，以便保护用户数据。

#### Acceptance Criteria

1. THE Backend SHALL 实现 CORS 配置限制跨域访问
2. THE Backend SHALL 实现速率限制防止滥用
3. THE Backend SHALL 验证所有用户输入
4. THE Backend SHALL 使用安全的密码哈希算法
5. THE Backend SHALL 在生产环境中使用 HTTPS
6. THE Backend SHALL 保护敏感的环境变量和密钥

### Requirement 14: 性能优化

**User Story:** 作为用户，我想要快速的页面加载和 API 响应，以便获得良好的用户体验。

#### Acceptance Criteria

1. THE Frontend SHALL 利用 Cloudflare CDN 缓存静态资源
2. THE Backend SHALL 在边缘位置执行，减少延迟
3. THE System SHALL 优化数据库查询，避免 N+1 查询
4. THE Frontend SHALL 实现代码分割和懒加载
5. THE System SHALL 压缩和优化图片资源
