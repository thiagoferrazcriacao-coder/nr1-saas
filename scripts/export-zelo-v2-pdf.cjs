const puppeteer = require('puppeteer');

const input = 'file:///root/snap/chromium/common/zelo-pdf/apresentacao-comercial-zelo-gpt-image.html';
const output = '/root/.hermes/artifacts/Apresentacao_Comercial_Zelo.pdf';

(async () => {
  const browser = await puppeteer.launch({ executablePath: '/snap/bin/chromium', headless: true, args: ['--no-sandbox', '--disable-setuid-sandbox', '--allow-file-access-from-files'] });
  try {
    const page = await browser.newPage();
    await page.goto(input, { waitUntil: 'networkidle0' });
    await page.pdf({ path: output, width: '16in', height: '9in', printBackground: true, preferCSSPageSize: true });
    console.log(output);
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exit(1); });
