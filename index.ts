import type { HistoryData, PurchaseData, SaleData } from "./types";

const express = require('express');
const wkhtmltopdf = require('wkhtmltopdf');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = 3000;
// const PORT = process.env.PORT || 3000;

app.use(express.json());

// Configure wkhtmltopdf to use our wrapper script in Cloud Run environment
if (process.env.NODE_ENV === 'production') {
  wkhtmltopdf.command = '/usr/local/bin/wkhtmltopdf-xvfb';
}

const pembelianHtmlTemplate = fs.readFileSync(path.join(__dirname, 'templates/pembelian.html'), 'utf8');
const penjualanHtmlTemplate = fs.readFileSync(path.join(__dirname, 'templates/penjualan.html'), 'utf8');
const bulananHtmlTemplate = fs.readFileSync(path.join(__dirname, 'templates/bulanan.html'), 'utf8');

// Helper: Replace placeholders in HTML with payload data
function fillPembelianTemplate(payload: any) {
  let html = pembelianHtmlTemplate;

  // Simple variable replacement
  html = html.replace(/{{leftAddress\.name}}/g, payload.leftAddress.name)
    .replace(/{{leftAddress\.street}}/g, payload.leftAddress.street)
    .replace(/{{leftAddress\.area}}/g, payload.leftAddress.area)
    .replace(/{{leftAddress\.city}}/g, payload.leftAddress.city)
    .replace(/{{leftAddress\.country}}/g, payload.leftAddress.country)
    .replace(/{{rightAddress\.manager}}/g, payload.rightAddress.manager)
    .replace(/{{rightAddress\.email}}/g, payload.rightAddress.email)
    .replace(/{{rightAddress\.periodStart}}/g, payload.rightAddress.periodStart)
    .replace(/{{rightAddress\.periodEnd}}/g, payload.rightAddress.periodEnd)
    .replace(/{{transaction\.type}}/g, payload.transaction.type)
    .replace(/{{transaction\.number}}/g, payload.transaction.number)
    .replace(/{{transaction\.amount}}/g, payload.transaction.amount)
    .replace(/{{transaction\.fee}}/g, payload.transaction.fee)
    .replace(/{{transaction\.ppnPercent}}/g, payload.transaction.ppnPercent)
    .replace(/{{transaction\.ppnAmount}}/g, payload.transaction.ppnAmount)
    .replace(/{{transaction\.subscriptionFeePercent}}/g, payload.transaction.subscriptionFeePercent)
    .replace(/{{transaction\.subscriptionFeeAmount}}/g, payload.transaction.subscriptionFeeAmount)
    .replace(/{{transaction\.netAmount}}/g, payload.transaction.netAmount)
    .replace(/{{transaction\.unit}}/g, payload.transaction.unit)
    .replace(/{{transaction\.navPerUnit}}/g, payload.transaction.navPerUnit);

  return html;
}

function fillPenjualanTemplate(payload: any) {
  let html = penjualanHtmlTemplate;

  html = html.replace(/{{leftAddress\.name}}/g, payload.leftAddress.name)
    .replace(/{{leftAddress\.street}}/g, payload.leftAddress.street)
    .replace(/{{leftAddress\.area}}/g, payload.leftAddress.area)
    .replace(/{{leftAddress\.city}}/g, payload.leftAddress.city)
    .replace(/{{leftAddress\.country}}/g, payload.leftAddress.country)
    .replace(/{{rightAddress\.manager}}/g, payload.rightAddress.manager)
    .replace(/{{rightAddress\.email}}/g, payload.rightAddress.email)
    .replace(/{{rightAddress\.periodStart}}/g, payload.rightAddress.periodStart)
    .replace(/{{rightAddress\.periodEnd}}/g, payload.rightAddress.periodEnd)
    .replace(/{{transaction\.type}}/g, payload.transaction.type)
    .replace(/{{transaction\.number}}/g, payload.transaction.number)
    .replace(/{{transaction\.unit}}/g, payload.transaction.unit)
    .replace(/{{transaction\.navPerUnit}}/g, payload.transaction.navPerUnit)
    .replace(/{{transaction\.amount}}/g, payload.transaction.amount)
    .replace(/{{transaction\.fee}}/g, payload.transaction.fee)
    .replace(/{{transaction\.pphPercent}}/g, payload.transaction.pphPercent)
    .replace(/{{transaction\.pphAmount}}/g, payload.transaction.pphAmount)
    .replace(/{{transaction\.redemptionFeePercent}}/g, payload.transaction.redemptionFeePercent)
    .replace(/{{transaction\.redemptionFeeAmount}}/g, payload.transaction.redemptionFeeAmount)
    .replace(/{{transaction\.netAmount}}/g, payload.transaction.netAmount)
    .replace(/{{bank\.name}}/g, payload.bank.name)
    .replace(/{{bank\.account}}/g, payload.bank.account)
    .replace(/{{bank\.accountName}}/g, payload.bank.accountName)
    .replace(/{{bank\.verifiedAmount}}/g, payload.bank.verifiedAmount)
    .replace(/{{bank\.paymentDateTime}}/g, payload.bank.paymentDateTime)
    .replace(/{{bank\.reference}}/g, payload.bank.reference);

  return html;
}

