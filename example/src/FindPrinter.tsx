import React from 'react';
import {
  StyleSheet,
  View,
  TouchableOpacity,
  Text,
} from 'react-native';
import {
  NetPrinterEventEmitter,
  RN_THERMAL_RECEIPT_PRINTER_EVENTS,
  NetPrinter,
} from 'react-native-thermal-receipt-printer-image-qr';
import Loading from '../Loading';
import {navigate} from './App';

export interface DeviceType {
  host: string;
  port: string;
  device_name?: string;
  printerType?: string;
}

export const FindPrinter = () => {
  const [devices, setDevices] = React.useState<DeviceType[]>([]);
  const [loading, setLoading] = React.useState<boolean>(false);

  React.useEffect(() => {
    if (devices.length === 0) {
      setLoading(true);
      NetPrinterEventEmitter.addListener(
        RN_THERMAL_RECEIPT_PRINTER_EVENTS.EVENT_NET_PRINTER_SCANNED_SUCCESS,
        (printers: DeviceType[]) => {
          console.log({printers});
          if (printers) {
            console.log({printers});
            setLoading(false);
            setDevices(printers);
          }
        },
      );
      (async () => {
        const results = await NetPrinter.getDeviceList();
        console.log({results});
      })();
    }
    return () => {
      NetPrinterEventEmitter.removeAllListeners(
        RN_THERMAL_RECEIPT_PRINTER_EVENTS.EVENT_NET_PRINTER_SCANNED_SUCCESS,
      );
      NetPrinterEventEmitter.removeAllListeners(
        RN_THERMAL_RECEIPT_PRINTER_EVENTS.EVENT_NET_PRINTER_SCANNED_ERROR,
      );
    };
  }, []);

  if (loading) {
    return <Loading loading={true} text={'Finding'} />;
  }

  const onSelectedPrinter = (printer: any) => {
    navigate('Home', {printer});
  };

  return (
    <View style={styles.container} >
      {devices !== undefined &&
      devices?.length > 0 &&
      devices?.map((item: any, index) => {
        const onPress = () => onSelectedPrinter(item);
        return (
          <TouchableOpacity key={`printer-item-${index}`} onPress={onPress} >
            <Text >{item.host}</Text >
          </TouchableOpacity >
        );
      })}
    </View >
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
});
