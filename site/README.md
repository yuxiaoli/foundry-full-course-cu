# Web3 入门书静态站

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

在 Actions 的 Web3 入门书工作流中手动运行时，选择 develop。默认只执行构建和验收。勾选 deploy 后同时发布。

源码构建仅输入书稿、配图和站点资产。指向本机参考书、来源规划和写作进度的引用保留原文标签与路径说明。线上产物包含 HTML、26 张插图、样式、脚本及搜索索引。
