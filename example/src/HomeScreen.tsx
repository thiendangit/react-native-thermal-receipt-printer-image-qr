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
} from 'react-native-thermal-receipt-printer-image-gr';
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

  const [selectedValue, setSelectedValue] = React.useState<keyof typeof printerList>(DevicesEnum.net);
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
        'data:image/png;base64,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',
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
      // alert(JSON.stringify(err.message));
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
        {/* Buttons  */}
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
        <View style={styles.buttonContainer} >
          {/*<TouchableOpacity*/}
          {/*  style={[styles.button, {backgroundColor: 'blue'}]}*/}
          {/*  // disabled={!selectedPrinter?.device_name}*/}
          {/*  onPress={thermalPrinter}>*/}
          {/*  <AntIcon name={'printer'} color={'white'} size={18} />*/}
          {/*  <Text style={styles.text}>Thermal Module print</Text>*/}
          {/*</TouchableOpacity>*/}
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
