package com.rnprinter.ThermalPrinter;

import static com.rnprinter.MainActivity.ACTION_USB_PERMISSION;

import android.Manifest;
import android.app.PendingIntent;
import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.content.IntentFilter;
import android.content.pm.PackageManager;
import android.graphics.Bitmap;
import android.hardware.usb.UsbDevice;
import android.hardware.usb.UsbManager;
import android.util.Log;

import androidx.annotation.NonNull;
import androidx.core.app.ActivityCompat;
import androidx.core.content.ContextCompat;

import com.bumptech.glide.Glide;
import com.dantsu.escposprinter.EscPosPrinter;
import com.dantsu.escposprinter.connection.DeviceConnection;
import com.dantsu.escposprinter.connection.bluetooth.BluetoothPrintersConnections;
import com.dantsu.escposprinter.connection.tcp.TcpConnection;
import com.dantsu.escposprinter.connection.usb.UsbConnection;
import com.dantsu.escposprinter.connection.usb.UsbPrintersConnections;
import com.dantsu.escposprinter.exceptions.EscPosBarcodeException;
import com.dantsu.escposprinter.exceptions.EscPosConnectionException;
import com.dantsu.escposprinter.exceptions.EscPosEncodingException;
import com.dantsu.escposprinter.exceptions.EscPosParserException;
import com.dantsu.escposprinter.textparser.PrinterTextParserImg;
import com.facebook.react.bridge.Promise;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;
import com.facebook.react.module.annotations.ReactModule;
import com.rnprinter.MainActivity;

import java.util.regex.Matcher;
import java.util.regex.Pattern;

@ReactModule(name = ThermalPrinterModule.NAME)
public class ThermalPrinterModule extends ReactContextBaseJavaModule {
    public static final String NAME = "ThermalPrinterModule";
    private Promise jsPromise;

    public ThermalPrinterModule(ReactApplicationContext reactContext) {
        super(reactContext);
    }

    @Override
    @NonNull
    public String getName() {
        return NAME;
    }

    @ReactMethod
    public void printTcp(String ipAddress, double port, String payload, boolean autoCut, boolean openCashbox, double mmFeedPaper, double printerDpi, double printerWidthMM, double printerNbrCharactersPerLine, Promise promise) {
//
//        05-05-2021
//        https://reactnative.dev/docs/native-modules-android
//        The following types are currently supported but will not be supported in TurboModules. Please avoid using them:
//
//        Integer -> ?number
//        int -> number
//        Float -> ?number
//        float -> number
//
        this.jsPromise = promise;
        try {
            TcpConnection connection = new TcpConnection(ipAddress, (int) port);
            this.printIt(connection, payload, autoCut, openCashbox, mmFeedPaper, printerDpi, printerWidthMM, printerNbrCharactersPerLine);
        } catch (Exception e) {
            this.jsPromise.reject("Connection Error", e.getMessage());
        }
    }

    @ReactMethod
    public void printBluetooth(String payload, boolean autoCut, boolean openCashbox, double mmFeedPaper, double printerDpi, double printerWidthMM, double printerNbrCharactersPerLine, Promise promise) {
        this.jsPromise = promise;

        if (ContextCompat.checkSelfPermission(getCurrentActivity(), Manifest.permission.BLUETOOTH) != PackageManager.PERMISSION_GRANTED) {
            ActivityCompat.requestPermissions(getCurrentActivity(), new String[]{Manifest.permission.BLUETOOTH}, 1);
        } else {
            try {
                this.printIt(BluetoothPrintersConnections.selectFirstPaired(), payload, autoCut, openCashbox, mmFeedPaper, printerDpi, printerWidthMM, printerNbrCharactersPerLine);
            } catch (Exception e) {
                this.jsPromise.reject("Connection Error", e.getMessage());
            }
        }
    }

