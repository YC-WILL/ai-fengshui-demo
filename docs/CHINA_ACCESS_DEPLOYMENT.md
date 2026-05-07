# 中国大陆访问与多线路部署方案

## 当前问题判断

- Vercel 海外线路正常，当前海外 Demo 地址为 `https://ai-fengshui-demo.vercel.app`。
- 中国大陆访问不稳定不是代码主功能问题，而是部署线路和域名解析链路问题。
- `.vercel.app` 在中国大陆可能被阻断、DNS 污染、限速、连接超时或间歇性失败。

## 三种方案对比

### 方案 A：继续 Vercel + 自定义域名

优点：

- 最简单，继续使用现有 Vercel 项目、Neon Postgres 和 GitHub 自动部署。
- 适合海外 Demo、投资人预览、海外朋友测试。

缺点：

- 中国大陆访问仍可能不稳定。
- 自定义域名只能改善品牌和部分解析体验，不能保证 Vercel 全球线路在大陆稳定。

适合：

- 海外 Demo。
- 暂不面向中国大陆正式获客的公开展示。

### 方案 B：香港 / 新加坡服务器镜像

推荐平台：

- 阿里云香港 ECS
- 腾讯云香港 Lighthouse / CVM
- AWS 香港
- DigitalOcean 新加坡

优点：

- 不需要中国大陆 ICP 备案，部署快。
- 对中国大陆用户通常比 Vercel `.vercel.app` 更容易访问。
- 可以继续复用同一个 GitHub repo、同一套 Docker 镜像和同一个 Neon `DATABASE_URL`。

缺点：

- 大陆访问会更好，但仍不保证绝对稳定。
- 需要自己维护服务器、Nginx、HTTPS、日志和更新流程。

适合：

- MVP 给大陆朋友测试。
- 保留 Vercel 海外线路，同时新增大陆更友好的镜像线路。

### 方案 C：中国大陆服务器 + ICP 备案 + 公安备案 + 国内 CDN

优点：

- 中国大陆访问最稳定。
- 可接入国内云厂商、国内 CDN 和国内备案域名。

缺点：

- 需要 ICP 备案、公安备案、域名实名、服务器实名和合规审查。
- AI、支付、内容安全、数据跨境都需要正式合规方案。
- 时间成本和运营成本最高。

适合：

- 正式面向中国大陆市场。
- 准备商业化、广告投放、真实支付和真实用户留存。

## 推荐路线

当前阶段推荐：

1. 保留 Vercel，继续作为海外 Demo 线路。
2. 新增香港服务器镜像，优先选择阿里云香港 ECS 或腾讯云香港 Lighthouse。
3. 绑定自定义域名后按地区测试访问质量。
4. 正式大陆商业化前，再做 ICP 备案、公安备案、国内云部署、国内 CDN 和完整合规审查。

## Linux 服务器 Docker 部署步骤

### 1. 安装 Docker

以 Ubuntu 为例：

```bash
sudo apt update
sudo apt install -y ca-certificates curl gnupg
curl -fsSL https://get.docker.com | sudo sh
sudo usermod -aG docker $USER
```

重新登录服务器后确认：

```bash
docker --version
docker compose version
```

### 2. 克隆 GitHub repo

```bash
git clone https://github.com/YC-WILL/ai-fengshui-demo.git
cd ai-fengshui-demo
```

### 3. 创建生产环境变量

```bash
cp .env.production.example .env.production
nano .env.production
```

填写：

```bash
DATABASE_URL="postgresql://USER:PASSWORD@HOST:5432/DB?sslmode=require"
AI_PROVIDER=mock
PAYMENT_PROVIDER=mock
APP_URL="https://your-domain.com"
NODE_ENV=production
```

不要把 `.env.production` 提交到 Git，也不要在日志或文档里输出真实 `DATABASE_URL`。

### 4. 初始化数据库表结构

如果继续使用 Neon，同一台服务器也可以继续使用 Neon 提供的 `DATABASE_URL`。

```bash
set -a
source .env.production
set +a
npx prisma db push
```

如果切换到阿里云、腾讯云或其他 PostgreSQL，先更换 `DATABASE_URL`，确认备份，再执行 `npx prisma db push` 或正式 migrations。

### 5. 启动服务

```bash
docker compose up -d --build
```

检查容器：

```bash
docker compose ps
docker compose logs -f app
```

### 6. 健康检查

```bash
curl http://localhost:3000/api/health
```

预期返回：

```json
{
  "ok": true,
  "service": "ai-fengshui-demo",
  "timestamp": "2026-05-07T00:00:00.000Z",
  "database": "connected"
}
```

如果数据库暂不可用，`database` 会显示 `unknown`，但不会暴露连接串。

## Nginx 反向代理示例

安装：

```bash
sudo apt install -y nginx
```

示例配置 `/etc/nginx/sites-available/ai-fengshui-demo`：

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

启用：

```bash
sudo ln -s /etc/nginx/sites-available/ai-fengshui-demo /etc/nginx/sites-enabled/ai-fengshui-demo
sudo nginx -t
sudo systemctl reload nginx
```

## HTTPS 与域名

1. 在域名服务商处配置 DNS 到服务器 IP。
2. 使用 Certbot 或云厂商证书服务配置 HTTPS。
3. HTTPS 生效后，将 `.env.production` 里的 `APP_URL` 改为正式域名。
4. 重启服务：

```bash
docker compose up -d --build
```

修改 DNS、证书和域名前必须人工确认。

## 后续大陆正式上线合规清单

- ICP 备案
- 公安备案
- 生成式 AI 服务合规
- 用户协议
- 隐私政策
- 内容安全
- 支付资质
- 数据跨境评估
- 大模型备案或调用合规国内模型
