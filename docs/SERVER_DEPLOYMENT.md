# 服务器部署指南

本指南用于把同一个 Next.js 项目部署到 Vercel 以外的 Linux 服务器，例如阿里云香港 ECS、腾讯云香港 Lighthouse / CVM、AWS、GCP、DigitalOcean、Render 或 Railway。

## 1. Docker 部署

准备环境变量：

```bash
cp .env.production.example .env.production
nano .env.production
```

最小配置：

```bash
DATABASE_URL="postgresql://USER:PASSWORD@HOST:5432/DB?sslmode=require"
AI_PROVIDER=mock
PAYMENT_PROVIDER=mock
APP_URL="https://your-domain.com"
NODE_ENV=production
```

构建并启动：

```bash
docker compose up -d --build
```

查看状态：

```bash
docker compose ps
docker compose logs -f app
```

停止：

```bash
docker compose down
```

## 2. PM2 部署可选方案

Docker 是推荐方式。PM2 适合已经有 Node 运维体系的服务器。

```bash
npm ci
npx prisma generate
npm run build
npm install -g pm2
pm2 start .next/standalone/server.js --name ai-fengshui-demo
pm2 save
pm2 startup
```

PM2 方式仍需要通过环境变量提供 `DATABASE_URL`、`AI_PROVIDER`、`PAYMENT_PROVIDER` 和 `APP_URL`。

## 3. Nginx 反向代理

基础配置：

```nginx
server {
    listen 80;
    server_name your-domain.com www.your-domain.com;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_cache_bypass $http_upgrade;
    }
}
```

检查并重载：

```bash
sudo nginx -t
sudo systemctl reload nginx
```

## 4. 环境变量

必填：

- `DATABASE_URL`：PostgreSQL 连接串，可以继续使用 Neon，也可以切换到阿里云 / 腾讯云 PostgreSQL。
- `AI_PROVIDER=mock`：当前 Demo 保持 mock。
- `PAYMENT_PROVIDER=mock`：当前 Demo 保持 mock。
- `APP_URL`：服务器域名或公网 URL。
- `NODE_ENV=production`

暂不启用：

- `OPENAI_API_KEY`
- 真实微信支付 / 支付宝密钥

不要把 `.env.production`、真实数据库连接串或任何密钥提交到 Git。

## 5. Prisma db push

当前项目使用 Prisma + PostgreSQL。服务器部署时要确保目标数据库已有表结构。

继续使用 Neon：

```bash
set -a
source .env.production
set +a
npx prisma db push
```

切换到阿里云 / 腾讯云 PostgreSQL：

1. 先备份旧数据库。
2. 创建新 PostgreSQL 实例和数据库。
3. 修改 `.env.production` 里的 `DATABASE_URL`。
4. 执行 `npx prisma db push` 或正式 migrations。
5. 验证 `/api/health` 与报告生成流程。

如果 Prisma schema 更新，需要重新执行 `npx prisma db push` 或使用 migrations。

## 6. 健康检查

本项目提供：

```bash
curl http://localhost:3000/api/health
```

返回字段：

- `ok`：服务进程是否可响应。
- `service`：服务名。
- `timestamp`：当前响应时间。
- `database`：`connected` 或 `unknown`。

健康检查不会输出 `DATABASE_URL` 或任何密钥。

## 7. 日志查看

Docker：

```bash
docker compose logs -f app
docker compose logs --tail=200 app
```

PM2：

```bash
pm2 logs ai-fengshui-demo
pm2 status
```

Nginx：

```bash
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log
```

## 8. 回滚方式

Docker 简单回滚：

```bash
git fetch origin
git checkout <previous-commit-sha>
docker compose up -d --build
```

恢复到 main：

```bash
git checkout main
git pull origin main
docker compose up -d --build
```

数据库回滚不能只靠 Git。修改 schema 或迁移前必须备份数据库。

## 9. 安全注意事项

- 不要提交 `.env.production`。
- 不要在 README、issue、日志或终端截图里暴露 `DATABASE_URL`。
- 不要在镜像里写入真实 OpenAI Key 或支付密钥。
- 对外开放前使用 HTTPS。
- 服务器安全组只开放 80、443 和必要 SSH 端口。
- SSH 建议使用密钥登录并关闭密码登录。
- 定期更新系统、Docker 和 Node 镜像。
- 正式接入真实支付前，先完成支付回调验签、幂等和退款策略。
