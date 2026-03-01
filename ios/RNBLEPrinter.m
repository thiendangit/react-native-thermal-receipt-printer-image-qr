#import <Foundation/Foundation.h>

#import "RNBLEPrinter.h"
#import "PrinterSDK.h"

@implementation RNBLEPrinter

- (dispatch_queue_t)methodQueue
{
    return dispatch_get_main_queue();
}

RCT_EXPORT_MODULE()

RCT_EXPORT_METHOD(init:(RCTResponseSenderBlock)successCallback
                  fail:(RCTResponseSenderBlock)errorCallback) {
    @try {
        _printerArray = [NSMutableArray new];
        m_printer = [[NSObject alloc] init];
        [[NSNotificationCenter defaultCenter] addObserver:self selector:@selector(handleNetPrinterConnectedNotification:) name:@"NetPrinterConnected" object:nil];
        // Do NOT call scanPrintersWithCompletion here — CoreBluetooth may not be powered on yet,
        // which causes "API MISUSE: CBCentralManager can only accept this command while in powered on state"
        successCallback(@[@"Init successful"]);
    } @catch (NSException *exception) {
        errorCallback(@[@"No bluetooth adapter available"]);
    }
}

- (void)handleNetPrinterConnectedNotification:(NSNotification*)notification
{
    m_printer = nil;
}

RCT_EXPORT_METHOD(getDeviceList:(RCTResponseSenderBlock)successCallback
                  fail:(RCTResponseSenderBlock)errorCallback) {
    @try {
        !_printerArray ? [NSException raise:@"Null pointer exception" format:@"Must call init function first"] : nil;
        // Reset array before each scan so we don't accumulate stale devices
        _printerArray = [NSMutableArray new];
        [[PrinterSDK defaultPrinterSDK] scanPrintersWithCompletion:^(Printer* printer){
            [_printerArray addObject:printer];
        }];
        // Wait for BLE scan to collect devices, then return the full list once
        dispatch_after(dispatch_time(DISPATCH_TIME_NOW, (int64_t)(5.0 * NSEC_PER_SEC)), dispatch_get_main_queue(), ^{
            NSMutableArray *mapped = [NSMutableArray arrayWithCapacity:[_printerArray count]];
            [_printerArray enumerateObjectsUsingBlock:^(id obj, NSUInteger idx, BOOL *stop) {
                Printer *printer = (Printer *)obj;
                NSDictionary *dict = @{ @"device_name" : printer.name, @"inner_mac_address" : printer.UUIDString};
                [mapped addObject:dict];
            }];
            NSMutableArray *uniquearray = (NSMutableArray *)[[NSSet setWithArray:mapped] allObjects];
            successCallback(@[uniquearray]);
        });
    } @catch (NSException *exception) {
        errorCallback(@[exception.reason]);
    }
}

RCT_EXPORT_METHOD(connectPrinter:(NSString *)inner_mac_address
                  success:(RCTResponseSenderBlock)successCallback
                  fail:(RCTResponseSenderBlock)errorCallback) {
    @try {
        __block BOOL found = NO;
        __block Printer* selectedPrinter = nil;
        [_printerArray enumerateObjectsUsingBlock: ^(id obj, NSUInteger idx, BOOL *stop){
            selectedPrinter = (Printer *)obj;
            if ([inner_mac_address isEqualToString:(selectedPrinter.UUIDString)]) {
                found = YES;
                *stop = YES;
            }
        }];

        if (found) {
            [[PrinterSDK defaultPrinterSDK] connectBT:selectedPrinter];
            [[NSNotificationCenter defaultCenter] postNotificationName:@"BLEPrinterConnected" object:nil];
            m_printer = selectedPrinter;
            successCallback(@[[NSString stringWithFormat:@"Connected to printer %@", selectedPrinter.name]]);
        } else {
            [NSException raise:@"Invalid connection" format:@"connectPrinter: Can't connect to printer %@", inner_mac_address];
        }
    } @catch (NSException *exception) {
        errorCallback(@[exception.reason]);
    }
}

RCT_EXPORT_METHOD(printRawData:(NSString *)text
                  printerOptions:(NSDictionary *)options
                  fail:(RCTResponseSenderBlock)errorCallback) {
    @try {
        !m_printer ? [NSException raise:@"Invalid connection" format:@"printRawData: Can't connect to printer"] : nil;

        // On iOS the JS layer sends plain text (not base64), so use the string directly.
        // Previously this tried to base64-decode the text, which produced nil and printed blank paper.
        NSString *printString = text;

        NSNumber* boldPtr = [options valueForKey:@"bold"];
        NSNumber* alignCenterPtr = [options valueForKey:@"center"];

        BOOL bold = boldPtr ? (BOOL)[boldPtr intValue] : NO;
        BOOL alignCenter = alignCenterPtr ? (BOOL)[alignCenterPtr intValue] : NO;

        bold ? [[PrinterSDK defaultPrinterSDK] sendHex:@"1B2108"] : [[PrinterSDK defaultPrinterSDK] sendHex:@"1B2100"];
        alignCenter ? [[PrinterSDK defaultPrinterSDK] sendHex:@"1B6102"] : [[PrinterSDK defaultPrinterSDK] sendHex:@"1B6101"];
        [[PrinterSDK defaultPrinterSDK] printText:printString];

        NSNumber* beepPtr = [options valueForKey:@"beep"];
        NSNumber* cutPtr = [options valueForKey:@"cut"];

        BOOL beep = beepPtr ? (BOOL)[beepPtr intValue] : NO;
        BOOL cut = cutPtr ? (BOOL)[cutPtr intValue] : NO;

        beep ? [[PrinterSDK defaultPrinterSDK] beep] : nil;
        cut ? [[PrinterSDK defaultPrinterSDK] cutPaper] : nil;

    } @catch (NSException *exception) {
        errorCallback(@[exception.reason]);
    }
}

