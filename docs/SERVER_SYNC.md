# 服务器同步完整指南

## 服务器信息

| 项目 | 值 |
|------|-----|
| IP 地址 | 111.229.83.216 |
| 用户名 | ubuntu |
| SSH 密钥 | `~/.ssh/tecentcloud.pem` |
| 项目路径 | `/home/ubuntu/number-guess-game` |
| PM2 进程名 | number-guess-game |

## 远程仓库配置

| 仓库名 | 地址 | 用途 |
|--------|------|------|
| origin (GitHub) | `git@github.com:CaoLiangqiang/number-guess-game.git` | 主仓库 |
| gitee | `git@gitee.com:hanzaiworld/number-guess-game.git` | 备用仓库（国内访问更稳定） |

## SSH 密钥信息

### 本地 Mac 密钥

**位置**: `~/.ssh/tecentcloud.pem`

用于连接腾讯云服务器。

### 本地 Git SSH 公钥

**位置**: `~/.ssh/id_rsa.pub`

```
ssh-rsa AAAAB3NzaC1yc2EAAAADAQABAAABgQDiS8QQUHTN2jIT40lMfI2GDtRihJJ2FaZ/E0bvulTeLR2aGdKaj0d4UaVk41SJmbISbUL6M0IPZsyPNTVHUzrfB+jkPR760XcwReOXfPNXZxc1k00nHc2U2tuM9/6j9giniZUQ4xrCTcjJAKALHiVOfCQ4YWNv18PqSWag46yPCS1SO+56vMfyeBXVK4r1k5hktsSmkeM5QAaS/g0Hm3hrPJe0+0RAnPyc2Hx3SNBdLRzbnHueMl6x4pJtHJq+e8uGAa4hP7GmiGR0D3BX0OXmosPQtLHk6y8XTPZO4rl+cf+aE1AMB7xaQ6D9KZ278XokWnsO51dLRLBBQNUm1VFhUF0AMaemZwMd6z57BLETgqwX6IuH8EhAq39NvqEr31g7d8whjSpBDN/yLcRZjKzYvxs/GdKEKZhJF2UDf/0IZLPGJ//LPLV5keEa47ExSW3anOL8/4v79ahcxro+t3jTK3s/obVkowTujPvT37hiSO3NAfGP96lJG2wWtdvgB0s= Liangqiang_cao@outlook.com
```

已添加到：
- GitHub: https://github.com/settings/keys
- Gitee: https://gitee.com/profile/sshkeys

### 服务器 SSH 公钥

**生成命令**: `ssh-keygen -t rsa -b 4096 -C 'server@111.229.83.216'`

```
ssh-rsa AAAAB3NzaC1yc2EAAAADAQABAAACAQC5uWPzPBtwzWfYWhM+MDAjwoRKIaZChV9oz79Xtvw6/0Ob8iXSYFkDHd70oI+Faif2dD3ymaAE9dDAXYl15sf+gz5qAa8ZrZWWWvSXPXDU67BALML3JDhj5ETNyS0QmO8hYgDS2Je1Dhtgk2YW6Wx4WR+w/6VV+1lQcQ+zJX0mR0XmoSinisd9wWtHXxgN83axPYLtel5WFNH2C5pQLL81kjqFtA2H1OhWQpTj07SFes3oeh4S5Uu1Zvqx/BWIIplSuRkTlRQWfcGb3zljrChNZzoDPI7wtoY2iePZap9jO/K6nRGXxImaBWtEvRZoDE9XApCjAUos9lsdiMv/kBJsyEb1K7mGVgYnmG4mC/RzvIG3kYNTtXaPiPn8QPQqpMiRZ/whPrd2200aIjbzxRyOicaMnsSxd2Z/vz1DEK4xWRyfkPfK/7FWcHECRUMAEayDZOo2Jpx7POof11pK1PrfHazymzflISWqs4+CX4uTeDk7h1YtkWOj64zyVH7EYKlRb3yK/3Y4MT3s6lw/Loij1FBhMOLxe7q1X3F57Y+HMZLS04K1CJFgJXoLiR9eMpokRNExarqwe8lF04eCyXHRYyb7Cu641FixIxS1qJeTm31UQ4GovWPznzqx7PtFaG/xZ8J9EVyCU/mIJaUA9dOF3CabVDxlO1GOIwNSxMdSIw== server@111.229.83.216
```

已添加到：Gitee（用于服务器拉取代码）

## 常用命令

### 连接服务器

```bash
ssh -i ~/.ssh/tecentcloud.pem ubuntu@111.229.83.216
```

### 本地推送代码

```bash
# 推送到 GitHub（主仓库）
git push origin main

# 推送到 Gitee（备用仓库）
git push gitee main

# 同时推送到两个仓库
git push origin main && git push gitee main
```

### 服务器同步代码

```bash
# 从 Gitee 拉取最新代码
ssh -i ~/.ssh/tecentcloud.pem ubuntu@111.229.83.216 "cd /home/ubuntu/number-guess-game && git fetch gitee && git reset --hard gitee/main"

# 重启服务
ssh -i ~/.ssh/tecentcloud.pem ubuntu@111.229.83.216 "pm2 restart number-guess-game"

# 完整同步并重启
ssh -i ~/.ssh/tecentcloud.pem ubuntu@111.229.83.216 "cd /home/ubuntu/number-guess-game && git fetch gitee && git reset --hard gitee/main && pm2 restart number-guess-game"
```

### 查看 PM2 状态

```bash
ssh -i ~/.ssh/tecentcloud.pem ubuntu@111.229.83.216 "pm2 list && pm2 logs number-guess-game --lines 20"
```

## 同步流程图

```
本地开发 → git commit
    ↓
git push origin main (GitHub)
    ↓
git push gitee main (Gitee 备份)
    ↓
服务器: git fetch gitee && git reset --hard gitee/main
    ↓
pm2 restart number-guess-game
    ↓
访问 https://111.229.83.216 验证
```

## 注意事项

1. **优先使用 Gitee 同步服务器** - 国内网络更稳定
2. **GitHub 作为主仓库** - 用于版本控制和 CI/CD
3. **服务器 SSH 密钥** - 已添加到 Gitee，可直接拉取代码
4. **PM2 自动重启** - 代码更新后需要重启服务