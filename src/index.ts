import {NativeModules, NativeEventEmitter, Platform} from "react-native";

import * as EPToolkit from "./utils/EPToolkit";
import {processColumnText} from './utils/print-column';
import PRINTER_COMMANDS from './utils/printer-commands';

const RNUSBPrinter = NativeModules.RNUSBPrinter;
const RNBLEPrinter = NativeModules.RNBLEPrinter;
const RNNetPrinter = NativeModules.RNNetPrinter;

export interface PrinterOptions {
  beep?: boolean;
  cut?: boolean;
  tailingLine?: boolean;
  encoding?: string;
}

export const COMMANDS = PRINTER_COMMANDS;

export interface PrinterImageOptions {
  beep?: boolean;
  cut?: boolean;
  tailingLine?: boolean;
  encoding?: string;
  /**
   * ios only
   */
  imageWidth?: number,
  paddingX?: number
}

export interface IUSBPrinter {
  device_name: string;
  vendor_id: string;
  product_id: string;
}

export interface IBLEPrinter {
  device_name: string;
  inner_mac_address: string;
}

export interface INetPrinter {
  device_name: string;
  host: string;
  port: number;
}

export enum ColumnAliment {
  LEFT,
  CENTER,
  RIGHT,
}

const textTo64Buffer = (text: string, opts: PrinterOptions) => {
  const defaultOptions = {
    beep: false,
    cut: false,
    tailingLine: false,
    encoding: "UTF8",
  };

  const options = {
    ...defaultOptions,
    ...opts,
  };

  const fixAndroid = '\n'
  const buffer = EPToolkit.exchange_text(text + fixAndroid, options);
  return buffer.toString("base64");
};

const billTo64Buffer = (text: string, opts: PrinterOptions) => {
  const defaultOptions = {
    beep: true,
    cut: true,
    encoding: "UTF8",
    tailingLine: true,
  };
  const options = {
    ...defaultOptions,
    ...opts,
  };
  const buffer = EPToolkit.exchange_text(text, options);
  return buffer.toString("base64");
};

const textPreprocessingIOS = (text: string, canCut = true, beep = true) => {
  let options = {
    beep: beep,
    cut: canCut,
  };
  return {
    text: text
      .replace(/<\/?CB>/g, "")
      .replace(/<\/?CM>/g, "")
      .replace(/<\/?CD>/g, "")
      .replace(/<\/?C>/g, "")
      .replace(/<\/?D>/g, "")
      .replace(/<\/?B>/g, "")
      .replace(/<\/?M>/g, ""),
    opts: options,
  };
};

// const imageToBuffer = async (imagePath: string, threshold: number = 60) => {
//   const buffer = await EPToolkit.exchange_image(imagePath, threshold);
//   return buffer.toString("base64");
// };

export const USBPrinter = {
  init: (): Promise<void> =>
    new Promise((resolve, reject) =>
      RNUSBPrinter.init(
        () => resolve(),
        (error: Error) => reject(error)
      )
    ),

  getDeviceList: (): Promise<IUSBPrinter[]> =>
    new Promise((resolve, reject) =>
      RNUSBPrinter.getDeviceList(
        (printers: IUSBPrinter[]) => resolve(printers),
        (error: Error) => reject(error)
      )
    ),

  connectPrinter: (vendorId: string, productId: string): Promise<IUSBPrinter> =>
    new Promise((resolve, reject) =>
      RNUSBPrinter.connectPrinter(
        vendorId,
        productId,
        (printer: IUSBPrinter) => resolve(printer),
        (error: Error) => reject(error)
      )
    ),

  closeConn: (): Promise<void> =>
    new Promise((resolve) => {
      RNUSBPrinter.closeConn();
      resolve();
    }),

  printText: (text: string, opts: PrinterOptions = {}): void =>
    RNUSBPrinter.printRawData(textTo64Buffer(text, opts), (error: Error) =>
      console.warn(error)
    ),

  printBill: (text: string, opts: PrinterOptions = {}): void =>
    RNUSBPrinter.printRawData(billTo64Buffer(text, opts), (error: Error) =>
      console.warn(error)
    ),
  /**
   * image url
   * @param imgUrl
   * @param opts
   */
  printImage: function (imgUrl: string, opts: PrinterImageOptions = {}) {
    if (Platform.OS === "ios") {
      RNUSBPrinter.printImageData(imgUrl, opts, (error: Error) => console.warn(error));
    } else {
      RNUSBPrinter.printImageData(imgUrl, (error: Error) => console.warn(error));
    }
  },
  /**
   * base64string, except -> data:image/png;base64,
   * @param qrCodeBase64
   * @param opts
   */
  printQrCode: function (qrCodeBase64: string, opts: PrinterImageOptions = {}) {
    if (Platform.OS === "ios") {
      RNUSBPrinter.printQrCode(qrCodeBase64, opts, (error: Error) => console.warn(error));
    } else {
      RNUSBPrinter.printQrCode(qrCodeBase64, (error: Error) => console.warn(error));
    }
  },
  /**
   * android print with encoder
   * @param text
   */
  printRaw: (text: string): void => {
    if (Platform.OS === "ios") {
    } else {
      RNUSBPrinter.printRawData(text, (error: Error) =>
        console.warn(error)
      );
    }
  },
  printColumnsText: (texts: string[], columnWidth: number[], columnAliment: (ColumnAliment)[], columnStyle: string[], opts: PrinterOptions = {}): void => {
    const result = processColumnText(texts, columnWidth, columnAliment, columnStyle)
    RNUSBPrinter.printRawData(textTo64Buffer(result, opts), (error: Error) =>
      console.warn(error)
    );
  },
};

