import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import fetch from 'node-fetch';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// 递归获取所有md文件
function findMarkdownFiles(dir) {
    let results = [];
    const files = fs.readdirSync(dir);
    
    for(const file of files) {
        const filePath = path.join(dir, file);
        const stat = fs.statSync(filePath);
        
        if(stat.isDirectory() && !filePath.includes('node_modules')) {
            results = results.concat(findMarkdownFiles(filePath));
        } else if(path.extname(file) === '.md') {
            results.push(filePath);
        }
    }
    
    return results;
}

// 从markdown提取图片链接
function extractImageUrls(content) {
    const regex = /!\[.*?\]\((.*?)\)/g;
    const urls = [];
    let match;
    
    while((match = regex.exec(content)) !== null) {
        urls.push(match[1]);
    }
    
    return urls;
}

// 生成文件名
function generateFileName(url) {
    // 从 URL 中提取最后一部分作为文件名
    const urlParts = url.split('/');
    const fileName = urlParts[urlParts.length - 1];
    
    // 如果无法获取文件名，则使用之前的哈希方法
    if (!fileName || fileName.trim() === '') {
        const ext = path.extname(url) || '.png';
        const hash = crypto.createHash('md5').update(url).digest('hex');
        return hash.substring(0, 8) + ext;
    }
    
    return fileName;
}

// 下载图片
async function downloadImage(url, fileName, outputDir = 'images') {
    try {
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`Failed to fetch ${url}: ${response.statusText}`);
        }
        const buffer = await response.buffer();
        const imagePath = path.join(outputDir, fileName);
        
        // 确保输出目录存在
        if (!fs.existsSync(outputDir)) {
            fs.mkdirSync(outputDir, { recursive: true });
        }
        
        fs.writeFileSync(imagePath, buffer);
        console.log(`Downloaded: ${fileName}`);
    } catch (error) {
        console.error(`Error downloading ${url}:`, error.message);
    }
}

// 主函数
export async function main(options = {}) {
    const {
        inputDir = 'docs',
        outputDir = 'images',
        mapFile = 'image-map.txt'
    } = options;

    const mdFiles = findMarkdownFiles(inputDir);
    const imageMap = new Map();
    
    for(const file of mdFiles) {
        const content = fs.readFileSync(file, 'utf-8');
        const urls = extractImageUrls(content);
        
        for(const url of urls) {
            if(url.startsWith('http')) {
                const fileName = generateFileName(url);
                imageMap.set(url, fileName);
            }
        }
    }
    
    // 保存映射关系
    const output = Array.from(imageMap.entries())
        .map(([url, fileName]) => `${url}\t${fileName}`)
        .join('\n');
        
    fs.writeFileSync(mapFile, output);
    
    console.log(`找到 ${imageMap.size} 个图片链接`);
    console.log(`映射关系已保存到 ${mapFile}`);
    
    // 下载所有图片
    console.log('开始下载图片...');
    const downloads = Array.from(imageMap.entries()).map(([url, fileName]) => 
        downloadImage(url, fileName, outputDir)
    );
    
    await Promise.all(downloads);
    console.log('所有图片下载完成！');
}

// 如果直接运行此文件
if (process.argv[1] === fileURLToPath(import.meta.url)) {
    main().catch(console.error);
}