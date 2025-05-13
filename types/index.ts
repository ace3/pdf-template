export interface Address {
  name: string;
  street: string;
  area: string;
  city: string;
  country: string;
}

export interface RightAddress {
  manager: string;
  email: string;
  periodStart: string;
  periodEnd: string;
}

// First JSON: Pembelian (Purchase)
export interface PurchaseTransaction {
  type: string;
  number: string;
  amount: string;
  fee: string;
  ppnPercent: string;
  ppnAmount: string;
  subscriptionFeePercent: string;
  subscriptionFeeAmount: string;
  netAmount: string;
  unit: string;
  navPerUnit: string;
}

// Second JSON: Penjualan (Sale)
export interface SaleTransaction {
  type: string;
  number: string;
  unit: string;
  navPerUnit: string;
  amount: string;
  fee: string;
  pphPercent: string;
  pphAmount: string;
  redemptionFeePercent: string;
  redemptionFeeAmount: string;
  netAmount: string;
}

// Second JSON: Bank info
export interface BankInfo {
  name: string;
  account: string;
  accountName: string;
  verifiedAmount: string;
  paymentDateTime: string;
  reference: string;
}

// Third JSON: Transaction history
export interface TransactionHistoryEntry {
  date: string;
  description: string;
  number: string;
  navPerUnit: string;
  unit: string;
  marketValue: string;
}

// Main types for each JSON structure:
export interface PurchaseData {
  leftAddress: Address;
  rightAddress: RightAddress;
  transaction: PurchaseTransaction;
}

export interface SaleData {
  leftAddress: Address;
  rightAddress: RightAddress;
  transaction: SaleTransaction;
  bank: BankInfo;
}

export interface HistoryData {
  leftAddress: Address;
  rightAddress: RightAddress;
  transactions: TransactionHistoryEntry[];
}

export const samplePurchaseData: PurchaseData =
{
  "leftAddress": {
    "name": "BUDI SANTOSO",
    "street": "Jalan Paradise",
    "area": "Sunter Agung, Tanjung Priok",
    "city": "Jakarta Utara",
    "country": "INDONESIA"
  },
  "rightAddress": {
    "manager": "PT Dana Kripto Indonesia",
    "email": "customer@yahoo.com",
    "periodStart": "1 Juni 2025",
    "periodEnd": "30 Juni 2025"
  },
  "transaction": {
    "type": "Pembelian",
    "number": "V6G57NBT",
    "amount": "Rp 5.000.000,00",
    "fee": "Rp 55.500,00",
    "ppnPercent": "0,11%",
    "ppnAmount": "5.500",
    "subscriptionFeePercent": "1%",
    "subscriptionFeeAmount": "50.000",
    "netAmount": "Rp 4.944.500,00",
    "unit": "3.390,84",
    "navPerUnit": "Rp 1.474,56"
  }
}
export const sampleSaleData: SaleData =
{
  "leftAddress": {
    "name": "BUDI SANTOSO",
    "street": "Jalan Paradise",
    "area": "Sunter Agung, Tanjung Priok",
    "city": "Jakarta Utara",
    "country": "INDONESIA"
  },
  "rightAddress": {
    "manager": "PT Dana Kripto Indonesia",
    "email": "customer@yahoo.com",
    "periodStart": "1 Juni 2025",
    "periodEnd": "30 Juni 2025"
  },
  "transaction": {
    "type": "Penjualan",
    "number": "V6G57NBT",
    "unit": "3.390,84",
    "navPerUnit": "Rp 1.474,56",
    "amount": "Rp 5.000.000,00",
    "fee": "Rp 55.500,00",
    "pphPercent": "0,10%",
    "pphAmount": "5.500,00",
    "redemptionFeePercent": "1%",
    "redemptionFeeAmount": "50.000,00",
    "netAmount": "Rp 4.944.500,00"
  },
  "bank": {
    "name": "Bank Central Asia",
    "account": "1234567890",
    "accountName": "Budi Santoso",
    "verifiedAmount": "Rp 4.944.500,00",
    "paymentDateTime": "5 Mei 2025, 11:24 WIB",
    "reference": "8AD9X7WPLT"
  }
}

export const sampleHistoryData: HistoryData = {
  "leftAddress": {
    "name": "BUDI SANTOSO",
    "street": "Jalan Paradise",
    "area": "Sunter Agung, Tanjung Priok",
    "city": "Jakarta Utara",
    "country": "INDONESIA"
  },
  "rightAddress": {
    "manager": "PT Dana Kripto Indonesia",
    "email": "customer@yahoo.com",
    "periodStart": "1 Juni 2025",
    "periodEnd": "30 Juni 2025"
  },
  "transactions": [
    {
      "date": "01-05-2025",
      "description": "Saldo Awal",
      "number": "",
      "navPerUnit": "Rp 1.500,00",
      "unit": "2.000,00",
      "marketValue": "Rp 3.000.000,00"
    },
    {
      "date": "30-06-2025",
      "description": "Saldo Akhir",
      "number": "",
      "navPerUnit": "Rp 1.450,00",
      "unit": "2.000,00",
      "marketValue": "Rp 2.900.000,00"
    }
  ]
}