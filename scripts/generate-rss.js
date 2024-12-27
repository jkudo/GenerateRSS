/**
 * scripts/generate-rss.js
 *
 * 1. dummy.csv を読み込み (Title, Link, Description, Author, Category)
 * 2. 既存の rss.xml を解析し、<item> を取り出して配列化
 * 3. CSVからランダムに1件を先頭に追加 (最新が上)
 * 4. 合計10件になるように古いものを削除 (末尾を削除)
 * 5. rss.xml を再構築して保存 (<author> と <category> を含む)
 */

const fs = require('fs');
const path = require('path');
const { parse } = require('csv-parse/sync'); // npm install csv-parse

// 1. CSV (dummy.csv) を読み込み、ランダムに1件を選択
const csvPath = path.join(__dirname, '..', 'dummy.csv');
const csvContent = fs.readFileSync(csvPath, 'utf-8');

const records = parse(csvContent, {
  columns: true,
  skip_empty_lines: true,
});

const randomIndex = Math.floor(Math.random() * records.length);
const chosen = records[randomIndex];

// 2. 既存の rss.xml (なければ新規作成) を読み込み、既存の <item> を配列化
const rssPath = path.join(__dirname, '..', 'rss.xml');
let existingItems = [];

if (fs.existsSync(rssPath)) {
  const existingContent = fs.readFileSync(rssPath, 'utf-8');
  const itemRegex = /<item>([\s\S]*?)<\/item>/g;
  let match;
  while ((match = itemRegex.exec(existingContent)) !== null) {
    const itemBlock = match[1];

    const titleMatch = itemBlock.match(/<title>([\s\S]*?)<\/title>/);
    const linkMatch = itemBlock.match(/<link>([\s\S]*?)<\/link>/);
    const descMatch = itemBlock.match(/<description>([\s\S]*?)<\/description>/);
    const pubDateMatch = itemBlock.match(/<pubDate>([\s\S]*?)<\/pubDate>/);
    const authorMatch = itemBlock.match(/<author>([\s\S]*?)<\/author>/);
    const categoryMatch = itemBlock.match(/<category>([\s\S]*?)<\/category>/);

    existingItems.push({
      title: titleMatch ? titleMatch[1] : '',
      link: linkMatch ? linkMatch[1] : '',
      description: descMatch ? descMatch[1] : '',
      pubDate: pubDateMatch ? pubDateMatch[1] : '',
      author: authorMatch ? authorMatch[1] : '',
      category: categoryMatch ? categoryMatch[1] : '',
    });
  }
}

// 3. 新しいアイテムを先頭に追加 (最新が上)
existingItems.unshift({
  title: chosen.Title,
  link: chosen.Link,
  description: chosen.Description,
  pubDate: new Date().toUTCString(),
  author: chosen.Author,
  category: chosen.Category,
});

// 4. 10件を超えたら古いものを削除 (先頭が最新→末尾が古い)
if (existingItems.length > 10) {
  existingItems = existingItems.slice(0, 10);
}

// 5. RSS 全体を再構築して書き出し
const rssHeader = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
<channel>
  <title>Random RSS</title>
  <link>https://example.com</link>
  <description>Randomly picked articles (up to 10)</description>
  <language>ja</language>
`;

const rssFooter = `
</channel>
</rss>
`;

let rssItems = '';
for (const item of existingItems) {
  rssItems += `
  <item>
    <title>${item.title}</title>
    <link>${item.link}</link>
    <description>${item.description}</description>
    <pubDate>${item.pubDate}</pubDate>
    <author>${item.author}</author>
    <category>${item.category}</category>
  </item>`;
}

const newRssContent = rssHeader + rssItems + rssFooter;
fs.writeFileSync(rssPath, newRssContent, 'utf-8');

console.log('RSS updated successfully with one random article (including Author & Category) on top!');
