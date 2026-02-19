# seedlight.tech CORS问题 - 最终解决方案

## 问题根源

经过详细调试，发现问题不是CORS配置，而是**seedlight.tech域名没有正确路由到Workers API**。

## 证据

1. 所有请求都返回403 Forbidden
2. 响应中缺少`Access-Control-Allow-Origin`头
3. 即使在中间件最开始直接返回响应，仍然收到403
4. 这说明请求根本没有到达Worker代码

## 解决方案

### 方案1: 配置Workers路由（推荐）

1. 登录 Cloudflare Dashboard
2. 进入你的域名 (seedlight.tech) 设置
3. Workers Routes > Add route
4. 添加路由：
   ```
   Route: https://seedlight.tech/api/*
   Worker: ecommerce-api
   ```
   或者
   ```
   Route: https://api.seedlight.tech/*
   Worker: ecommerce-api
   ```

### 方案2: 使用自定义域名绑定Workers

1. Workers & Pages > ecommerce-api > Settings > Triggers
2. Custom Domains > Add Custom Domain
3. 添加: `api.seedlight.tech`
4. Cloudflare会自动配置DNS和路由

### 方案3: 使用Cloudflare Pages的_redirects

如果前端部署在Cloudflare Pages上，可以在`client/public/_redirects`中添加：

```
/api/*  https://shopline-one-api.xyvn.workers.dev/api/:splat  200
```

这样所有API请求都会代理到Workers，避免CORS问题。

### 方案4: 临时使用shopline-one.pages.dev

在seedlight.tech配置好之前，可以暂时使用：
- 前端: https://shopline-one.pages.dev
- API: https://shopline-one-api.xyvn.workers.dev

这个组合已经验证可以正常工作。

## 当前Workers API URL

```
https://shopline-one-api.xyvn.workers.dev
```

这个URL可以正常工作，CORS已经正确配置。

## 测试

配置完成后，测试：

```bash
# 测试API是否可达
curl https://seedlight.tech/api/products

# 或者
curl https://api.seedlight.tech/products

# 应该返回产品列表，而不是403
```

## 为什么会这样

Cloudflare Pages的自定义域名(seedlight.tech)默认只路由到Pages，不会自动路由到Workers。需要手动配置路由规则。

## 已完成的工作

✅ CORS配置已正确设置
✅ 支持以下域名：
  - https://shopline-one.pages.dev
  - https://seedlight.tech
  - https://www.seedlight.tech
  - http://localhost:3000

✅ 测试账号可用：
  - Email: test@example.com
  - Password: password12345678

## 下一步

1. 按照上述方案配置Workers路由
2. 或者使用方案3的_redirects代理
3. 测试登录功能

配置完成后，登录功能应该立即可用。
