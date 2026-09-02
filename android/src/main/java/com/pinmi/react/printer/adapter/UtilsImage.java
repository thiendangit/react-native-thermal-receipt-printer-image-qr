package com.pinmi.react.printer.adapter;

import android.graphics.Bitmap;
import android.graphics.BitmapFactory;
import android.graphics.Color;

import java.io.IOException;
import java.io.InputStream;
import java.net.HttpURLConnection;
import java.net.URL;

public class UtilsImage {
    // Printers only ever render at reqWidth/reqHeight (see getPixelsSlow below), so
    // decoding the source at full resolution just to downscale it afterwards wastes
    // memory on large images. Downsample during decode instead.
    public static Bitmap getBitmapFromURL(String src, int reqWidth, int reqHeight) {
        try {
            BitmapFactory.Options boundsOptions = new BitmapFactory.Options();
            boundsOptions.inJustDecodeBounds = true;
            InputStream boundsInput = new URL(src).openStream();
            try {
                BitmapFactory.decodeStream(boundsInput, null, boundsOptions);
            } finally {
                boundsInput.close();
            }

            BitmapFactory.Options decodeOptions = new BitmapFactory.Options();
            decodeOptions.inSampleSize = calculateInSampleSize(boundsOptions, reqWidth, reqHeight);
            InputStream decodeInput = new URL(src).openStream();
            try {
                return BitmapFactory.decodeStream(decodeInput, null, decodeOptions);
            } finally {
                decodeInput.close();
            }
        } catch (IOException e) {
            return null;
        }
    }

    private static int calculateInSampleSize(BitmapFactory.Options options, int reqWidth, int reqHeight) {
        int inSampleSize = 1;
        if (reqWidth <= 0 || reqHeight <= 0) {
            return inSampleSize;
        }
        int height = options.outHeight;
        int width = options.outWidth;
        if (height > reqHeight || width > reqWidth) {
            int halfHeight = height / 2;
            int halfWidth = width / 2;
            while ((halfHeight / inSampleSize) >= reqHeight && (halfWidth / inSampleSize) >= reqWidth) {
                inSampleSize *= 2;
            }
        }
        return inSampleSize;
    }

    public static Bitmap getBitmapResized(Bitmap image, float decreaseSizeBy, int imageWidth, int imageHeight) {
        int imageWidthForResize = image.getWidth();
        int imageHeightForResize = image.getHeight();
        if (imageWidth > 0) {
            imageWidthForResize = imageWidth;
        }

        if (imageHeight > 0) {
            imageHeightForResize = imageHeight;
        }
        return Bitmap.createScaledBitmap(image, (int) (imageWidthForResize * decreaseSizeBy),
                (int) (imageHeightForResize * decreaseSizeBy), true);
    }

    public static int getRGB(Bitmap bmpOriginal, int col, int row) {
        // get one pixel color
        int pixel = bmpOriginal.getPixel(col, row);
        // retrieve color of all channels
        int R = Color.red(pixel);
        int G = Color.green(pixel);
        int B = Color.blue(pixel);
        return Color.rgb(R, G, B);
    }

    public static Bitmap resizeTheImageForPrinting(Bitmap image, int imageWidth, int imageHeight) {
        // making logo size 150 or less pixels
        int width = image.getWidth();
        int height = image.getHeight();
        if (Integer.toString(imageWidth) != null || Integer.toString(imageHeight) != null) {
            return getBitmapResized(image, 1, imageWidth, imageHeight);
        }
        if (width > 200 || height > 200) {
            float decreaseSizeBy;
            if (width > height) {
                decreaseSizeBy = (200.0f / width);
            } else {
                decreaseSizeBy = (200.0f / height);
            }
            return getBitmapResized(image, decreaseSizeBy, 0, 0);
        }
        return image;
    }

    public static boolean shouldPrintColor(int col) {
        final int threshold = 127;
        int a, r, g, b, luminance;
        a = (col >> 24) & 0xff;
        if (a != 0xff) {// Ignore transparencies
            return false;
        }
        r = (col >> 16) & 0xff;
        g = (col >> 8) & 0xff;
        b = col & 0xff;

        luminance = (int) (0.299 * r + 0.587 * g + 0.114 * b);

        return luminance < threshold;
    }

    public static byte[] recollectSlice(int y, int x, int[][] img) {
        byte[] slices = new byte[]{0, 0, 0};
        for (int yy = y, i = 0; yy < y + 24 && i < 3; yy += 8, i++) {
            byte slice = 0;
            for (int b = 0; b < 8; b++) {
                int yyy = yy + b;
                if (yyy >= img.length) {
                    continue;
                }
                int col = img[yyy][x];
                boolean v = shouldPrintColor(col);
                slice |= (byte) ((v ? 1 : 0) << (7 - b));
            }
            slices[i] = slice;
        }
        return slices;
    }

    public static int[][] getPixelsSlow(Bitmap image2, int imageWidth, int imageHeight) {

        Bitmap image = resizeTheImageForPrinting(image2, imageWidth, imageHeight);

        int width = image.getWidth();
        int height = image.getHeight();
        int[][] result = new int[height][width];
        for (int row = 0; row < height; row++) {
            for (int col = 0; col < width; col++) {
                result[row][col] = getRGB(image, col, row);
            }
        }
        return result;
    }
}
