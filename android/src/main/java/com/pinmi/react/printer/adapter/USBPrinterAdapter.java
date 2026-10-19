package com.pinmi.react.printer.adapter;

import static com.pinmi.react.printer.adapter.UtilsImage.getPixelsSlow;
import static com.pinmi.react.printer.adapter.UtilsImage.recollectSlice;

import android.annotation.SuppressLint;
import android.app.PendingIntent;
import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.content.IntentFilter;
import android.graphics.Bitmap;
import android.graphics.BitmapFactory;
import android.hardware.usb.UsbConstants;
import android.hardware.usb.UsbDevice;
import android.hardware.usb.UsbDeviceConnection;
import android.hardware.usb.UsbEndpoint;
import android.hardware.usb.UsbInterface;
import android.hardware.usb.UsbManager;
import android.os.Build;
import android.util.Base64;
import android.util.Log;

import com.facebook.react.bridge.Arguments;
import com.facebook.react.bridge.Callback;
import com.facebook.react.bridge.Promise;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.WritableMap;
import com.facebook.react.modules.core.DeviceEventManagerModule;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.net.HttpURLConnection;
import java.net.URL;
import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;

/**
 * Created by xiesubin on 2017/9/20.
 *
 * Tek USB yazici destekler. connectPrinter izin varsa hemen, yoksa kullanici izin
 * diyalogunu cevapladiktan sonra sonuclanir. Yazdirma tek thread'li executor'da
 * sirali calisir; *Async metodlar sonucu Promise ile JS'e dondurur.
 */

public class USBPrinterAdapter implements PrinterAdapter {
    @SuppressLint("StaticFieldLeak")
    private static USBPrinterAdapter mInstance;


    private final String LOG_TAG = "RNUSBPrinter";
    private ReactApplicationContext mContext;
    private UsbManager mUSBManager;
    private PendingIntent mPermissionIndent;
    private boolean mReceiverRegistered = false;
    private UsbDevice mUsbDevice;
    private UsbDeviceConnection mUsbDeviceConnection;
    private UsbInterface mUsbInterface;
    private UsbEndpoint mEndPoint;
    // Izin diyalogu cevaplanana kadar bekleyen connectPrinter cagrisi
    private Callback mPendingSuccess;
    private Callback mPendingError;
    private final Object mLock = new Object();
    private final ExecutorService mExecutor = Executors.newSingleThreadExecutor();

    private static final String ACTION_USB_PERMISSION = "com.pinmi.react.USBPrinter.USB_PERMISSION";
    private static final String EVENT_USB_DEVICE_ATTACHED = "usbAttached";
    private static final String EVENT_USB_DEVICE_DETACHED = "usbDetached";

    private static final int TRANSFER_TIMEOUT = 5000;
    // 3 baytlik transferler yerine buyuk parcalar: tek fis saniyeler yerine yuzlerce ms
    private static final int CHUNK_SIZE = 16 * 1024;

    private final static char ESC_CHAR = 0x1B;
    private static final byte[] SELECT_BIT_IMAGE_MODE = {0x1B, 0x2A, 33};
    private final static byte[] SET_LINE_SPACE_24 = new byte[]{ESC_CHAR, 0x33, 24};
    private final static byte[] SET_LINE_SPACE_32 = new byte[]{ESC_CHAR, 0x33, 32};
    private final static byte[] LINE_FEED = new byte[]{0x0A};
    private static final byte[] CENTER_ALIGN = {0x1B, 0X61, 0X31};
    // NetPrinterAdapter.printImageBase64 ile ayni bitis komutlari
    private static final byte[] CUT = {0x1D, 0x56, 0x00};
    private static final byte[] OPEN_DRAWER = {0x1B, 0x70, 0x00, 0x19, (byte) 0xFA};
    private static final byte[] BEEP = {0x1B, 0x42, 0x02, 0x02};

    private USBPrinterAdapter() {
    }

    public static USBPrinterAdapter getInstance() {
        if (mInstance == null) {
            mInstance = new USBPrinterAdapter();
        }
        return mInstance;
    }

    private final BroadcastReceiver mUsbDeviceReceiver = new BroadcastReceiver() {
        @Override
        public void onReceive(Context context, Intent intent) {
            String action = intent.getAction();
            UsbDevice usbDevice = intent.getParcelableExtra(UsbManager.EXTRA_DEVICE);
            if (ACTION_USB_PERMISSION.equals(action)) {
                onPermissionResult(usbDevice, intent.getBooleanExtra(UsbManager.EXTRA_PERMISSION_GRANTED, false));
            } else if (UsbManager.ACTION_USB_DEVICE_DETACHED.equals(action)) {
                synchronized (mLock) {
                    if (mUsbDevice != null && usbDevice != null && mUsbDevice.getDeviceId() == usbDevice.getDeviceId()) {
                        closeConnectionIfExists();
                        // Tekrar takildiginda yeni UsbDevice nesnesi gelir, eskisi kullanilamaz
                        mUsbDevice = null;
                    }
                }
                emit(EVENT_USB_DEVICE_DETACHED, usbDevice);
            } else if (UsbManager.ACTION_USB_DEVICE_ATTACHED.equals(action)) {
                emit(EVENT_USB_DEVICE_ATTACHED, usbDevice);
            }
        }
    };

