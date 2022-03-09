package com.pinmi.react.printer;
import com.facebook.react.bridge.Callback;
import com.facebook.react.bridge.ReactMethod;

/**
 * Created by xiesubin on 2017/9/21.
 */

public interface RNPrinterModule {

    public void init(Callback successCallback, Callback errorCallback);

    public void closeConn();

    public void getDeviceList(Callback successCallback, Callback errorCallback);

    @ReactMethod
    public void printRawData(String base64Data, Callback errorCallback) ;

    @ReactMethod
    public void printImageData(String imageUrl, int imageWidth, int imageHeight, Callback errorCallback);

    @ReactMethod
    public void printImageBase64(String base64, int imageWidth, int imageHeight, Callback errorCallback) ;
}

