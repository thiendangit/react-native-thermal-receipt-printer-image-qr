package com.pinmi.react.printer.adapter;

import android.hardware.usb.UsbConstants;
import android.hardware.usb.UsbDevice;

import com.facebook.react.bridge.Arguments;
import com.facebook.react.bridge.WritableMap;

/**
 * Created by xiesubin on 2017/9/21.
 */

public class USBPrinterDevice implements PrinterDevice{
    private UsbDevice mDevice;
    private USBPrinterDeviceId usbPrinterDeviceId;

    public USBPrinterDevice(UsbDevice device) {
        this.usbPrinterDeviceId = USBPrinterDeviceId.valueOf(device.getVendorId(), device.getProductId());
        this.mDevice = device;
    }


    @Override
    public PrinterDeviceId getPrinterDeviceId() {
        return this.usbPrinterDeviceId;
    }

    public UsbDevice getUsbDevice() {
        return this.mDevice;
    }

    @Override
    public WritableMap toRNWritableMap() {
        WritableMap deviceMap = Arguments.createMap();
        deviceMap.putString("device_name", this.mDevice.getDeviceName());
        deviceMap.putInt("device_id", this.mDevice.getDeviceId());
        deviceMap.putInt("vendor_id", this.mDevice.getVendorId());
        deviceMap.putInt("product_id", this.mDevice.getProductId());
        deviceMap.putString("manufacturer_name", this.mDevice.getManufacturerName());
        deviceMap.putString("product_name", this.mDevice.getProductName());
        deviceMap.putBoolean("is_printer", isPrinter());
        return deviceMap;
    }

    // Cihaz veya arayuzlerinden biri USB printer sinifinda (7) mi
    public boolean isPrinter() {
        if (this.mDevice.getDeviceClass() == UsbConstants.USB_CLASS_PRINTER) return true;
        for (int i = 0; i < this.mDevice.getInterfaceCount(); i++) {
            if (this.mDevice.getInterface(i).getInterfaceClass() == UsbConstants.USB_CLASS_PRINTER) return true;
        }
        return false;
    }

}
