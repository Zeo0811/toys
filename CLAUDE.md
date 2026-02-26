# Claude Code 项目配置

## GitHub 认证
每次会话开始时从 .env 文件加载 GH_TOKEN：
```bash
export $(cat .env | xargs)
```

## 工作流
1. 在 `claude/` 分支开发、commit、push
2. 用 `gh pr create` 创建 PR
3. 用 `gh pr merge --merge` 合并到 main
4. Render 自动部署

## 语言
始终使用中文回复。
