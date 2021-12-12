package com.pinmi.react.printer;

import android.graphics.Bitmap;
import android.graphics.BitmapFactory;
import android.util.Base64;
import android.util.Log;

import com.facebook.react.bridge.Callback;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;
import com.pinmi.react.printer.adapter.BLEPrinterDeviceId;
import com.pinmi.react.printer.adapter.NetPrinterAdapter;
import com.pinmi.react.printer.adapter.NetPrinterDeviceId;
import com.pinmi.react.printer.adapter.PrinterAdapter;

/**
 * Created by xiesubin on 2017/9/22.
 */

public class RNNetPrinterModule extends ReactContextBaseJavaModule implements RNPrinterModule {

    private PrinterAdapter adapter;
    private ReactApplicationContext reactContext;

    public RNNetPrinterModule(ReactApplicationContext reactContext){
        super(reactContext);
        this.reactContext = reactContext;
    }

    @ReactMethod
    @Override
    public void init(Callback successCallback, Callback errorCallback) {
        this.adapter = NetPrinterAdapter.getInstance();
        this.adapter.init(reactContext,  successCallback, errorCallback);
    }

    @ReactMethod
    @Override
    public void closeConn() {
        this.adapter = NetPrinterAdapter.getInstance();
        this.adapter.closeConnectionIfExists();
    }

    @ReactMethod
    @Override
    public void getDeviceList(Callback successCallback, Callback errorCallback) {
        try {
            this.adapter.getDeviceList(errorCallback);
            successCallback.invoke();
        } catch (Exception ex) {
            errorCallback.invoke(ex.getMessage());
        }
        // this.adapter.getDeviceList(errorCallback);
    }

    @ReactMethod
    public void connectPrinter(String host, Integer port, Callback successCallback, Callback errorCallback) {
        adapter.selectDevice(NetPrinterDeviceId.valueOf(host, port), successCallback, errorCallback);
    }

    @ReactMethod
    @Override
    public void printRawData(String base64Data, Callback errorCallback) {
        adapter.printRawData(base64Data, errorCallback);
    }

    @ReactMethod
    @Override
    public void printImageData(String imageUrl, Callback errorCallback) {
        Log.v("imageUrl", imageUrl);
        adapter.printImageData(imageUrl, errorCallback);
    }

    @ReactMethod
    @Override
    public void printImageBase64(String base64, Callback errorCallback) {
        // String imageBase64 = "data:image/png;base64," + imageUrl;
        // String base64ImageProcessed = imageUrl.split(",")[1];
        byte[] decodedString = Base64.decode(base64, Base64.DEFAULT);
        Bitmap decodedByte = BitmapFactory.decodeByteArray(decodedString, 0, decodedString.length);
        adapter.printImageBase64(decodedByte, errorCallback);
    }

    @Override
    public String getName() {
        return "RNNetPrinter";
    }
}
