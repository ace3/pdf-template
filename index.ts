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

// {
//   "leftAddress": {
//     "name": "BUDI SANTOSO",
//     "street": "Jalan Paradise",
//     "area": "Sunter Agung, Tanjung Priok",
//     "city": "Jakarta Utara",
//     "country": "INDONESIA"
//   },
//   "rightAddress": {
//     "manager": "PT Dana Kripto Indonesia",
//     "email": "customer@yahoo.com",
//     "periodStart": "1 Juni 2025",
//     "periodEnd": "30 Juni 2025"
//   },
//   "transaction": {
//     "type": "Pembelian",
//     "number": "V6G57NBT",
//     "amount": "Rp 5.000.000,00",
//     "fee": "Rp 55.500,00",
//     "ppnPercent": "0,11%",
//     "ppnAmount": "5.500",
//     "subscriptionFeePercent": "1%",
//     "subscriptionFeeAmount": "50.000",
//     "netAmount": "Rp 4.944.500,00",
//     "unit": "3.390,84",
//     "navPerUnit": "Rp 1.474,56"
//   }
// }
app.post('/pembelian', async (req, res) => {
  try {
    const payload = req.body;
    const html = fillPembelianTemplate(payload);
    const options = { format: 'A4', printBackground: true };
    const file = { content: html };
    const pdfBuffer = await html_to_pdf.generatePdf(file, options);
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename=Surat_Konfirmasi_Pembelian.pdf');
    res.send(pdfBuffer);
  } catch (error) {
    res.status(500).json({ error: 'Error generating PDF', details: error.toString() });
  }
});

// {
//   "leftAddress": {
//     "name": "BUDI SANTOSO",
//     "street": "Jalan Paradise",
//     "area": "Sunter Agung, Tanjung Priok",
//     "city": "Jakarta Utara",
//     "country": "INDONESIA"
//   },
//   "rightAddress": {
//     "manager": "PT Dana Kripto Indonesia",
//     "email": "customer@yahoo.com",
//     "periodStart": "1 Juni 2025",
//     "periodEnd": "30 Juni 2025"
//   },
//   "transaction": {
//     "type": "Penjualan",
//     "number": "V6G57NBT",
//     "unit": "3.390,84",
//     "navPerUnit": "Rp 1.474,56",
//     "amount": "Rp 5.000.000,00",
//     "fee": "Rp 55.500,00",
//     "pphPercent": "0,10%",
//     "pphAmount": "5.500,00",
//     "redemptionFeePercent": "1%",
//     "redemptionFeeAmount": "50.000,00",
//     "netAmount": "Rp 4.944.500,00"
//   },
//   "bank": {
//     "name": "Bank Central Asia",
//     "account": "1234567890",
//     "accountName": "Budi Santoso",
//     "verifiedAmount": "Rp 4.944.500,00",
//     "paymentDateTime": "5 Mei 2025, 11:24 WIB",
//     "reference": "8AD9X7WPLT"
//   }
// }
app.post('/penjualan', async (req, res) => {
  try {
    const payload = req.body;
    const html = fillPenjualanTemplate(payload);
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

// {
//   "leftAddress": {
//     "name": "BUDI SANTOSO",
//     "street": "Jalan Paradise",
//     "area": "Sunter Agung, Tanjung Priok",
//     "city": "Jakarta Utara",
//     "country": "INDONESIA"
//   },
//   "rightAddress": {
//     "manager": "PT Dana Kripto Indonesia",
//     "email": "customer@yahoo.com",
//     "periodStart": "1 Juni 2025",
//     "periodEnd": "30 Juni 2025"
//   },
//   "transactions": [
//     {
//       "date": "01-05-2025",
//       "description": "Saldo Awal",
//       "number": "",
//       "navPerUnit": "Rp 1.500,00",
//       "unit": "2.000,00",
//       "marketValue": "Rp 3.000.000,00"
//     },
//     {
//       "date": "30-06-2025",
//       "description": "Saldo Akhir",
//       "number": "",
//       "navPerUnit": "Rp 1.450,00",
//       "unit": "2.000,00",
//       "marketValue": "Rp 2.900.000,00"
//     }
//   ]
// }
app.post('/bulanan', async (req, res) => {
  try {
    const payload = req.body;
    const html = fillBulananTemplate(payload);
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