export const BLEPrinter = {
  init: (): Promise<void> =>
    new Promise((resolve, reject) =>
      RNBLEPrinter.init(
        () => resolve(),
        (error: Error) => reject(error)
      )
    ),

  getDeviceList: (): Promise<IBLEPrinter[]> =>
    new Promise((resolve, reject) =>
      RNBLEPrinter.getDeviceList(
        (printers: IBLEPrinter[]) => resolve(printers),
        (error: Error) => reject(error)
      )
    ),

  connectPrinter: (inner_mac_address: string): Promise<IBLEPrinter> =>
    new Promise((resolve, reject) =>
      RNBLEPrinter.connectPrinter(
        inner_mac_address,
        (printer: IBLEPrinter) => resolve(printer),
        (error: Error) => reject(error)
      )
    ),

  closeConn: (): Promise<void> =>
    new Promise((resolve) => {
      RNBLEPrinter.closeConn();
      resolve();
    }),

  printText: (text: string, opts: PrinterOptions = {}): void => {
    if (Platform.OS === "ios") {
      const processedText = textPreprocessingIOS(text, false, false);
      RNBLEPrinter.printRawData(
        processedText.text,
        processedText.opts,
        (error: Error) => console.warn(error)
      );
    } else {
      RNBLEPrinter.printRawData(textTo64Buffer(text, opts), (error: Error) =>
        console.warn(error)
      );
    }
  },

  printBill: (text: string, opts: PrinterOptions = {}): void => {
    if (Platform.OS === "ios") {
      const processedText = textPreprocessingIOS(text, opts?.cut ?? true, opts.beep ?? true);
      RNBLEPrinter.printRawData(
        processedText.text,
        processedText.opts,
        (error: Error) => console.warn(error)
      );
    } else {
      RNBLEPrinter.printRawData(billTo64Buffer(text, opts), (error: Error) =>
        console.warn(error)
      );
    }
  },
  /**
   * image url
   * @param imgUrl
   * @param opts
   */
  printImage: function (imgUrl: string, opts: PrinterImageOptions = {}) {
    if (Platform.OS === "ios") {
      /**
       * just development
       */
      RNBLEPrinter.printImageData(imgUrl, opts, (error: Error) => console.warn(error));
    } else {
      RNBLEPrinter.printImageData(imgUrl, (error: Error) => console.warn(error));
    }
  },
  /**
   * base64string, except -> data:image/png;base64,
   * @param qrCodeBase64
   * @param opts
   */
  printQrCode: function (qrCodeBase64: string, opts: PrinterImageOptions = {}) {
    if (Platform.OS === "ios") {
      /**
       * just development
       */
      RNBLEPrinter.printQrCode(qrCodeBase64, opts, (error: Error) => console.warn(error));
    } else {
      /**
       * just development
       */
      RNBLEPrinter.printQrCode(qrCodeBase64, (error: Error) => console.warn(error));
    }
  },
  /**
   * android print with encoder
   * @param text
   */
  printRaw: (text: string): void => {
    if (Platform.OS === "ios") {
    } else {
      RNBLEPrinter.printRawData(text, (error: Error) =>
        console.warn(error)
      );
    }
  },
  printColumnsText: (texts: string[], columnWidth: number[], columnAliment: (ColumnAliment)[], columnStyle: string[], opts: PrinterOptions = {}): void => {
    const result = processColumnText(texts, columnWidth, columnAliment, columnStyle)
    if (Platform.OS === "ios") {
      const processedText = textPreprocessingIOS(result, false, false);
      RNBLEPrinter.printRawData(
        processedText.text,
        processedText.opts,
        (error: Error) => console.warn(error)
      );
    } else {
      RNBLEPrinter.printRawData(textTo64Buffer(result, opts), (error: Error) =>
        console.warn(error)
      );
    }
  },
};

