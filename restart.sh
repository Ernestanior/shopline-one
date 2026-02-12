#!/bin/bash

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}╔════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║   XYVN - 重启服务脚本                 ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════╝${NC}"
echo ""

# 停止所有相关进程
echo -e "${YELLOW}正在停止服务...${NC}"

# 查找并停止 node 进程
pkill -f "node server/index.js" 2>/dev/null
pkill -f "nodemon server/index.js" 2>/dev/null
pkill -f "react-scripts start" 2>/dev/null

sleep 2

echo -e "${GREEN}✅ 服务已停止${NC}"
echo ""

# 重新启动
echo -e "${YELLOW}正在重新启动服务...${NC}"
echo ""

# 使用 trap 捕获退出信号
trap 'echo -e "\n${YELLOW}正在停止服务...${NC}"; kill 0' SIGINT SIGTERM

# 启动后端和前端
npm run server &
cd client && npm start &

echo ""
echo -e "${BLUE}════════════════════════════════════════${NC}"
echo -e "${GREEN}🚀 服务已重启${NC}"
echo -e "${BLUE}════════════════════════════════════════${NC}"
echo ""
echo -e "${GREEN}📍 后端服务:${NC} http://localhost:5002"
echo -e "${GREEN}📍 前端服务:${NC} http://localhost:3001"
echo ""
echo -e "${YELLOW}💡 提示: 按 Ctrl+C 停止所有服务${NC}"
echo -e "${BLUE}════════════════════════════════════════${NC}"
echo ""

# 等待所有后台进程
wait
