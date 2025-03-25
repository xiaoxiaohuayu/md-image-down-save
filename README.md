# Markdown Image Downloader

一个用于从 Markdown 文件中提取并下载图片的命令行工具。

## 功能特点

- 递归扫描目录中的所有 Markdown 文件
- 提取 Markdown 文件中的图片链接
- 自动下载图片并保存到指定目录
- 生成图片 URL 和文件名的映射关系
- 支持异步下载，提高效率

## 安装

```bash
npm install md-image-down-save
```

## 使用方法

### 全局安装

```bash
npm install -g md-image-down-save
md-image-down-save
```

### 作为项目依赖

```bash
npm install md-image-down-save
```

然后在你的代码中：

```javascript
import { main } from 'md-image-down-save';

// 运行主函数
main().catch(console.error);
```

## 配置

默认情况下，工具会：
- 扫描 `docs` 目录下的所有 Markdown 文件
- 将图片保存到 `images` 目录
- 生成 `image-map.txt` 文件保存映射关系

## 输出

- 下载的图片将保存在 `images` 目录中
- 图片 URL 和文件名的映射关系将保存在 `image-map.txt` 文件中
- 控制台会显示下载进度和状态信息

## 许可证

MIT 