RCT_EXPORT_METHOD(printImageData:(NSString *)imgUrl
                  printerOptions:(NSDictionary *)options
                  fail:(RCTResponseSenderBlock)errorCallback) {
    @try {

        !m_printer ? [NSException raise:@"Invalid connection" format:@"Can't connect to printer"] : nil;
        NSURL* url = [NSURL URLWithString:imgUrl];
        NSData* imageData = [NSData dataWithContentsOfURL:url];

        NSString* printerWidthType = [options valueForKey:@"printerWidthType"];

        NSInteger printerWidth = 576;

        if(printerWidthType != nil && [printerWidthType isEqualToString:@"58"]) {
            printerWidth = 384;
        }

        if(imageData != nil){
            UIImage* image = [UIImage imageWithData:imageData];
            UIImage* printImage = [self getPrintImage:image printerOptions:options];

            [[PrinterSDK defaultPrinterSDK] setPrintWidth:printerWidth];
            [[PrinterSDK defaultPrinterSDK] printImage:printImage ];
        }

    } @catch (NSException *exception) {
        errorCallback(@[exception.reason]);
    }
}

RCT_EXPORT_METHOD(printImageBase64:(NSString *)base64Qr
                  printerOptions:(NSDictionary *)options
                  fail:(RCTResponseSenderBlock)errorCallback) {
    @try {

        !m_printer ? [NSException raise:@"Invalid connection" format:@"Can't connect to printer"] : nil;
        if(![base64Qr  isEqual: @""]){
            NSString *result = [@"data:image/png;base64," stringByAppendingString:base64Qr];
            NSURL *url = [NSURL URLWithString:result];
            NSData *imageData = [NSData dataWithContentsOfURL:url];
            NSString* printerWidthType = [options valueForKey:@"printerWidthType"];

            NSInteger printerWidth = 576;

            if(printerWidthType != nil && [printerWidthType isEqualToString:@"58"]) {
                printerWidth = 384;
            }

            if(imageData != nil){
                UIImage* image = [UIImage imageWithData:imageData];
                UIImage* printImage = [self getPrintImage:image printerOptions:options];

                [[PrinterSDK defaultPrinterSDK] setPrintWidth:printerWidth];
                [[PrinterSDK defaultPrinterSDK] printImage:printImage ];
            }
        }
    } @catch (NSException *exception) {
        errorCallback(@[exception.reason]);
    }
}

-(UIImage *)getPrintImage:(UIImage *)image
           printerOptions:(NSDictionary *)options {
   NSNumber* nWidth = [options valueForKey:@"imageWidth"];
   NSNumber* nHeight = [options valueForKey:@"imageHeight"];
   NSNumber* nPaddingX = [options valueForKey:@"paddingX"];

   CGFloat newWidth = 150;
   if(nWidth != nil) {
       newWidth = [nWidth floatValue];
   }

   CGFloat newHeight = image.size.height;
   if(nHeight != nil) {
       newHeight = [nHeight floatValue];
   }

   CGFloat paddingX = 250;
   if(nPaddingX != nil) {
       paddingX = [nPaddingX floatValue];
   }

   CGFloat _newHeight = newHeight;
   CGSize newSize = CGSizeMake(newWidth, _newHeight);
   UIGraphicsBeginImageContextWithOptions(newSize, false, 0.0);
   CGContextRef context = UIGraphicsGetCurrentContext();
   CGContextSetInterpolationQuality(context, kCGInterpolationHigh);
   CGImageRef immageRef = image.CGImage;
   CGContextDrawImage(context, CGRectMake(0, 0, newWidth, newHeight), immageRef);
   CGImageRef newImageRef = CGBitmapContextCreateImage(context);
   UIImage* newImage = [UIImage imageWithCGImage:newImageRef];

   CGImageRelease(newImageRef);
   UIGraphicsEndImageContext();

   UIImage* paddedImage = [self addImagePadding:newImage paddingX:paddingX paddingY:0];
   return paddedImage;
}

-(UIImage *)addImagePadding:(UIImage * )image
                   paddingX: (CGFloat) paddingX
                   paddingY: (CGFloat) paddingY
{
    CGFloat width = image.size.width + paddingX;
    CGFloat height = image.size.height + paddingY;

    UIGraphicsBeginImageContextWithOptions(CGSizeMake(width, height), true, 0.0);
    CGContextRef context = UIGraphicsGetCurrentContext();
    CGContextSetFillColorWithColor(context, [UIColor whiteColor].CGColor);
    CGContextSetInterpolationQuality(context, kCGInterpolationHigh);
    CGContextFillRect(context, CGRectMake(0, 0, width, height));
    CGFloat originX = (width - image.size.width)/2;
    CGFloat originY = (height -  image.size.height)/2;
    CGImageRef immageRef = image.CGImage;
    CGContextDrawImage(context, CGRectMake(originX, originY, image.size.width, image.size.height), immageRef);
    CGImageRef newImageRef = CGBitmapContextCreateImage(context);
    UIImage* paddedImage = [UIImage imageWithCGImage:newImageRef];

    CGImageRelease(newImageRef);
    UIGraphicsEndImageContext();

    return paddedImage;
}

RCT_EXPORT_METHOD(closeConn) {
    @try {
        !m_printer ? [NSException raise:@"Invalid connection" format:@"closeConn: Can't connect to printer"] : nil;
        [[PrinterSDK defaultPrinterSDK] disconnect];
        m_printer = nil;
    } @catch (NSException *exception) {
        NSLog(@"%@", exception.reason);
    }
}

@end

