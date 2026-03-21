# 服务器同步指南

将代码同步到腾讯云服务器的完整流程。

## 执行步骤

1. 本地代码提交后，推送到 GitHub 和 Gitee
2. 服务器从 Gitee 拉取最新代码
3. 重启 PM2 服务

## 脚本命令

```bash
# 本地：推送到双远程仓库
git push origin main && git push gitee main

# 服务器：从 Gitee 同步代码
ssh -i ~/.ssh/tecentcloud.pem ubuntu@111.229.83.216 "cd /home/ubuntu/number-guess-game && git fetch gitee && git reset --hard gitee/main && pm2 restart number-guess-game"
```

## 参考文档

详细配置和密钥信息请参阅：`docs/SERVER_SYNC.md`