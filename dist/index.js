var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
import { NativeModules, NativeEventEmitter, Platform } from "react-native";
import * as EPToolkit from "./utils/EPToolkit";
import { processColumnText } from './utils/print-column';
import { COMMANDS } from './utils/printer-commands';
import { connectToHost } from './utils/net-connect';
var RNUSBPrinter = NativeModules.RNUSBPrinter;
var RNBLEPrinter = NativeModules.RNBLEPrinter;
var RNNetPrinter = NativeModules.RNNetPrinter;
export var ColumnAliment;
(function (ColumnAliment) {
    ColumnAliment[ColumnAliment["LEFT"] = 0] = "LEFT";
    ColumnAliment[ColumnAliment["CENTER"] = 1] = "CENTER";
    ColumnAliment[ColumnAliment["RIGHT"] = 2] = "RIGHT";
})(ColumnAliment || (ColumnAliment = {}));
var textTo64Buffer = function (text, opts) {
    var defaultOptions = {
        beep: false,
        cut: false,
        tailingLine: false,
        encoding: "UTF8",
    };
    var options = __assign(__assign({}, defaultOptions), opts);
    var fixAndroid = '\n';
    var buffer = EPToolkit.exchange_text(text + fixAndroid, options);
    return buffer.toString("base64");
};
var billTo64Buffer = function (text, opts) {
    var defaultOptions = {
        beep: true,
        cut: true,
        encoding: "UTF8",
        tailingLine: true,
    };
    var options = __assign(__assign({}, defaultOptions), opts);
    var buffer = EPToolkit.exchange_text(text, options);
    return buffer.toString("base64");
};
var textPreprocessingIOS = function (text, canCut, beep) {
    if (canCut === void 0) { canCut = true; }
    if (beep === void 0) { beep = true; }
    var options = {
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
var USBPrinter = {
    init: function () {
        return new Promise(function (resolve, reject) {
            return RNUSBPrinter.init(function () { return resolve(); }, function (error) { return reject(error); });
        });
    },
    getDeviceList: function () {
        return new Promise(function (resolve, reject) {
            return RNUSBPrinter.getDeviceList(function (printers) { return resolve(printers); }, function (error) { return reject(error); });
        });
    },
    connectPrinter: function (vendorId, productId) {
        return new Promise(function (resolve, reject) {
            return RNUSBPrinter.connectPrinter(vendorId, productId, function (printer) { return resolve(printer); }, function (error) { return reject(error); });
        });
    },
    closeConn: function () {
        return new Promise(function (resolve) {
            RNUSBPrinter.closeConn();
            resolve();
        });
    },
    printText: function (text, opts) {
        if (opts === void 0) { opts = {}; }
        return RNUSBPrinter.printRawData(textTo64Buffer(text, opts), function (error) {
            return console.warn(error);
        });
    },
    printBill: function (text, opts) {
        if (opts === void 0) { opts = {}; }
        return RNUSBPrinter.printRawData(billTo64Buffer(text, opts), function (error) {
            return console.warn(error);
        });
    },
    /**
     * image url
     * @param imgUrl
     * @param opts
     */
    printImage: function (imgUrl, opts) {
        if (opts === void 0) { opts = {}; }
        if (Platform.OS === "ios") {
            RNUSBPrinter.printImageData(imgUrl, opts, function (error) { return console.warn(error); });
        }
        else {
            RNUSBPrinter.printImageData(imgUrl, function (error) { return console.warn(error); });
        }
    },
    /**
     * base64string, except -> data:image/png;base64,
     * @param Base64
     * @param opts
     */
    printImageBase64: function (Base64, opts) {
        if (opts === void 0) { opts = {}; }
        if (Platform.OS === "ios") {
            RNUSBPrinter.printImageBase64(Base64, opts, function (error) { return console.warn(error); });
        }
        else {
            RNUSBPrinter.printImageBase64(Base64, function (error) { return console.warn(error); });
        }
    },
    /**
     * android print with encoder
     * @param text
     */
    printRaw: function (text) {
        if (Platform.OS === "ios") {
        }
        else {
            RNUSBPrinter.printRawData(text, function (error) {
                return console.warn(error);
            });
        }
    },
    /**
     * `columnWidth`
     * 80mm => 46 character
     * 58mm => 30 character
     */
    printColumnsText: function (texts, columnWidth, columnAliment, columnStyle, opts) {
        if (opts === void 0) { opts = {}; }
        var result = processColumnText(texts, columnWidth, columnAliment, columnStyle);
        RNUSBPrinter.printRawData(textTo64Buffer(result, opts), function (error) {
            return console.warn(error);
        });
    },
};
var BLEPrinter = {
    init: function () {
        return new Promise(function (resolve, reject) {
            return RNBLEPrinter.init(function () { return resolve(); }, function (error) { return reject(error); });
        });
    },
    getDeviceList: function () {
        return new Promise(function (resolve, reject) {
            return RNBLEPrinter.getDeviceList(function (printers) { return resolve(printers); }, function (error) { return reject(error); });
        });
    },
    connectPrinter: function (inner_mac_address) {
        return new Promise(function (resolve, reject) {
            return RNBLEPrinter.connectPrinter(inner_mac_address, function (printer) { return resolve(printer); }, function (error) { return reject(error); });
        });
    },
    closeConn: function () {
        return new Promise(function (resolve) {
            RNBLEPrinter.closeConn();
            resolve();
        });
    },
    printText: function (text, opts) {
        if (opts === void 0) { opts = {}; }
        if (Platform.OS === "ios") {
            var processedText = textPreprocessingIOS(text, false, false);
            RNBLEPrinter.printRawData(processedText.text, processedText.opts, function (error) { return console.warn(error); });
        }
        else {
            RNBLEPrinter.printRawData(textTo64Buffer(text, opts), function (error) {
                return console.warn(error);
            });
        }
    },
    printBill: function (text, opts) {
        var _a, _b;
        if (opts === void 0) { opts = {}; }
        if (Platform.OS === "ios") {
            var processedText = textPreprocessingIOS(text, (_a = opts === null || opts === void 0 ? void 0 : opts.cut) !== null && _a !== void 0 ? _a : true, (_b = opts.beep) !== null && _b !== void 0 ? _b : true);
            RNBLEPrinter.printRawData(processedText.text, processedText.opts, function (error) { return console.warn(error); });
        }
        else {
            RNBLEPrinter.printRawData(billTo64Buffer(text, opts), function (error) {
                return console.warn(error);
            });
        }
    },
    /**
     * image url
     * @param imgUrl
     * @param opts
     */
    printImage: function (imgUrl, opts) {
        if (opts === void 0) { opts = {}; }
        if (Platform.OS === "ios") {
            /**
             * just development
             */
            RNBLEPrinter.printImageData(imgUrl, opts, function (error) { return console.warn(error); });
        }
        else {
            RNBLEPrinter.printImageData(imgUrl, function (error) { return console.warn(error); });
        }
    },
    /**
     * base64string, except -> data:image/png;base64,
     * @param Base64
     * @param opts
     */
    printImageBase64: function (Base64, opts) {
        if (opts === void 0) { opts = {}; }
        if (Platform.OS === "ios") {
            /**
             * just development
             */
            RNBLEPrinter.printImageBase64(Base64, opts, function (error) { return console.warn(error); });
        }
        else {
            /**
             * just development
             */
            RNBLEPrinter.printImageBase64(Base64, function (error) { return console.warn(error); });
        }
    },
    /**
     * android print with encoder
     * @param text
     */
    printRaw: function (text) {
        if (Platform.OS === "ios") {
        }
        else {
            RNBLEPrinter.printRawData(text, function (error) {
                return console.warn(error);
            });
        }
    },
    /**
     * `columnWidth`
     * 80mm => 46 character
     * 58mm => 30 character
     */
    printColumnsText: function (texts, columnWidth, columnAliment, columnStyle, opts) {
        if (opts === void 0) { opts = {}; }
        var result = processColumnText(texts, columnWidth, columnAliment, columnStyle);
        if (Platform.OS === "ios") {
            var processedText = textPreprocessingIOS(result, false, false);
            RNBLEPrinter.printRawData(processedText.text, processedText.opts, function (error) { return console.warn(error); });
        }
        else {
            RNBLEPrinter.printRawData(textTo64Buffer(result, opts), function (error) {
                return console.warn(error);
            });
        }
    },
};
var NetPrinter = {
    init: function () {
        return new Promise(function (resolve, reject) {
            return RNNetPrinter.init(function () { return resolve(); }, function (error) { return reject(error); });
        });
    },
    getDeviceList: function () {
        return new Promise(function (resolve, reject) {
            return RNNetPrinter.getDeviceList(function (printers) { return resolve(printers); }, function (error) { return reject(error); });
        });
    },
    connectPrinter: function (host, port, timeout) {
        return new Promise(function (resolve, reject) { return __awaiter(void 0, void 0, void 0, function () {
            var error_1;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 3]);
                        return [4 /*yield*/, connectToHost(host, timeout)];
                    case 1:
                        _a.sent();
                        RNNetPrinter.connectPrinter(host, port, function (printer) { return resolve(printer); }, function (error) { return reject(error); });
                        return [3 /*break*/, 3];
                    case 2:
                        error_1 = _a.sent();
                        reject((error_1 === null || error_1 === void 0 ? void 0 : error_1.message) || "Connect to ".concat(host, " fail"));
                        return [3 /*break*/, 3];
                    case 3: return [2 /*return*/];
                }
            });
        }); });
    },
    closeConn: function () {
        return new Promise(function (resolve) {
            RNNetPrinter.closeConn();
            resolve();
        });
    },
    printText: function (text, opts) {
        if (opts === void 0) { opts = {}; }
        if (Platform.OS === "ios") {
            var processedText = textPreprocessingIOS(text, false, false);
            RNNetPrinter.printRawData(processedText.text, processedText.opts, function (error) { return console.warn(error); });
        }
        else {
            RNNetPrinter.printRawData(textTo64Buffer(text, opts), function (error) {
                return console.warn(error);
            });
        }
    },
    printBill: function (text, opts) {
        var _a, _b;
        if (opts === void 0) { opts = {}; }
        if (Platform.OS === "ios") {
            var processedText = textPreprocessingIOS(text, (_a = opts === null || opts === void 0 ? void 0 : opts.cut) !== null && _a !== void 0 ? _a : true, (_b = opts.beep) !== null && _b !== void 0 ? _b : true);
            RNNetPrinter.printRawData(processedText.text, processedText.opts, function (error) { return console.warn(error); });
        }
        else {
            RNNetPrinter.printRawData(billTo64Buffer(text, opts), function (error) {
                return console.warn(error);
            });
        }
    },
    /**
     * image url
     * @param imgUrl
     * @param opts
     */
    printImage: function (imgUrl, opts) {
        if (opts === void 0) { opts = {}; }
        if (Platform.OS === "ios") {
            RNNetPrinter.printImageData(imgUrl, opts, function (error) { return console.warn(error); });
        }
        else {
            RNNetPrinter.printImageData(imgUrl, function (error) { return console.warn(error); });
        }
    },
    /**
     * base64string, except -> data:image/png;base64,
     * @param Base64
     * @param opts
     */
    printImageBase64: function (Base64, opts) {
        if (opts === void 0) { opts = {}; }
        if (Platform.OS === "ios") {
            RNNetPrinter.printImageBase64(Base64, opts, function (error) { return console.warn(error); });
        }
        else {
            RNNetPrinter.printImageBase64(Base64, function (error) { return console.warn(error); });
        }
    },
    /**
     * Android print with encoder
     * @param text
     */
    printRaw: function (text) {
        if (Platform.OS === "ios") {
        }
        else {
            RNNetPrinter.printRawData(text, function (error) {
                return console.warn(error);
            });
        }
    },
    /**
     * `columnWidth`
     * 80mm => 46 character
     * 58mm => 30 character
     */
    printColumnsText: function (texts, columnWidth, columnAliment, columnStyle, opts) {
        if (columnStyle === void 0) { columnStyle = []; }
        if (opts === void 0) { opts = {}; }
        var result = processColumnText(texts, columnWidth, columnAliment, columnStyle);
        if (Platform.OS === "ios") {
            var processedText = textPreprocessingIOS(result, false, false);
            RNNetPrinter.printRawData(processedText.text, processedText.opts, function (error) { return console.warn(error); });
        }
        else {
            RNNetPrinter.printRawData(textTo64Buffer(result, opts), function (error) {
                return console.warn(error);
            });
        }
    },
};
var NetPrinterEventEmitter = new NativeEventEmitter(RNNetPrinter);
export { COMMANDS, NetPrinter, BLEPrinter, USBPrinter, NetPrinterEventEmitter };
export var RN_THERMAL_RECEIPT_PRINTER_EVENTS;
(function (RN_THERMAL_RECEIPT_PRINTER_EVENTS) {
    RN_THERMAL_RECEIPT_PRINTER_EVENTS["EVENT_NET_PRINTER_SCANNED_SUCCESS"] = "scannerResolved";
    RN_THERMAL_RECEIPT_PRINTER_EVENTS["EVENT_NET_PRINTER_SCANNING"] = "scannerRunning";
    RN_THERMAL_RECEIPT_PRINTER_EVENTS["EVENT_NET_PRINTER_SCANNED_ERROR"] = "registerError";
})(RN_THERMAL_RECEIPT_PRINTER_EVENTS || (RN_THERMAL_RECEIPT_PRINTER_EVENTS = {}));