function fillBulananTemplate(payload: any) {
  let html = bulananHtmlTemplate;

  html = html.replace(/{{leftAddress\.name}}/g, payload.leftAddress.name)
    .replace(/{{leftAddress\.street}}/g, payload.leftAddress.street)
    .replace(/{{leftAddress\.area}}/g, payload.leftAddress.area)
    .replace(/{{leftAddress\.city}}/g, payload.leftAddress.city)
    .replace(/{{leftAddress\.country}}/g, payload.leftAddress.country)
    .replace(/{{rightAddress\.manager}}/g, payload.rightAddress.manager)
    .replace(/{{rightAddress\.email}}/g, payload.rightAddress.email)
    .replace(/{{rightAddress\.periodStart}}/g, payload.rightAddress.periodStart)
    .replace(/{{rightAddress\.periodEnd}}/g, payload.rightAddress.periodEnd);

  // Replace transactions array
  const txRows = (payload.transactions || []).map(tx => `
    <tr>
      <td class="c15" colspan="1" rowspan="1">
        <p class="c10"><span class="c2">${tx.date}</span></p>
      </td>
      <td class="c13" colspan="1" rowspan="1">
        <p class="c10"><span class="c2">${tx.description}</span></p>
      </td>
      <td class="c4" colspan="1" rowspan="1">
        <p class="c11 c14"><span class="c2">${tx.number || ''}</span></p>
      </td>
      <td class="c4" colspan="1" rowspan="1">
        <p class="c8"><span class="c2">${tx.navPerUnit}</span></p>
      </td>
      <td class="c4" colspan="1" rowspan="1">
        <p class="c8 c17"><span class="c2">${tx.unit}</span></p>
      </td>
      <td class="c4" colspan="1" rowspan="1">
        <p class="c8"><span class="c2">${tx.marketValue}</span></p>
      </td>
    </tr>
  `).join('');
  html = html.replace(/{{#transactions}}[\s\S]*{{\/transactions}}/, txRows);

  return html;
}

// Enhanced PDF generation function with better error handling
function generatePdfFromHtml(html: string, options = {}): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];

    try {
      wkhtmltopdf.command = '/usr/local/bin/wkhtmltopdf-xvfb';
      const pdfStream = wkhtmltopdf(html, {
        pageSize: 'A4',
        printMediaType: true,
        // Additional options that might help with rendering
        disableJavascript: true,
        noStopSlowScripts: true,
        encoding: 'UTF-8',
        ...options
      });

      pdfStream
        .on('data', chunk => chunks.push(chunk))
        .on('end', () => {
          if (chunks.length === 0) {
            reject(new Error('PDF generation produced empty result'));
          } else {
            resolve(Buffer.concat(chunks));
          }
        })
        .on('error', (err) => {
          console.error('PDF generation error:', err);
          reject(err);
        });

    } catch (err) {
      console.error('Exception during PDF generation setup:', err);
      reject(err);
    }
  });
}

app.post('/pembelian', async (req, res) => {
  try {
    const payload: PurchaseData = req.body;
    console.log('Received payload:', payload);
    const html = fillPembelianTemplate(payload);
    let pdfBuffer;
    try {
      pdfBuffer = await generatePdfFromHtml(html);
    }
    catch (error) {
      console.error('Error generating PDF:', error);
      return res.status(500).json({ error: 'Error generating PDF', details: error.toString() });
    }

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename=Surat_Konfirmasi_Pembelian.pdf');
    res.send(pdfBuffer);
  } catch (error) {
    console.error('Pembelian endpoint error:', error);
    res.status(500).json({ error: 'Error generating PDF', details: error.toString() });
  }
});

app.post('/penjualan', async (req, res) => {
  try {
    const payload: SaleData = req.body;
    const html = fillPenjualanTemplate(payload);
    const pdfBuffer = await generatePdfFromHtml(html);
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename=Surat_Konfirmasi_Penjualan.pdf');
    res.send(pdfBuffer);
  } catch (error) {
    console.error('Penjualan endpoint error:', error);
    res.status(500).json({ error: 'Error generating PDF', details: error.toString() });
  }
});

app.post('/bulanan', async (req, res) => {
  try {
    const payload: HistoryData = req.body;
    const html = fillBulananTemplate(payload);
    const pdfBuffer = await generatePdfFromHtml(html);
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename=Surat_Konfirmasi_Bulanan.pdf');
    res.send(pdfBuffer);
  } catch (error) {
    console.error('Bulanan endpoint error:', error);
    res.status(500).json({ error: 'Error generating PDF', details: error.toString() });
  }
});

// Health check endpoint for Cloud Run
app.get('/health', (req, res) => {
  res.status(200).send('Service is healthy');
});

try {
  app.listen(PORT, () => {
    console.log(`PDF API server running on http://0.0.0.0:${PORT}`);
  });
} catch (error) {
  console.error('Server startup error:', error);
  process.exit(1);
}