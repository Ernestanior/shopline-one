#!/bin/bash

# D1 数据库查询脚本
# 使用方法：./查看数据库.sh [表名]

cd workers

if [ -z "$1" ]; then
  echo "📊 可用的表："
  echo ""
  wrangler d1 execute ecommerce-db --remote --command="SELECT name FROM sqlite_master WHERE type='table'"
  echo ""
  echo "使用方法："
  echo "  ./查看数据库.sh users          # 查看用户表"
  echo "  ./查看数据库.sh products       # 查看产品表"
  echo "  ./查看数据库.sh orders         # 查看订单表"
  echo "  ./查看数据库.sh cart_items     # 查看购物车"
  echo ""
else
  echo "📋 查询表: $1"
  echo ""
  wrangler d1 execute ecommerce-db --remote --command="SELECT * FROM $1 LIMIT 20"
fi
