// Web Bluetooth API Direct ESC/POS Thermal Printer Driver

export interface PrintableReceiptData {
  storeName: string;
  storeAddress?: string;
  orderNumber: string;
  date: string;
  cashierName: string;
  customerName?: string;
  tableNumber?: string;
  channel: string;
  items: Array<{
    name: string;
    variantName?: string;
    qty: number;
    price: number;
    subtotal: number;
    addons?: Array<{ name: string; price: number }>;
  }>;
  subtotal: number;
  discount: number;
  total: number;
  paymentMethod: string;
  splitPayments?: Array<{ method: string; amount: number }>;
  amountPaid: number;
  change: number;
}

export interface PrintableRefundData {
  storeName: string;
  storeAddress?: string;
  orderNumber: string;
  refundDate: string;
  approvedBy: string;
  reason: string;
  refundMethod: string;
  refundAmount: number;
  items?: Array<{
    name: string;
    variantName?: string;
    qty: number;
    subtotal: number;
  }>;
}

class BluetoothPrinterDriver {
  private device: any = null;
  private characteristic: any = null;

  public async connect(): Promise<boolean> {
    try {
      if (typeof window === "undefined" || !("bluetooth" in navigator)) {
        throw new Error("Web Bluetooth API tidak didukung di browser ini.");
      }

      // Request bluetooth thermal printer device
      const device = await (navigator as any).bluetooth.requestDevice({
        acceptAllDevices: true,
        optionalServices: ["000018f0-0000-1000-8000-00805f9b34fb", "00001101-0000-1000-8000-00805f9b34fb"],
      });

      const server = await device.gatt.connect();
      const services = await server.getPrimaryServices();
      
      if (services.length === 0) {
        throw new Error("Printer bluetooth tidak memiliki service yang valid.");
      }

      const characteristics = await services[0].getCharacteristics();
      this.characteristic = characteristics[0];
      this.device = device;
      return true;
    } catch (error) {
      console.warn("Bluetooth Connection Warning (Fallback to Print Dialog):", error);
      return false;
    }
  }

  public async printReceipt(data: PrintableReceiptData): Promise<void> {
    const isConnected = this.characteristic || (await this.connect());
    
    // ESC/POS commands
    const ESC = 0x1b;
    const GS = 0x1d;
    const encoder = new TextEncoder();
    const commands: number[] = [];

    // Initialize printer
    commands.push(ESC, 0x40);

    // Center alignment
    commands.push(ESC, 0x61, 1);
    // Double height & width for store name
    commands.push(GS, 0x21, 0x11);
    commands.push(...encoder.encode(`${data.storeName}\n`));
    commands.push(GS, 0x21, 0x00);
    if (data.storeAddress) {
      commands.push(...encoder.encode(`${data.storeAddress}\n`));
    }
    commands.push(...encoder.encode("--------------------------------\n"));

    // Left alignment for metadata
    commands.push(ESC, 0x61, 0);
    commands.push(...encoder.encode(`Nota : ${data.orderNumber}\n`));
    commands.push(...encoder.encode(`Tgl  : ${data.date}\n`));
    commands.push(...encoder.encode(`Kasir: ${data.cashierName}\n`));
    if (data.customerName) commands.push(...encoder.encode(`Cust : ${data.customerName}\n`));
    if (data.tableNumber) commands.push(...encoder.encode(`Meja : ${data.tableNumber}\n`));
    commands.push(...encoder.encode(`Tipe : ${data.channel}\n`));
    commands.push(...encoder.encode("--------------------------------\n"));

    // Items
    for (const item of data.items) {
      const title = `${item.name}${item.variantName ? ` (${item.variantName})` : ''}`;
      commands.push(...encoder.encode(`${title}\n`));
      const lineRight = `${item.qty} x ${item.price.toLocaleString("id-ID")} = ${item.subtotal.toLocaleString("id-ID")}\n`;
      commands.push(...encoder.encode(lineRight));
      if (item.addons && item.addons.length > 0) {
        for (const addon of item.addons) {
          commands.push(...encoder.encode(` + ${addon.name} (+Rp${addon.price.toLocaleString("id-ID")})\n`));
        }
      }
    }

    commands.push(...encoder.encode("--------------------------------\n"));
    commands.push(...encoder.encode(`Subtotal : Rp ${data.subtotal.toLocaleString("id-ID")}\n`));
    if (data.discount > 0) {
      commands.push(...encoder.encode(`Diskon   : -Rp ${data.discount.toLocaleString("id-ID")}\n`));
    }

    // Bold Total
    commands.push(ESC, 0x45, 1);
    commands.push(...encoder.encode(`TOTAL    : Rp ${data.total.toLocaleString("id-ID")}\n`));
    commands.push(ESC, 0x45, 0);

    if (data.splitPayments && data.splitPayments.length > 0) {
      commands.push(...encoder.encode(`Bayar (SPLIT):\n`));
      for (const sp of data.splitPayments) {
        commands.push(...encoder.encode(` - ${sp.method}: Rp ${sp.amount.toLocaleString("id-ID")}\n`));
      }
    } else {
      commands.push(...encoder.encode(`Bayar (${data.paymentMethod}): Rp ${data.amountPaid.toLocaleString("id-ID")}\n`));
    }

    if (data.change > 0) {
      commands.push(...encoder.encode(`Kembali  : Rp ${data.change.toLocaleString("id-ID")}\n`));
    }
    commands.push(...encoder.encode("--------------------------------\n"));

    // Footer Center
    commands.push(ESC, 0x61, 1);
    commands.push(...encoder.encode("Terima Kasih Atas Kunjungan Anda!\n\n\n\n"));
    commands.push(GS, 0x56, 66, 0); // Cut paper

    if (isConnected && this.characteristic) {
      const dataBuffer = new Uint8Array(commands);
      const chunkSize = 512;
      for (let i = 0; i < dataBuffer.length; i += chunkSize) {
        const chunk = dataBuffer.slice(i, i + chunkSize);
        await this.characteristic.writeValue(chunk);
      }
    } else {
      window.print();
    }
  }

