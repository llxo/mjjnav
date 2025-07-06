#!/bin/sh
set -e

# 检查JWT_SECRET环境变量是否设置
if [ -z "$JWT_SECRET" ]; then
  echo "错误: 未设置JWT_SECRET环境变量"
  echo "请通过环境变量或docker-compose.yml文件设置JWT_SECRET"
  exit 1
fi

# 执行原始的命令
exec "$@"
