/* eslint-disable react-native/no-inline-styles */
import {Picker} from '@react-native-picker/picker';
import * as React from 'react';
import {
  StyleSheet,
  View,
  Text,
  Platform,
  Alert,
  TouchableOpacity,
  Dimensions,
  TextInput,
} from 'react-native';
import {
  BLEPrinter,
  NetPrinter,
  USBPrinter,
  IUSBPrinter,
  IBLEPrinter,
  INetPrinter,
  ColumnAliment,
  COMMANDS
} from 'react-native-thermal-receipt-printer-image-qr';
import Loading from '../Loading';
import {DeviceType} from './FindPrinter';
import {navigate} from './App';
import AntIcon from 'react-native-vector-icons/AntDesign';
import QRCode from 'react-native-qrcode-svg';
import {useRef} from 'react';
import {Buffer} from 'buffer';

const printerList: Record<string, any> = {
  ble: BLEPrinter,
  net: NetPrinter,
  usb: USBPrinter,
};

export interface SelectedPrinter
  extends Partial<IUSBPrinter & IBLEPrinter & INetPrinter> {
  printerType?: keyof typeof printerList;
}

export const PORT: string = '9100';

export enum DevicesEnum {
  usb = 'usb',
  net = 'net',
  blu = 'blu',
}

const deviceWidth = Dimensions.get('window').width;
const EscPosEncoder = require('esc-pos-encoder')

