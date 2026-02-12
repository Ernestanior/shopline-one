#!/bin/bash

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}╔════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║   XYVN 电商系统 - 一键启动脚本        ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════╝${NC}"
echo ""

# 检查 Node.js
echo -e "${YELLOW}[1/5]${NC} 检查 Node.js..."
if ! command -v node &> /dev/null; then
    echo -e "${RED}❌ Node.js 未安装，请先安装 Node.js${NC}"
    exit 1
fi
echo -e "${GREEN}✅ Node.js 版本: $(node -v)${NC}"

# 检查 MySQL
echo -e "${YELLOW}[2/5]${NC} 检查 MySQL..."
if ! command -v mysql &> /dev/null; then
    echo -e "${RED}❌ MySQL 未安装或未在 PATH 中${NC}"
    echo -e "${YELLOW}⚠️  请确保 MySQL 服务正在运行${NC}"
else
    echo -e "${GREEN}✅ MySQL 已安装${NC}"
fi

# 初始化数据库
echo -e "${YELLOW}[3/5]${NC} 初始化数据库..."
node server/init-database.js
if [ $? -ne 0 ]; then
    echo -e "${RED}❌ 数据库初始化失败${NC}"
    echo -e "${YELLOW}💡 请检查:${NC}"
    echo -e "   1. MySQL 服务是否运行"
    echo -e "   2. .env 文件中的数据库配置是否正确"
    echo -e "   3. 数据库用户是否有足够的权限"
    exit 1
fi
echo -e "${GREEN}✅ 数据库初始化成功${NC}"

# 检查依赖
echo -e "${YELLOW}[4/5]${NC} 检查依赖..."
if [ ! -d "node_modules" ]; then
    echo -e "${YELLOW}📦 安装后端依赖...${NC}"
    npm install
fi

if [ ! -d "client/node_modules" ]; then
    echo -e "${YELLOW}📦 安装前端依赖...${NC}"
    cd client && npm install && cd ..
fi
echo -e "${GREEN}✅ 依赖检查完成${NC}"

# 启动服务
echo -e "${YELLOW}[5/5]${NC} 启动服务..."
echo ""
echo -e "${BLUE}════════════════════════════════════════${NC}"
echo -e "${GREEN}🚀 正在启动服务...${NC}"
echo -e "${BLUE}════════════════════════════════════════${NC}"
echo ""
echo -e "${GREEN}📍 后端服务:${NC} http://localhost:5002"
echo -e "${GREEN}📍 前端服务:${NC} http://localhost:3001"
echo -e "${GREEN}📍 管理后台:${NC} http://localhost:3001/admin"
echo ""
echo -e "${YELLOW}👤 默认管理员账户:${NC}"
echo -e "   邮箱: ${GREEN}admin@xyvn.com${NC}"
echo -e "   密码: ${GREEN}admin123${NC}"
echo ""
echo -e "${BLUE}════════════════════════════════════════${NC}"
echo -e "${YELLOW}💡 提示: 按 Ctrl+C 停止所有服务${NC}"
echo -e "${BLUE}════════════════════════════════════════${NC}"
echo ""

# 使用 trap 捕获退出信号
trap 'echo -e "\n${YELLOW}正在停止服务...${NC}"; kill 0' SIGINT SIGTERM

# 启动后端和前端
npm run server &
cd client && npm start &

# 等待所有后台进程
wait
