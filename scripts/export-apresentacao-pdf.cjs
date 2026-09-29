const fs = require('fs');
const path = require('path');
const puppeteer = require('puppeteer');

const output = '/root/.hermes/artifacts/Apresentacao_Geral_Plataforma_Zelo.pdf';
const url = 'http://127.0.0.1:3002/apresentacao';
const tempDir = '/tmp/zelo-apresentacao-pdf';

(async () => {
  fs.mkdirSync(tempDir, { recursive: true });
  const browser = await puppeteer.launch({
    executablePath: '/snap/bin/chromium',
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });
  try {
    const page = await browser.newPage();
    await page.setViewport({ width: 1600, height: 900, deviceScaleFactor: 1 });
    await page.goto(url, { waitUntil: 'networkidle0', timeout: 60000 });
    await page.waitForSelector('h1, h2');

    const images = [];
    for (let i = 0; i < 7; i += 1) {
      const imagePath = path.join(tempDir, `slide-${i + 1}.png`);
      await page.screenshot({ path: imagePath, type: 'png' });
      images.push(fs.readFileSync(imagePath).toString('base64'));
      if (i < 6) {
        await page.keyboard.press('ArrowRight');
        await new Promise(resolve => setTimeout(resolve, 250));
      }
    }

    const pdfPage = await browser.newPage();
    await pdfPage.setContent(`<!doctype html><html><head><style>
      @page { size: 16in 9in; margin: 0; }
      html, body { margin: 0; padding: 0; background: #0f1e2e; }
      .slide { width: 16in; height: 9in; page-break-after: always; overflow: hidden; }
      .slide:last-child { page-break-after: auto; }
      img { width: 100%; height: 100%; object-fit: cover; display: block; }
    </style></head><body>${images.map(image => `<section class="slide"><img src="data:image/png;base64,${image}"></section>`).join('')}</body></html>`, { waitUntil: 'load' });
    await pdfPage.pdf({ path: output, width: '16in', height: '9in', printBackground: true, preferCSSPageSize: true });
    console.log(JSON.stringify({ output, slides: images.length }));
  } finally {
    await browser.close();
  }
})().catch(error => { console.error(error); process.exit(1); });