export const HomeScreen = ({route}: any) => {
  const [selectedValue, setSelectedValue] = React.useState<keyof typeof printerList>(DevicesEnum.net);
  const [devices, setDevices] = React.useState([]);
  // const [connected, setConnected] = React.useState(false);
  const [loading, setLoading] = React.useState<boolean>(false);
  const [selectedPrinter, setSelectedPrinter] = React.useState<SelectedPrinter>(
    {},
  );
  let QrRef = useRef<any>(null);
  const [selectedNetPrinter, setSelectedNetPrinter] =
    React.useState<DeviceType>({
      device_name: 'My Net Printer',
      host: '192.168.0.200', // your host
      port: PORT, // your port
      printerType: DevicesEnum.net,
    });

  React.useEffect(() => {
    if (route.params?.printer) {
      setSelectedNetPrinter({
        ...selectedNetPrinter,
        ...route.params.printer,
      });
    }
  }, [route.params?.printer]);

  const getListDevices = async () => {
    const Printer = printerList[selectedValue];
    // get list device for net printers is support scanning in local ip but not recommended
    if (selectedValue === DevicesEnum.net) {
      await Printer.init();
      setLoading(false);
      return;
    }
    requestAnimationFrame(async () => {
      try {
        await Printer.init();
        const results = await Printer.getDeviceList();
        setDevices(
          results?.map((item: any) => ({
            ...item,
            printerType: selectedValue,
          })),
        );
      } catch (err) {
        console.warn(err);
      } finally {
        setLoading(false);
      }
    });
  };

  React.useEffect(() => {
    setLoading(true);
    getListDevices().then();
  }, [selectedValue]);

  const handleConnectSelectedPrinter = async () => {
    // setLoading(true);
    const connect = async () => {
      try {
        switch (
          selectedValue === DevicesEnum.net
            ? selectedNetPrinter.printerType
            : selectedPrinter.printerType
          ) {
          case 'ble':
            if (selectedPrinter?.inner_mac_address) {
              await BLEPrinter.connectPrinter(
                selectedPrinter?.inner_mac_address || '',
              );
            }
            break;
          case 'net':
            if (!selectedNetPrinter) {
              break;
            }
            try {
              // if (connected) {
              // await NetPrinter.closeConn();
              // setConnected(!connected);
              // }
              const status = await NetPrinter.connectPrinter(selectedNetPrinter?.host || '', 9100);
              setLoading(false);
              console.log('connect -> status', status);
              Alert.alert(
                'Connect successfully!',
                `Connected to ${status.device_name ?? 'Printers'} !`,
              );
              // setConnected(true);
            } catch (err) {
              Alert.alert('Connect failed!', `${err} !`);
              console.log(err);
            }
            break;
          case 'usb':
            if (selectedPrinter?.vendor_id) {
              await USBPrinter.connectPrinter(
                selectedPrinter?.vendor_id || '',
                selectedPrinter?.product_id || '',
              );
            }
            break;
          default:
        }
      } catch (err) {
        console.warn(err);
      } finally {
        setLoading(false);
      }
    };
    await connect();
  };

  const handlePrint = async () => {
    try {
      const Printer = printerList[selectedValue];
      Printer.printText('<C>sample text</C>', {
        cut: false
      });
      Printer.printImage('https://sportshub.cbsistatic.com/i/2021/04/09/9df74632-fde2-421e-bc6f-d4bf631bf8e5/one-piece-trafalgar-law-wano-anime-1246430.jpg');
      Printer.printBill('<C>sample text</C>');
    } catch (err) {
      console.warn(err);
    }
  };

  const handlePrintBill = async () => {
    let address = "2700 S123 Grand Ave, Los Angeles, CA 90007223, USA."
    const BOLD_ON = COMMANDS.TEXT_FORMAT.TXT_BOLD_ON;
    const BOLD_OFF = COMMANDS.TEXT_FORMAT.TXT_BOLD_OFF;
    const CENTER = COMMANDS.TEXT_FORMAT.TXT_ALIGN_CT;
    const OFF_CENTER = COMMANDS.TEXT_FORMAT.TXT_ALIGN_LT;
    try {
      const getDataURL = () => {
        (QrRef as any).toDataURL(callback);
      };
      const callback = async (dataURL: string) => {
        let qrProcessed = dataURL.replace(/(\r\n|\n|\r)/gm, "");
        // Can print android and ios with the same type or with encoder for android
        if (Platform.OS === 'android' || Platform.OS === 'ios') {
          const Printer: typeof NetPrinter = printerList[selectedValue];
          Printer.printImage(`https://sportshub.cbsistatic.com/i/2021/04/09/9df74632-fde2-421e-bc6f-d4bf631bf8e5/one-piece-trafalgar-law-wano-anime-1246430.jpg`);
          Printer.printText(`${CENTER}${BOLD_ON} BILLING ${BOLD_OFF}\n`);
          Printer.printText(`${CENTER}${address}${OFF_CENTER}`);
          Printer.printText('090 3399 031 555\n');
          Printer.printText(`Date : 15- 09 - 2021 /15 : 29 : 57 / Admin`);
          Printer.printText(`Product : Total - 4 / No. (1,2,3,4)\n`);
          Printer.printText(`${CENTER}${COMMANDS.HORIZONTAL_LINE.HR_80MM}${CENTER}\n`);
          let orderList = [
            ["1. Skirt Palas Labuh Muslimah Fashion", "x2", "500$"],
            ["2. BLOUSE ROPOL VIRAL MUSLIMAH FASHION", "x4222", "500$"],
            ["3. Women Crew Neck Button Down Ruffle Collar Loose Blouse", "x1", "30000000000000$"],
            ["4. Retro Buttons Up Full Sleeve Loose", "x10", "200$"],
            ["5. Retro Buttons Up", "x10", "200$"],
          ];
          let columnAliment = [ColumnAliment.LEFT, ColumnAliment.CENTER, ColumnAliment.RIGHT];
          let columnWidth = [46 - (7 + 12), 7, 12]
          const header = ['Product list', 'Qty', 'Price']
          Printer.printColumnsText(header, columnWidth, columnAliment, [`${BOLD_ON}`, '', '']);
          Printer.printText(`\n${CENTER}${COMMANDS.HORIZONTAL_LINE.HR3_80MM}${CENTER}\n`);
          for (let i in orderList) {
            Printer.printColumnsText(orderList[i], columnWidth, columnAliment, [`${BOLD_OFF}`, '', '']);
          }
          Printer.printText(`\n\n`);
          Printer.printQrCode(qrProcessed, {
            // ios
            imageWidth: 100
          })
          Printer.printBill(`${CENTER}Thank you\n`, {beep: false});
        } else {
          // optional for android
          // android
          const Printer = printerList[selectedValue];
          const encoder = new EscPosEncoder();
          let _encoder = encoder
            .initialize()
            .align('center')
            .line('BILLING')
            .qrcode('https://nielsleenheer.com')
            .encode()
          let base64String = Buffer.from(_encoder).toString('base64');
          Printer.printRaw(base64String);
        }
      }
      getDataURL();
    } catch (err) {
      console.warn(err);
    }
  };

  const gotoSunmi = async () => {
    if (Platform.OS === 'ios') {
      Alert.alert('this feature just support for sunmi devices');
    } else {
      navigate('Sunmi');
    }
  };

  const handleChangePrinterType = async (type: keyof typeof printerList) => {
    setSelectedValue(prev => {
      printerList[prev].closeConn();
      return type;
    });
    setSelectedPrinter({});
  };

  const findPrinter = () => {
    navigate('Find');
  };

  const onChangeText = (text: string) => {
    setSelectedNetPrinter({...selectedNetPrinter, host: text});
  };

  const _renderNet = () => (
    <>
      <Text style={[styles.text, {color: 'black', marginLeft: 0}]} >Your printer ip....</Text >
      <TextInput
        style={{
          borderBottomWidth: 1,
          height: 45
        }}
        placeholder={'Your printer port...'}
        value={selectedNetPrinter?.host}
        onChangeText={onChangeText}
      />
      <View
        style={{
          marginTop: 10,
        }} >
        <TouchableOpacity
          style={[styles.button, {backgroundColor: 'grey', height: 30}]}
          // disabled={!selectedPrinter?.device_name}
          onPress={findPrinter} >
          <AntIcon name={'search1'} color={'white'} size={18} />
          <Text style={styles.text} >Find your printers</Text >
        </TouchableOpacity >
      </View >
    </>
  );

  const _renderOther = () => (
    <>
      <Text >Select printer: </Text >
      <Picker
        selectedValue={selectedPrinter}
        onValueChange={setSelectedPrinter} >
        {devices !== undefined &&
        devices?.length > 0 &&
        devices?.map((item: any, index) => (
          <Picker.Item
            label={item.device_name}
            value={item}
            key={`printer-item-${index}`}
          />
        ))}
      </Picker >
    </>
  );

  return (
    <View style={styles.container} >
      {/* Printers option */}
      <View style={styles.section} >
        <Text style={styles.title} >Select printer type: </Text >
        <Picker
          selectedValue={selectedValue}
          mode="dropdown"
          onValueChange={handleChangePrinterType} >
          {Object.keys(printerList).map((item, index) => (
            <Picker.Item
              label={item.toUpperCase()}
              value={item}
              key={`printer-type-item-${index}`}
            />
          ))}
        </Picker >
      </View >
      {/* Printers List */}
      <View style={styles.section} >
        {selectedValue === 'net' ? _renderNet() : _renderOther()}
        {/* Buttons */}
        <View
          style={[
            styles.buttonContainer,
            {
              marginTop: 50,
            },
          ]} >
          <TouchableOpacity
            style={styles.button}
            // disabled={!selectedPrinter?.device_name}
            onPress={handleConnectSelectedPrinter} >
            <AntIcon name={'disconnect'} color={'white'} size={18} />
            <Text style={styles.text} >Connect</Text >
          </TouchableOpacity >
        </View >
        <View style={styles.buttonContainer} >
          <TouchableOpacity
            style={[styles.button, {backgroundColor: 'blue'}]}
            // disabled={!selectedPrinter?.device_name}
            onPress={handlePrint} >
            <AntIcon name={'printer'} color={'white'} size={18} />
            <Text style={styles.text} >Print sample</Text >
          </TouchableOpacity >
        </View >
        <View style={styles.buttonContainer} >
          <TouchableOpacity
            style={[styles.button, {backgroundColor: 'blue'}]}
            // disabled={!selectedPrinter?.device_name}
            onPress={handlePrintBill} >
            <AntIcon name={'profile'} color={'white'} size={18} />
            <Text style={styles.text} >Print bill</Text >
          </TouchableOpacity >
        </View >
        <View style={styles.buttonContainer} >
          <TouchableOpacity
            style={[styles.button, {backgroundColor: 'blue'}]}
            // disabled={!selectedPrinter?.device_name}
            onPress={gotoSunmi} >
            <AntIcon name={'printer'} color={'white'} size={18} />
            <Text style={styles.text} >Sunmi print</Text >
          </TouchableOpacity >
        </View >
        <View style={styles.qr} >
          <QRCode value="hey" getRef={(el: any) => (QrRef = el)} />
        </View >
      </View >
      <Loading loading={loading} />
    </View >
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  section: {},
  rowDirection: {
    flexDirection: 'row',
  },
  buttonContainer: {
    marginTop: 10,
  },
  button: {
    flexDirection: 'row',
    height: 40,
    width: deviceWidth / 1.5,
    alignSelf: 'center',
    backgroundColor: 'green',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 5,
  },
  text: {
    color: 'white',
    fontSize: 17,
    fontWeight: 'bold',
    marginLeft: 5,
  },
  title: {
    color: 'black',
    fontSize: 15,
    fontWeight: 'bold',
    marginLeft: 5,
  },
  qr: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20
  }
});
