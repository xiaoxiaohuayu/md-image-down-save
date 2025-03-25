import os
import hashlib
import requests
from pathlib import Path

def find_markdown_files(directory):
    """递归获取所有md文件"""
    results = []
    for root, dirs, files in os.walk(directory):
        if 'node_modules' in root:
            continue
        for file in files:
            if file.endswith('.md'):
                results.append(os.path.join(root, file))
    return results

def extract_image_urls(content):
    """从markdown提取图片链接"""
    import re
    pattern = r'!\[.*?\]\((.*?)\)'
    return re.findall(pattern, content)

def generate_filename(url):
    """生成文件名"""
    # 从 URL 中提取最后一部分作为文件名
    filename = url.split('/')[-1]
    
    # 如果无法获取文件名，则使用哈希方法
    if not filename or filename.strip() == '':
        ext = os.path.splitext(url)[1] or '.png'
        hash_value = hashlib.md5(url.encode()).hexdigest()
        return hash_value[:8] + ext
    
    return filename

def download_image(url, filename):
    """下载图片"""
    try:
        response = requests.get(url)
        response.raise_for_status()
        
        # 确保 images 目录存在
        images_dir = Path('images')
        images_dir.mkdir(exist_ok=True)
        
        image_path = images_dir / filename
        with open(image_path, 'wb') as f:
            f.write(response.content)
        print(f'Downloaded: {filename}')
    except Exception as error:
        print(f'Error downloading {url}: {str(error)}')

async def main():
    """主函数"""
    md_files = find_markdown_files('docs')
    image_map = {}
    
    for file in md_files:
        with open(file, 'r', encoding='utf-8') as f:
            content = f.read()
            urls = extract_image_urls(content)
            
            for url in urls:
                if url.startswith('http'):
                    filename = generate_filename(url)
                    image_map[url] = filename
    
    # 保存映射关系
    with open('image-map.txt', 'w', encoding='utf-8') as f:
        f.write('\n'.join(f'{url}\t{filename}' for url, filename in image_map.items()))
    
    print(f'找到 {len(image_map)} 个图片链接')
    print('映射关系已保存到 image-map.txt')
    
    # 下载所有图片
    print('开始下载图片...')
    import asyncio
    import aiohttp
    
    async def download_with_aiohttp(url, filename):
        async with aiohttp.ClientSession() as session:
            try:
                async with session.get(url) as response:
                    if response.status == 200:
                        content = await response.read()
                        images_dir = Path('images')
                        images_dir.mkdir(exist_ok=True)
                        image_path = images_dir / filename
                        with open(image_path, 'wb') as f:
                            f.write(content)
                        print(f'Downloaded: {filename}')
                    else:
                        print(f'Failed to download {url}: {response.status}')
            except Exception as error:
                print(f'Error downloading {url}: {str(error)}')
    
    tasks = [download_with_aiohttp(url, filename) for url, filename in image_map.items()]
    await asyncio.gather(*tasks)
    print('所有图片下载完成！')

if __name__ == '__main__':
    import asyncio
    asyncio.run(main()) 