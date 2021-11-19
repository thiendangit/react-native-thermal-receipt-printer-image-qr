package com.rnprinter;

import com.facebook.react.ReactActivity;

public class MainActivity extends ReactActivity {

  public static final String ACTION_USB_PERMISSION = "com.android.example.USB_PERMISSION";
  /**
   * Returns the name of the main component registered from JavaScript. This is used to schedule
   * rendering of the component.
   */
  @Override
  protected String getMainComponentName() {
    return "RNPrinter";
  }
}
