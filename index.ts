const express = require('express');
const html_to_pdf = require('html-pdf-node');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = 3000;

app.use(express.json());

const pembelianHtmlTemplate = fs.readFileSync(path.join(__dirname, 'pembelian.html'), 'utf8');
const penjualanHtmlTemplate = fs.readFileSync(path.join(__dirname, 'penjualan.html'), 'utf8');
const bulananHtmlTemplate = fs.readFileSync(path.join(__dirname, 'bulanan.html'), 'utf8');

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
    .replace(/{{rightAddress\.transactionDate}}/g, payload.rightAddress.transactionDate)
    // .replace(/{{rightAddress\.periodStart}}/g, payload.rightAddress.periodStart)
    // .replace(/{{rightAddress\.periodEnd}}/g, payload.rightAddress.periodEnd)
    .replace(/{{transaction\.type}}/g, payload.transaction.type)
    .replace(/{{transaction\.number}}/g, payload.transaction.number)
    .replace(/{{transaction\.amount}}/g, payload.transaction.amount)
    .replace(/{{transaction\.fee}}/g, payload.transaction.fee)
    .replace(/{{transaction\.ppnPercent}}/g, payload.transaction.ppnPercent)
    .replace(/{{transaction\.ppnAmount}}/g, payload.transaction.ppnAmount)
    .replace(/{{transaction\.product}}/g, payload.transaction.product)
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
    .replace(/{{rightAddress\.transactionDate}}/g, payload.rightAddress.transactionDate)
    // .replace(/{{rightAddress\.periodStart}}/g, payload.rightAddress.periodStart)
    // .replace(/{{rightAddress\.periodEnd}}/g, payload.rightAddress.periodEnd)
    .replace(/{{transaction\.type}}/g, payload.transaction.type)
    .replace(/{{transaction\.number}}/g, payload.transaction.number)
    .replace(/{{transaction\.unit}}/g, payload.transaction.unit)
    .replace(/{{transaction\.navPerUnit}}/g, payload.transaction.navPerUnit)
    .replace(/{{transaction\.amount}}/g, payload.transaction.amount)
    .replace(/{{transaction\.fee}}/g, payload.transaction.fee)
    .replace(/{{transaction\.pphPercent}}/g, payload.transaction.pphPercent)
    .replace(/{{transaction\.pphAmount}}/g, payload.transaction.pphAmount)
    .replace(/{{transaction\.product}}/g, payload.transaction.product)
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
    .replace(/{{product}}/g, payload.product)
    .replace(/{{rightAddress\.periodStart}}/g, payload.rightAddress.periodStart)
    .replace(/{{rightAddress\.periodEnd}}/g, payload.rightAddress.periodEnd);

  const txRows = (payload.transactions || []).map(tx => {
    if (tx.noActivity) {
      return `
        <tr class="c18">
          <td class="c20" colspan="6" rowspan="1">
            <p class="c10"><span class="c2">TIDAK TERDAPAT AKTIVITAS TRANSAKSI SELAMA PERIODE INI</span></p>
          </td>
        </tr>
      `;
    }
    return `
      <tr>
        <td class="c15" colspan="1" rowspan="1">
          <p class="c10"><span class="c2">${tx.date || ''}</span></p>
        </td>
        <td class="c13" colspan="1" rowspan="1">
          <p class="c10"><span class="c2">${tx.description || ''}</span></p>
        </td>
        <td class="c4" colspan="1" rowspan="1">
          <p class="c11 c14"><span class="c2">${tx.number || ''}</span></p>
        </td>
        <td class="c4" colspan="1" rowspan="1">
          <p class="c8"><span class="c2">${tx.navPerUnit || ''}</span></p>
        </td>
        <td class="c4" colspan="1" rowspan="1">
          <p class="c8 c17"><span class="c2">${tx.unit || ''}</span></p>
        </td>
        <td class="c4" colspan="1" rowspan="1">
          <p class="c8"><span class="c2">${tx.marketValue || ''}</span></p>
        </td>
      </tr>
    `;
  }).join('');
  html = html.replace(/{{#transactions}}[\s\S]*{{\/transactions}}/, txRows);

  return html;
}

app.post('/pembelian', async (req, res) => {
  try {
    const payload = req.body;
    const asHtml = req.query.asHtml || false; // or use req.query.asHtml for query param

    const html = fillPembelianTemplate(payload);

    if (asHtml) {
      res.setHeader('Content-Type', 'text/html');
      res.send(html);
      return;
    }

    const options = {
      format: 'A4',
      printBackground: true,
      args: [
        '--no-sandbox',
        // '--single-process',
        '--disable-gpu',
        '--disable-dev-shm-usage'
      ]
    };
    const file = { content: html };
    const pdfBuffer = await html_to_pdf.generatePdf(file, options);
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename=Surat_Konfirmasi_Pembelian.pdf');
    res.send(pdfBuffer);
  } catch (error) {
    res.status(500).json({ error: 'Error generating PDF', details: error.toString() });
  }
});

app.post('/penjualan', async (req, res) => {
  try {
    const payload = req.body;
    const asHtml = req.query.asHtml || false; // or use req.query.asHtml for query param


    const html = fillPenjualanTemplate(payload);

    if (asHtml) {
      res.setHeader('Content-Type', 'text/html');
      res.send(html);
      return;
    }
    const options = { format: 'A4', printBackground: true };
    const file = { content: html };
    const pdfBuffer = await html_to_pdf.generatePdf(file, options);
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename=Surat_Konfirmasi_Penjualan.pdf');
    res.send(pdfBuffer);
  } catch (error) {
    res.status(500).json({ error: 'Error generating PDF', details: error.toString() });
  }
});


app.post('/bulanan', async (req, res) => {
  try {
    const payload = req.body;
    const asHtml = req.query.asHtml || false; // or use req.query.asHtml for query param

    const html = fillBulananTemplate(payload);
    if (asHtml) {
      res.setHeader('Content-Type', 'text/html');
      res.send(html);
      return;
    }
    const options = { format: 'A4', printBackground: true };
    const file = { content: html };
    const pdfBuffer = await html_to_pdf.generatePdf(file, options);
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename=Surat_Konfirmasi_Bulanan.pdf');
    res.send(pdfBuffer);
  } catch (error) {
    res.status(500).json({ error: 'Error generating PDF', details: error.toString() });
  }
});

app.listen(PORT, () => {
  console.log(`PDF API server running on http://localhost:${PORT}`);
});