    @ReactMethod
    public void printUsb(String payload, boolean autoCut, boolean openCashbox, double mmFeedPaper, double printerDpi, double printerWidthMM, double printerNbrCharactersPerLine, Promise promise) {
        this.jsPromise = promise;
        ReactApplicationContext rContext = getReactApplicationContext();
        UsbConnection usbConnection = UsbPrintersConnections.selectFirstConnected(rContext);
        UsbManager usbManager = (UsbManager) rContext.getSystemService(Context.USB_SERVICE);
        if (usbConnection != null && usbManager != null) {
            PendingIntent permissionIntent = PendingIntent.getBroadcast(rContext, 0, new Intent(ACTION_USB_PERMISSION), 0);
            IntentFilter filter = new IntentFilter(ACTION_USB_PERMISSION);
            rContext.registerReceiver(new BroadcastReceiver() {
                private Promise jsPromise;

                public void onReceive(Context context, Intent intent) {
                    String action = intent.getAction();
                    if (ACTION_USB_PERMISSION.equals(action)) {
                        try {
                            UsbManager usbManager = (UsbManager) rContext.getSystemService(Context.USB_SERVICE);
                            UsbDevice usbDevice = intent.getParcelableExtra(UsbManager.EXTRA_DEVICE);
                            UsbConnection usbPrinter = new UsbConnection(usbManager, usbDevice);
                            this.printIt(usbPrinter, payload, autoCut, openCashbox, mmFeedPaper, printerDpi, printerWidthMM, printerNbrCharactersPerLine);
                        } catch (Exception e) {
                            Log.e("POS", "Error occurred, printing did not complete", e);
                            e.printStackTrace();
                            jsPromise.reject(e);
                        }
                    }
                }

                private void printIt(DeviceConnection printerConnection, String payload, boolean autoCut, boolean openCashbox, double mmFeedPaper, double printerDpi, double printerWidthMM, double printerNbrCharactersPerLine) {
                    try {
                        EscPosPrinter printer = new EscPosPrinter(printerConnection, (int) printerDpi, (float) printerWidthMM, (int) printerNbrCharactersPerLine);
                        String processedPayload = preprocessImgTag(printer, payload);

                        if (openCashbox) {
                            printer.printFormattedTextAndOpenCashBox(processedPayload, (float) mmFeedPaper);
                        } else if (autoCut) {
                            printer.printFormattedTextAndCut(processedPayload, (float) mmFeedPaper);
                        } else {
                            printer.printFormattedText(processedPayload, (float) mmFeedPaper);
                        }

                        printer.disconnectPrinter();
                        Log.println(Log.ASSERT, "2", "print ok");
                        this.jsPromise.resolve(true);
                    } catch (EscPosConnectionException e) {
                        Log.e("POS",  e.getMessage(), e);
                        this.jsPromise.reject("Broken connection", e.getMessage());
                    } catch (EscPosParserException e) {
                        Log.e("POS",  e.getMessage(), e);
                        this.jsPromise.reject("Invalid formatted text", e.getMessage());
                    } catch (EscPosEncodingException e) {
                        Log.e("POS",  e.getMessage(), e);
                        this.jsPromise.reject("Bad selected encoding", e.getMessage());
                    } catch (EscPosBarcodeException e) {
                        Log.e("POS",  e.getMessage(), e);
                        this.jsPromise.reject("Invalid barcode", e.getMessage());
                    } catch (Exception e) {
                        Log.e("POS",  e.getMessage(), e);
                        this.jsPromise.reject("ERROR", e.getMessage());
                    }
                }
            }, filter);
            usbManager.requestPermission(usbConnection.getDevice(), permissionIntent);
        } else {
            Log.println(Log.ASSERT, "2", "error ok");
        }
    }

    private Bitmap getBitmapFromUrl(String url) {
        try {
            Bitmap bitmap = Glide
                    .with(getCurrentActivity())
                    .asBitmap()
                    .load(url)
                    .submit()
                    .get();
            return bitmap;
        } catch (Exception e) {
            e.printStackTrace();
            return null;
        }
    }

    /**
     * Synchronous printing
     */

    private String preprocessImgTag(EscPosPrinter printer, String text) {

        Pattern p = Pattern.compile("(?<=\\<img\\>)(.*)(?=\\<\\/img\\>)");
        Matcher m = p.matcher(text);
        StringBuffer sb = new StringBuffer();
        while (m.find()) {
            String firstGroup = m.group(1);
            m.appendReplacement(sb, PrinterTextParserImg.bitmapToHexadecimalString(printer, getBitmapFromUrl(firstGroup)));
        }
        m.appendTail(sb);

        return sb.toString();
    }

    private void printIt(DeviceConnection printerConnection, String payload, boolean autoCut, boolean openCashbox, double mmFeedPaper, double printerDpi, double printerWidthMM, double printerNbrCharactersPerLine) {
        try {
            EscPosPrinter printer = new EscPosPrinter(printerConnection, (int) printerDpi, (float) printerWidthMM, (int) printerNbrCharactersPerLine);
            String processedPayload = preprocessImgTag(printer, payload);

            if (openCashbox) {
                printer.printFormattedTextAndOpenCashBox(processedPayload, (float) mmFeedPaper);
            } else if (autoCut) {
                printer.printFormattedTextAndCut(processedPayload, (float) mmFeedPaper);
            } else {
                printer.printFormattedText(processedPayload, (float) mmFeedPaper);
            }

            printer.disconnectPrinter();
            this.jsPromise.resolve(true);
        } catch (EscPosConnectionException e) {
            this.jsPromise.reject("Broken connection", e.getMessage());
        } catch (EscPosParserException e) {
            this.jsPromise.reject("Invalid formatted text", e.getMessage());
        } catch (EscPosEncodingException e) {
            this.jsPromise.reject("Bad selected encoding", e.getMessage());
        } catch (EscPosBarcodeException e) {
            this.jsPromise.reject("Invalid barcode", e.getMessage());
        } catch (Exception e) {
            this.jsPromise.reject("ERROR", e.getMessage());
        }
    }
}
