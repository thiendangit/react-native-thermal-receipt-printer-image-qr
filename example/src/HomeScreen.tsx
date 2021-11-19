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
} from 'react-native-thermal-receipt-printer';
import Loading from '../Loading';
import {DeviceType} from './FindPrinter';
import {navigate} from './App';
import AntIcon from 'react-native-vector-icons/AntDesign';
import ThermalPrinterModule from './ThermalPrinterModule';

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
// const deviceHeight = Dimensions.get('window').height;

export const HomeScreen = ({route}: any) => {
  // ThermalPrinterModule.defaultConfig = {
  //   ...ThermalPrinterModule.defaultConfig,
  //   ip: '192.168.0.200',
  //   port: 9100,
  // };

  const [selectedValue, setSelectedValue] = React.useState<
    keyof typeof printerList
  >(DevicesEnum.net);
  const [devices, setDevices] = React.useState([]);
  const [connected, setConnected] = React.useState(false);
  const [loading, setLoading] = React.useState<boolean>(false);
  const [selectedPrinter, setSelectedPrinter] = React.useState<SelectedPrinter>(
    {},
  );
  const [selectedNetPrinter, setSelectedNetPrinter] =
    React.useState<DeviceType>({
      device_name: 'My Net Printer',
      host: '192.168.0.200', // your host
      port: PORT, // your port
      printerType: DevicesEnum.net,
    });

  React.useEffect(() => {
    // console.log(route.params?.printer);
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

  const handlePort = (port?: string): string => {
    return ((Platform.OS === 'ios' ? 9100 : parseInt(port || '9100', 10)) ||
      '9100') as string;
  };

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
              const status = await NetPrinter.connectPrinter(
                selectedNetPrinter?.host || '',
                handlePort(selectedNetPrinter?.port),
              );
              setLoading(false);
              console.log('connect -> status', status);
              Alert.alert(
                'Connect successfully!',
                `Connected to ${status.device_name} !`,
              );
              setConnected(true);
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
    // requestAnimationFrame(async () => {
    await connect();
    // });
  };

  const handlePrint = async () => {
    try {
      const Printer = printerList[selectedValue];
      Printer.printText('<C>sample text</C>');
      Printer.printText('<C>sample text</C>');
    } catch (err) {
      console.warn(err);
    }
  };

  const handlePrintBill = async () => {
    try {
      const Printer = printerList[selectedValue];
      await Printer.printQrCode(
        'https://cdn.base64decode.org/assets/images/b64-fb.png',
        {cut: false},
      );
      Printer.printText('<C>sample text</C>');
      console.log(Printer);
    } catch (err) {
      console.warn(err);
    }
  };

  const gotoSunmi = async () => {
    navigate('Sunmi');
  };

  const thermalPrinter = async () => {
    try {
      await ThermalPrinterModule.printUsb({
        // ip: '192.168.0.200',
        // port: 9100,
        payload: 'hello world',
        printerWidthMM: 50,
      });
    } catch (err) {
      //error handling
      alert(JSON.stringify(err.message));
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
      <TextInput
        style={{
          borderBottomWidth: 1,
        }}
        placeholder={'Your printer port...'}
        value={selectedNetPrinter?.host}
        onChangeText={onChangeText}
      />
      <View
        style={{
          marginTop: 10,
        }}>
        <TouchableOpacity
          style={[styles.button, {backgroundColor: 'grey', height: 30}]}
          // disabled={!selectedPrinter?.device_name}
          onPress={findPrinter}>
          <AntIcon name={'search1'} color={'white'} size={18} />
          <Text style={styles.text}>Find your printers</Text>
        </TouchableOpacity>
      </View>
    </>
  );

  const _renderOther = () => (
    <>
      <Text>Select printer: </Text>
      <Picker
        selectedValue={selectedPrinter}
        onValueChange={setSelectedPrinter}>
        {devices !== undefined &&
          devices?.length > 0 &&
          devices?.map((item: any, index) => (
            <Picker.Item
              label={item.device_name}
              value={item}
              key={`printer-item-${index}`}
            />
          ))}
      </Picker>
    </>
  );

  return (
    <View style={styles.container}>
      {/* Printers option */}
      <View style={styles.section}>
        <Text style={styles.title}>Select printer type: </Text>
        <Picker
          selectedValue={selectedValue}
          mode="dropdown"
          onValueChange={handleChangePrinterType}>
          {Object.keys(printerList).map((item, index) => (
            <Picker.Item
              label={item.toUpperCase()}
              value={item}
              key={`printer-type-item-${index}`}
            />
          ))}
        </Picker>
      </View>
      {/* Printers List */}
      <View style={styles.section}>
        {selectedValue === 'net' ? _renderNet() : _renderOther()}
        {/* Buttons  */}
        <View
          style={[
            styles.buttonContainer,
            {
              marginTop: 50,
            },
          ]}>
          <TouchableOpacity
            style={styles.button}
            // disabled={!selectedPrinter?.device_name}
            onPress={handleConnectSelectedPrinter}>
            <AntIcon name={'disconnect'} color={'white'} size={18} />
            <Text style={styles.text}>Connect</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={[styles.button, {backgroundColor: 'blue'}]}
            // disabled={!selectedPrinter?.device_name}
            onPress={handlePrint}>
            <AntIcon name={'printer'} color={'white'} size={18} />
            <Text style={styles.text}>Print sample</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={[styles.button, {backgroundColor: 'blue'}]}
            // disabled={!selectedPrinter?.device_name}
            onPress={handlePrintBill}>
            <AntIcon name={'profile'} color={'white'} size={18} />
            <Text style={styles.text}>Print bill</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={[styles.button, {backgroundColor: 'blue'}]}
            // disabled={!selectedPrinter?.device_name}
            onPress={gotoSunmi}>
            <AntIcon name={'printer'} color={'white'} size={18} />
            <Text style={styles.text}>Sunmi print</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.buttonContainer}>
          {/*<TouchableOpacity*/}
          {/*  style={[styles.button, {backgroundColor: 'blue'}]}*/}
          {/*  // disabled={!selectedPrinter?.device_name}*/}
          {/*  onPress={thermalPrinter}>*/}
          {/*  <AntIcon name={'printer'} color={'white'} size={18} />*/}
          {/*  <Text style={styles.text}>Thermal Module print</Text>*/}
          {/*</TouchableOpacity>*/}
        </View>
      </View>
      <Loading loading={loading} />
    </View>
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
    fontSize: 15,
    fontWeight: 'bold',
    marginLeft: 5,
  },
  title: {
    color: 'black',
    fontSize: 15,
    fontWeight: 'bold',
    marginLeft: 5,
  },
});