    private void emit(String event, UsbDevice usbDevice) {
        if (mContext == null || !mContext.hasActiveReactInstance()) return;
        mContext.getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter.class)
                .emit(event, usbDevice != null ? new USBPrinterDevice(usbDevice).toRNWritableMap() : null);
    }

    private void onPermissionResult(UsbDevice usbDevice, boolean granted) {
        Callback success;
        Callback error;
        synchronized (mLock) {
            success = mPendingSuccess;
            error = mPendingError;
            mPendingSuccess = null;
            mPendingError = null;
            if (granted && usbDevice != null) {
                Log.i(LOG_TAG, "permission granted, vendor_id: " + usbDevice.getVendorId() + " product_id: " + usbDevice.getProductId());
                mUsbDevice = usbDevice;
            }
        }
        if (granted && usbDevice != null) {
            if (success != null) success.invoke(new USBPrinterDevice(usbDevice).toRNWritableMap());
        } else if (error != null) {
            error.invoke("USB permission denied");
        }
    }

    public void init(ReactApplicationContext reactContext, Callback successCallback, Callback errorCallback) {
        this.mContext = reactContext;
        this.mUSBManager = (UsbManager) this.mContext.getSystemService(Context.USB_SERVICE);
        // Sistem EXTRA_DEVICE / EXTRA_PERMISSION_GRANTED ekleyebilsin diye MUTABLE olmali
        // (IMMUTABLE'da izin sonucu hic gelmez). Android 14+ mutable PendingIntent'i sadece
        // explicit (paketli) intent ile kabul eder.
        Intent permissionIntent = new Intent(ACTION_USB_PERMISSION).setPackage(mContext.getPackageName());
        int flags = PendingIntent.FLAG_UPDATE_CURRENT;
        if (Build.VERSION.SDK_INT >= 31) {
            flags |= PendingIntent.FLAG_MUTABLE;
        }
        this.mPermissionIndent = PendingIntent.getBroadcast(mContext, 0, permissionIntent, flags);
        // init birden fazla cagrilabilir; receiver bir kez kaydolsun
        if (!mReceiverRegistered) {
            IntentFilter filter = new IntentFilter(ACTION_USB_PERMISSION);
            filter.addAction(UsbManager.ACTION_USB_DEVICE_DETACHED);
            filter.addAction(UsbManager.ACTION_USB_DEVICE_ATTACHED);
            // Android 14 (API 34)+ runtime receiver icin export flag zorunlu. ACTION_USB_PERMISSION
            // uygulamaya ozel bir action oldugu icin RECEIVER_NOT_EXPORTED (deger 4, API 33 sabiti).
            if (Build.VERSION.SDK_INT >= 33) {
                mContext.registerReceiver(mUsbDeviceReceiver, filter, 4 /* Context.RECEIVER_NOT_EXPORTED */);
            } else {
                mContext.registerReceiver(mUsbDeviceReceiver, filter);
            }
            mReceiverRegistered = true;
        }
        Log.v(LOG_TAG, "RNUSBPrinter initialized");
        successCallback.invoke();
    }


    public void closeConnectionIfExists() {
        synchronized (mLock) {
            if (mUsbDeviceConnection != null) {
                mUsbDeviceConnection.releaseInterface(mUsbInterface);
                mUsbDeviceConnection.close();
                mUsbInterface = null;
                mEndPoint = null;
                mUsbDeviceConnection = null;
            }
        }
    }

    public List<PrinterDevice> getDeviceList(Callback errorCallback) {
        List<PrinterDevice> lists = new ArrayList<>();
        if (mUSBManager == null) {
            errorCallback.invoke("USBManager is not initialized while get device list");
            return lists;
        }

        for (UsbDevice usbDevice : mUSBManager.getDeviceList().values()) {
            lists.add(new USBPrinterDevice(usbDevice));
        }
        return lists;
    }

    private UsbDevice findDevice(int vendorId, int productId) {
        if (mUSBManager == null) return null;
        for (UsbDevice usbDevice : mUSBManager.getDeviceList().values()) {
            if (usbDevice.getVendorId() == vendorId && usbDevice.getProductId() == productId) {
                return usbDevice;
            }
        }
        return null;
    }


    @Override
    public void selectDevice(PrinterDeviceId printerDeviceId, Callback successCallback, Callback errorCallback) {
        if (mUSBManager == null) {
            errorCallback.invoke("USBManager is not initialized before select device");
            return;
        }

        USBPrinterDeviceId usbPrinterDeviceId = (USBPrinterDeviceId) printerDeviceId;
        UsbDevice usbDevice = findDevice(usbPrinterDeviceId.getVendorId(), usbPrinterDeviceId.getProductId());
        if (usbDevice == null) {
            errorCallback.invoke("can not find specified device");
            return;
        }

        synchronized (mLock) {
            if (mUsbDevice != null && mUsbDevice.getDeviceId() != usbDevice.getDeviceId()) {
                closeConnectionIfExists();
                mUsbDevice = null;
            }
            if (!mUSBManager.hasPermission(usbDevice)) {
                // Onceki bekleyen istek cevapsiz kalmasin
                if (mPendingError != null) mPendingError.invoke("USB permission request replaced");
                mPendingSuccess = successCallback;
                mPendingError = errorCallback;
                Log.v(LOG_TAG, "request permission for device: vendor_id: " + usbDevice.getVendorId() + ", product_id: " + usbDevice.getProductId());
                mUSBManager.requestPermission(usbDevice, mPermissionIndent);
                return;
            }
            mUsbDevice = usbDevice;
        }
        successCallback.invoke(new USBPrinterDevice(usbDevice).toRNWritableMap());
    }

    // attached: cihaz takili, permission: izin var, selected: yazdirma bu cihaza gidecek
    public WritableMap getStatus(int vendorId, int productId) {
        WritableMap status = Arguments.createMap();
        UsbDevice usbDevice = findDevice(vendorId, productId);
        boolean attached = usbDevice != null;
        boolean permission = attached && mUSBManager.hasPermission(usbDevice);
        boolean selected;
        synchronized (mLock) {
            selected = attached && mUsbDevice != null && mUsbDevice.getDeviceId() == usbDevice.getDeviceId();
        }
        status.putBoolean("attached", attached);
        status.putBoolean("permission", permission);
        status.putBoolean("selected", selected);
        return status;
    }

    // Printer sinifindaki (7) arayuz tercih edilir, yoksa bulk OUT endpoint'i olan ilk arayuz
    private boolean openConnection() {
        if (mUsbDevice == null) {
            Log.e(LOG_TAG, "USB Deivce is not initialized");
            return false;
        }
        if (mUSBManager == null) {
            Log.e(LOG_TAG, "USB Manager is not initialized");
            return false;
        }

        if (mUsbDeviceConnection != null) {
            return true;
        }

        UsbInterface chosenInterface = null;
        UsbEndpoint chosenEndpoint = null;
        for (int i = 0; i < mUsbDevice.getInterfaceCount(); i++) {
            UsbInterface usbInterface = mUsbDevice.getInterface(i);
            UsbEndpoint out = findBulkOut(usbInterface);
            if (out == null) continue;
            if (usbInterface.getInterfaceClass() == UsbConstants.USB_CLASS_PRINTER) {
                chosenInterface = usbInterface;
                chosenEndpoint = out;
                break;
            }
            if (chosenInterface == null) {
                chosenInterface = usbInterface;
                chosenEndpoint = out;
            }
        }
        if (chosenInterface == null) {
            Log.e(LOG_TAG, "no bulk out endpoint");
            return false;
        }

        UsbDeviceConnection usbDeviceConnection = mUSBManager.openDevice(mUsbDevice);
        if (usbDeviceConnection == null) {
            Log.e(LOG_TAG, "failed to open USB Connection");
            return false;
        }
        if (!usbDeviceConnection.claimInterface(chosenInterface, true)) {
            usbDeviceConnection.close();
            Log.e(LOG_TAG, "failed to claim usb connection");
            return false;
        }
        mEndPoint = chosenEndpoint;
        mUsbInterface = chosenInterface;
        mUsbDeviceConnection = usbDeviceConnection;
        Log.i(LOG_TAG, "Device connected");
        return true;
    }

    private static UsbEndpoint findBulkOut(UsbInterface usbInterface) {
        for (int i = 0; i < usbInterface.getEndpointCount(); i++) {
            UsbEndpoint ep = usbInterface.getEndpoint(i);
            if (ep.getType() == UsbConstants.USB_ENDPOINT_XFER_BULK && ep.getDirection() == UsbConstants.USB_DIR_OUT) {
                return ep;
            }
        }
        return null;
    }

    // Executor thread'inde calisir. Hatada baglanti kapatilir ki sonraki is yeniden acsin.
    private void writeBytes(byte[] bytes) throws IOException {
        synchronized (mLock) {
            if (!openConnection()) {
                throw new IOException("failed to connected to device");
            }
            int offset = 0;
            while (offset < bytes.length) {
                int length = Math.min(CHUNK_SIZE, bytes.length - offset);
                int sent = mUsbDeviceConnection.bulkTransfer(mEndPoint, bytes, offset, length, TRANSFER_TIMEOUT);
                if (sent < 0) {
                    closeConnectionIfExists();
                    throw new IOException("bulkTransfer failed at " + offset + "/" + bytes.length);
                }
                offset += sent;
            }
        }
    }

    private void writeAsync(final byte[] bytes, final Promise promise, final Callback errorCallback) {
        mExecutor.execute(new Runnable() {
            @Override
            public void run() {
                try {
                    writeBytes(bytes);
                    if (promise != null) promise.resolve(null);
                } catch (IOException e) {
                    Log.e(LOG_TAG, "failed to print data: " + e.getMessage());
                    if (promise != null) promise.reject("USB_PRINT_ERROR", e.getMessage());
                    else if (errorCallback != null) errorCallback.invoke(e.getMessage());
                }
            }
        });
    }

    private static byte[] buildImageBytes(Bitmap bitmapImage, int imageWidth, int imageHeight) {
        int[][] pixels = getPixelsSlow(bitmapImage, imageWidth, imageHeight);
        ByteArrayOutputStream out = new ByteArrayOutputStream();

        out.write(SET_LINE_SPACE_24, 0, SET_LINE_SPACE_24.length);
        out.write(CENTER_ALIGN, 0, CENTER_ALIGN.length);

        for (int y = 0; y < pixels.length; y += 24) {
            // Like I said before, when done sending data,
            // the printer will resume to normal text printing
            out.write(SELECT_BIT_IMAGE_MODE, 0, SELECT_BIT_IMAGE_MODE.length);
            // Set nL and nH based on the width of the image
            out.write(0x00ff & pixels[y].length);
            out.write((0xff00 & pixels[y].length) >> 8);
            for (int x = 0; x < pixels[y].length; x++) {
                // for each stripe, recollect 3 bytes (3 bytes = 24 bits)
                byte[] slice = recollectSlice(y, x, pixels);
                out.write(slice, 0, slice.length);
            }
            // Do a line feed, if not the printing will resume on the same line
            out.write(LINE_FEED, 0, LINE_FEED.length);
        }

        out.write(SET_LINE_SPACE_32, 0, SET_LINE_SPACE_32.length);
        out.write(LINE_FEED, 0, LINE_FEED.length);
        out.write(LINE_FEED, 0, LINE_FEED.length);
        out.write(LINE_FEED, 0, LINE_FEED.length);
        out.write(CUT, 0, CUT.length);
        // Cekmece acilmazsa ikinci bayt 0x00 -> 0x01 denenebilir
        out.write(OPEN_DRAWER, 0, OPEN_DRAWER.length);
        // Buzzer'i olmayan modeller komutu yok sayar
        out.write(BEEP, 0, BEEP.length);
        return out.toByteArray();
    }


    public void printRawData(String data, Callback errorCallback) {
        writeAsync(Base64.decode(data, Base64.DEFAULT), null, errorCallback);
    }

    public void printRawDataAsync(String data, Promise promise) {
        writeAsync(Base64.decode(data, Base64.DEFAULT), promise, null);
    }

    public static Bitmap getBitmapFromURL(String src) {
        try {
            URL url = new URL(src);
            HttpURLConnection connection = (HttpURLConnection) url.openConnection();
            connection.setDoInput(true);
            connection.connect();
            InputStream input = connection.getInputStream();
            return BitmapFactory.decodeStream(input);
        } catch (IOException e) {
            // Log exception
            return null;
        }
    }


    @Override
    public void printImageData(final String imageUrl, int imageWidth, int imageHeight, Callback errorCallback) {
        final Bitmap bitmapImage = getBitmapFromURL(imageUrl);

        if (bitmapImage == null) {
            errorCallback.invoke("image not found");
            return;
        }
        writeAsync(buildImageBytes(bitmapImage, imageWidth, imageHeight), null, errorCallback);
    }

    @Override
    public void printImageBase64(final Bitmap bitmapImage, int imageWidth, int imageHeight, Callback errorCallback) {
        if (bitmapImage == null) {
            errorCallback.invoke("image not found");
            return;
        }
        writeAsync(buildImageBytes(bitmapImage, imageWidth, imageHeight), null, errorCallback);
    }

    public void printImageBase64Async(final Bitmap bitmapImage, int imageWidth, int imageHeight, Promise promise) {
        if (bitmapImage == null) {
            promise.reject("USB_PRINT_ERROR", "image not found");
            return;
        }
        writeAsync(buildImageBytes(bitmapImage, imageWidth, imageHeight), promise, null);
    }
}