  public async printRefundReceipt(data: PrintableRefundData): Promise<void> {
    const isConnected = this.characteristic || (await this.connect());
    
    const ESC = 0x1b;
    const GS = 0x1d;
    const encoder = new TextEncoder();
    const commands: number[] = [];

    commands.push(ESC, 0x40);

    // Center alignment
    commands.push(ESC, 0x61, 1);
    commands.push(GS, 0x21, 0x11);
    commands.push(...encoder.encode(`${data.storeName}\n`));
    commands.push(GS, 0x21, 0x00);
    commands.push(...encoder.encode("*** BUKTI REFUND / RETUR ***\n"));
    commands.push(...encoder.encode("--------------------------------\n"));

    // Left alignment
    commands.push(ESC, 0x61, 0);
    commands.push(...encoder.encode(`No. Nota  : ${data.orderNumber}\n`));
    commands.push(...encoder.encode(`Tgl Refund: ${data.refundDate}\n`));
    commands.push(...encoder.encode(`Disetujui : ${data.approvedBy}\n`));
    commands.push(...encoder.encode(`Metode    : ${data.refundMethod}\n`));
    commands.push(...encoder.encode(`Alasan    : ${data.reason}\n`));
    commands.push(...encoder.encode("--------------------------------\n"));

    if (data.items && data.items.length > 0) {
      commands.push(...encoder.encode("Item Diretur:\n"));
      for (const item of data.items) {
        commands.push(...encoder.encode(`- ${item.name} (${item.qty}x)\n`));
      }
      commands.push(...encoder.encode("--------------------------------\n"));
    }

    commands.push(ESC, 0x45, 1);
    commands.push(...encoder.encode(`TOTAL REFUND: Rp ${data.refundAmount.toLocaleString("id-ID")}\n`));
    commands.push(ESC, 0x45, 0);
    commands.push(...encoder.encode("--------------------------------\n"));

    commands.push(ESC, 0x61, 1);
    commands.push(...encoder.encode("Dana Telah Dikembalikan ke Pelanggan\n\n\n\n"));
    commands.push(GS, 0x56, 66, 0);

    if (isConnected && this.characteristic) {
      const dataBuffer = new Uint8Array(commands);
      const chunkSize = 512;
      for (let i = 0; i < dataBuffer.length; i += chunkSize) {
        const chunk = dataBuffer.slice(i, i + chunkSize);
        await this.characteristic.writeValue(chunk);
      }
    } else {
      window.print();
    }
  }
}

export const bluetoothPrinter = new BluetoothPrinterDriver();
