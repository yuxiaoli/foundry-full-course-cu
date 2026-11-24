# Web3 学习笔记静态站

入口为 `notes/web3-basics/README.md`。构建按该索引读取 26 章正文，另生成配图索引和验收记录。目录顺序、章节标题、练习内容、图注和链接来自书稿。中文和英文全文检索使用构建生成的本地索引。

## 本地构建和预览

在仓库的 `site/` 目录用 Node.js 22 运行以下命令。

```powershell
npm ci
$env:SITE_BASE_PATH = '/'
npm run build
npm run check
python -m http.server 8000 --bind 127.0.0.1 --directory dist
```

打开 [本地预览](http://127.0.0.1:8000/)。GitHub Actions 从 Pages 配置读取实际站点域名和 `/foundry-full-course-cu/` 基路径。生产输出位于 `site/dist/`，每章生成独立的静态入口。

## 发布

`develop` 上的书稿、站点和工作流改动会触发构建、验收和发布。Pages 的发布来源为 GitHub Actions，`github-pages` 部署环境允许 `develop`。部署使用工作流内置的 `GITHUB_TOKEN`。

在仓库根目录可用现有 GitHub CLI 登录手动验收。将 `deploy` 改为 `true` 即会在验收通过后发布。

```powershell
gh workflow run web3-book-pages.yml --ref develop -f deploy=false
```

源码构建只接受目录列出的章节、26 张插图和指定站点资产。每次构建清空产物目录。参考资料的书名、出处与公开一手链接可出现在正文或图注，内部文件和路径不进入网页、搜索索引、站点地图或部署包。