export const NetPrinter = {
  init: (): Promise<void> =>
    new Promise((resolve, reject) =>
      RNNetPrinter.init(
        () => resolve(),
        (error: Error) => reject(error)
      )
    ),

  getDeviceList: (): Promise<INetPrinter[]> =>
    new Promise((resolve, reject) =>
      RNNetPrinter.getDeviceList(
        (printers: INetPrinter[]) => resolve(printers),
        (error: Error) => reject(error)
      )
    ),

  connectPrinter: (host: string, port: number): Promise<INetPrinter> =>
    new Promise((resolve, reject) =>
      RNNetPrinter.connectPrinter(
        host,
        port,
        (printer: INetPrinter) => resolve(printer),
        (error: Error) => reject(error)
      )
    ),

  closeConn: (): Promise<void> =>
    new Promise((resolve) => {
      RNNetPrinter.closeConn();
      resolve();
    }),

  printText: (text: string, opts = {}): void => {
    if (Platform.OS === "ios") {
      const processedText = textPreprocessingIOS(text, false, false);
      RNNetPrinter.printRawData(
        processedText.text,
        processedText.opts,
        (error: Error) => console.warn(error)
      );
    } else {
      RNNetPrinter.printRawData(textTo64Buffer(text, opts), (error: Error) =>
        console.warn(error)
      );
    }
  },

  printBill: (text: string, opts: PrinterOptions = {}): void => {
    if (Platform.OS === "ios") {
      const processedText = textPreprocessingIOS(text, opts?.cut ?? true, opts.beep ?? true);
      RNNetPrinter.printRawData(
        processedText.text,
        processedText.opts,
        (error: Error) => console.warn(error)
      );
    } else {
      RNNetPrinter.printRawData(billTo64Buffer(text, opts), (error: Error) =>
        console.warn(error)
      );
    }
  },
  /**
   * image url
   * @param imgUrl
   * @param opts
   */
  printImage: function (imgUrl: string, opts: PrinterImageOptions = {}) {
    if (Platform.OS === "ios") {
      RNNetPrinter.printImageData(imgUrl, opts, (error: Error) => console.warn(error));
    } else {
      RNNetPrinter.printImageData(imgUrl, (error: Error) => console.warn(error));
    }
  },
  /**
   * base64string, except -> data:image/png;base64,
   * @param qrCodeBase64
   * @param opts
   */
  printQrCode: function (qrCodeBase64: string, opts: PrinterImageOptions = {}) {
    if (Platform.OS === "ios") {
      RNNetPrinter.printQrCode(qrCodeBase64, opts, (error: Error) => console.warn(error));
    } else {
      RNNetPrinter.printQrCode(qrCodeBase64, (error: Error) => console.warn(error));
    }
  },

  /**
   * Android print with encoder
   * @param text
   */
  printRaw: (text: string): void => {
    if (Platform.OS === "ios") {
    } else {
      RNNetPrinter.printRawData(text, (error: Error) =>
        console.warn(error)
      );
    }
  },

  /**
   * `columnWidth`
   * 80mm => 46 character
   * 58mm => 30 character
   */
  printColumnsText: (texts: string[], columnWidth: number[], columnAliment: (ColumnAliment)[], columnStyle: string[], opts: PrinterOptions = {}): void => {
    const result = processColumnText(texts, columnWidth, columnAliment, columnStyle)
    if (Platform.OS === "ios") {
      const processedText = textPreprocessingIOS(result, false, false);
      RNNetPrinter.printRawData(
        processedText.text,
        processedText.opts,
        (error: Error) => console.warn(error)
      );
    } else {
      RNNetPrinter.printRawData(textTo64Buffer(result, opts), (error: Error) =>
        console.warn(error)
      );
    }
  },
};

export const NetPrinterEventEmitter = new NativeEventEmitter(RNNetPrinter);

export enum RN_THERMAL_RECEIPT_PRINTER_EVENTS {
  EVENT_NET_PRINTER_SCANNED_SUCCESS = "scannerResolved",
  EVENT_NET_PRINTER_SCANNING = "scannerRunning",
  EVENT_NET_PRINTER_SCANNED_ERROR = "registerError",
}
