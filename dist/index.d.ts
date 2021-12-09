import { NativeEventEmitter } from "react-native";
export interface PrinterOptions {
    beep?: boolean;
    cut?: boolean;
    tailingLine?: boolean;
    encoding?: string;
}
declare const PRINTER_COMMANDS: {
    LF: string;
    ESC: string;
    FS: string;
    GS: string;
    US: string;
    FF: string;
    DLE: string;
    DC1: string;
    DC4: string;
    EOT: string;
    NUL: string;
    EOL: string;
    HORIZONTAL_LINE: {
        HR_58MM: string;
        HR2_58MM: string;
        HR3_58MM: string;
        HR_80MM: string;
        HR2_80MM: string;
        HR3_80MM: string;
    };
    FEED_CONTROL_SEQUENCES: {
        /**
         * Print and line feed
         */
        CTL_LF: string;
        /**
         * Form feed
         */
        CTL_FF: string;
        /**
         * Carriage return
         */
        CTL_CR: string;
        /**
         * Horizontal tab
         */
        CTL_HT: string;
        /**
         * Vertical tab
         */
        CTL_VT: string;
    };
    LINE_SPACING: {
        LS_DEFAULT: string;
        LS_SET: string;
        LS_SET1: string;
    };
    HARDWARE: {
        /**
         * Clear data in buffer and reset modes
         */
        HW_INIT: string;
        /**
         * Printer select
         */
        HW_SELECT: string;
        /**
         * Reset printer hardware
         */
        HW_RESET: string;
    };
    CASH_DRAWER: {
        /**
         * Sends a pulse to pin 2 []
         */
        CD_KICK_2: string;
        /**
         * ends a pulse to pin 5 []
         */
        CD_KICK_5: string;
    };
    MARGINS: {
        /**
         * Fix bottom size
         */
        BOTTOM: string;
        /**
         * Fix left size
         */
        LEFT: string;
        /**
         * Fix right size
         */
        RIGHT: string;
    };
    PAPER: {
        /**
         * Full cut paper
         */
        PAPER_FULL_CUT: string;
        /**
         * Partial cut paper
         */
        PAPER_PART_CUT: string;
        /**
         * Partial cut paper
         */
        PAPER_CUT_A: string;
        /**
         * Partial cut paper
         */
        PAPER_CUT_B: string;
    };
    TEXT_FORMAT: {
        /**
         * Normal text
         */
        TXT_NORMAL: string;
        /**
         * Double height text
         */
        TXT_2HEIGHT: string;
        /**
         * Double width text
         */
        TXT_2WIDTH: string;
        /**
         * Double width & height text
         */
        TXT_4SQUARE: string;
        /**
         * other sizes
         */
        TXT_CUSTOM_SIZE: (width: number, height: number) => string;
        TXT_HEIGHT: {
            1: string;
            2: string;
            3: string;
            4: string;
            5: string;
            6: string;
            7: string;
            8: string;
        };
        TXT_WIDTH: {
            1: string;
            2: string;
            3: string;
            4: string;
            5: string;
            6: string;
            7: string;
            8: string;
        };
        /**
         * Underline font OFF
         */
        TXT_UNDERL_OFF: string;
        /**
         * Underline font 1-dot ON
         */
        TXT_UNDERL_ON: string;
        /**
         * Underline font 2-dot ON
         */
        TXT_UNDERL2_ON: string;
        /**
         * Bold font OFF
         */
        TXT_BOLD_OFF: string;
        /**
         * Bold font ON
         */
        TXT_BOLD_ON: string;
        /**
         * Italic font ON
         */
        TXT_ITALIC_OFF: string;
        /**
         * Italic font ON
         */
        TXT_ITALIC_ON: string;
        /**
         * Font type A
         */
        TXT_FONT_A: string;
        /**
         * Font type B
         */
        TXT_FONT_B: string;
        /**
         * Font type C
         */
        TXT_FONT_C: string;
        /**
         * Left justification
         */
        TXT_ALIGN_LT: string;
        /**
         * Centering
         */
        TXT_ALIGN_CT: string;
        /**
         *  Right justification
         */
        TXT_ALIGN_RT: string;
    };
};
export interface PrinterImageOptions {
    beep?: boolean;
    cut?: boolean;
    tailingLine?: boolean;
    encoding?: string;
    /**
     * ios only
     */
    imageWidth?: number;
    paddingX?: number;
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
export declare enum ColumnAliment {
    LEFT = 0,
    CENTER = 1,
    RIGHT = 2
}
export declare const USBPrinter: {
    init: () => Promise<void>;
    getDeviceList: () => Promise<IUSBPrinter[]>;
    connectPrinter: (vendorId: string, productId: string) => Promise<IUSBPrinter>;
    closeConn: () => Promise<void>;
    printText: (text: string, opts?: PrinterOptions) => void;
    printBill: (text: string, opts?: PrinterOptions) => void;
    /**
     * image url
     * @param imgUrl
     * @param opts
     */
    printImage: (imgUrl: string, opts?: PrinterImageOptions) => void;
    /**
     * base64string, except -> data:image/png;base64,
     * @param qrCodeBase64
     * @param opts
     */
    printQrCode: (qrCodeBase64: string, opts?: PrinterImageOptions) => void;
    /**
     * android print with encoder
     * @param text
     */
    printRaw: (text: string) => void;
    /**
     * `columnWidth`
     * 80mm => 46 character
     * 58mm => 30 character
     */
    printColumnsText: (texts: string[], columnWidth: number[], columnAliment: (ColumnAliment)[], columnStyle: string[], opts?: PrinterOptions) => void;
};
export declare const BLEPrinter: {
    init: () => Promise<void>;
    getDeviceList: () => Promise<IBLEPrinter[]>;
    connectPrinter: (inner_mac_address: string) => Promise<IBLEPrinter>;
    closeConn: () => Promise<void>;
    printText: (text: string, opts?: PrinterOptions) => void;
    printBill: (text: string, opts?: PrinterOptions) => void;
    /**
     * image url
     * @param imgUrl
     * @param opts
     */
    printImage: (imgUrl: string, opts?: PrinterImageOptions) => void;
    /**
     * base64string, except -> data:image/png;base64,
     * @param qrCodeBase64
     * @param opts
     */
    printQrCode: (qrCodeBase64: string, opts?: PrinterImageOptions) => void;
    /**
     * android print with encoder
     * @param text
     */
    printRaw: (text: string) => void;
    /**
     * `columnWidth`
     * 80mm => 46 character
     * 58mm => 30 character
     */
    printColumnsText: (texts: string[], columnWidth: number[], columnAliment: (ColumnAliment)[], columnStyle: string[], opts?: PrinterOptions) => void;
};
export declare const NetPrinter: {
    init: () => Promise<void>;
    getDeviceList: () => Promise<INetPrinter[]>;
    connectPrinter: (host: string, port: number) => Promise<INetPrinter>;
    closeConn: () => Promise<void>;
    printText: (text: string, opts?: {}) => void;
    printBill: (text: string, opts?: PrinterOptions) => void;
    /**
     * image url
     * @param imgUrl
     * @param opts
     */
    printImage: (imgUrl: string, opts?: PrinterImageOptions) => void;
    /**
     * base64string, except -> data:image/png;base64,
     * @param qrCodeBase64
     * @param opts
     */
    printQrCode: (qrCodeBase64: string, opts?: PrinterImageOptions) => void;
    /**
     * Android print with encoder
     * @param text
     */
    printRaw: (text: string) => void;
    /**
     * `columnWidth`
     * 80mm => 46 character
     * 58mm => 30 character
     */
    printColumnsText: (texts: string[], columnWidth: number[], columnAliment: (ColumnAliment)[], columnStyle?: string[], opts?: PrinterOptions) => void;
};
export declare const NetPrinterEventEmitter: NativeEventEmitter;
export declare enum RN_THERMAL_RECEIPT_PRINTER_EVENTS {
    EVENT_NET_PRINTER_SCANNED_SUCCESS = "scannerResolved",
    EVENT_NET_PRINTER_SCANNING = "scannerRunning",
    EVENT_NET_PRINTER_SCANNED_ERROR = "registerError"
}
