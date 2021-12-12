# react-native-thermal-receipt-printer-image-qr

- I fork this for my quickly project print with NET(android & ios) and USB(android) with Image & QR.
- Bluetooth just using old structure (ios & android) not implement printing with Image & QR.
- Fork of `react-native-thermal-receipt-printer` and add implement :
    + Image & QR : :heavy_check_mark:
    + Fix cut : :heavy_check_mark:
    + Print With Column : :heavy_check_mark:
  ## Implement

| Implement    | Android            | IOS                |
| ---------- | ------------------ | ------------------ |
| Image & QR | :heavy_check_mark: |   :heavy_check_mark: But print bluetooth just implement not tested yet              |
| Fix cut | :heavy_check_mark: | :heavy_check_mark: |
| Print With Column | :heavy_check_mark: | :heavy_check_mark: |
| NET Connect Timeout | :heavy_check_mark: | :heavy_check_mark: |

<div style="display: flex; flex-direction: row; align-self: center; align-items: center">
<img src="image/bill.jpg" alt="bill" width="250" height="580"/>
<img src="image/screenshot.jpg" alt="screenshot" width="250" height="580"/>
</div>

## Installation
```
npm i react-native-thermal-receipt-printer-image-qr
```
or
```
yarn add react-native-thermal-receipt-printer-image-qr
```

## Troubleshoot

- when install in `react-native` version >= 0.60, xcode show this error

```
duplicate symbols for architecture x86_64
```

that because the .a library uses [CocoaAsyncSocket](https://github.com/robbiehanson/CocoaAsyncSocket) library and Flipper uses it too

_Podfile_

```diff
...
  use_native_modules!

  # Enables Flipper.
  #
  # Note that if you have use_frameworks! enabled, Flipper will not work and
  # you should disable these next few lines.
  # add_flipper_pods!
  # post_install do |installer|
  #   flipper_post_install(installer)
  # end
...
```

and comment out code related to Flipper in `ios/AppDelegate.m`

## Support

| Printer    | Android            | IOS                |
| ---------- | ------------------ | ------------------ |
| USBPrinter | :heavy_check_mark: |                    |
| BLEPrinter | :heavy_check_mark: | :heavy_check_mark: |
| NetPrinter | :heavy_check_mark: | :heavy_check_mark: |

## Development workflow

To get started with the project, run `yarn bootstrap` in the root directory to install the required dependencies for each package:

```sh
yarn bootstrap
```

While developing, you can run the [example app](/example/) to test your changes.

To start the packager:

```sh
yarn example start
```

To run the example app on Android:

```sh
yarn example dev-android
```

To run the example app on iOS:

```sh
yarn example ios
```
