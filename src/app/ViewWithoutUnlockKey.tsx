import React, {
  useState,
} from 'react';

import {
  Button,
  View,
  Text,
} from 'react-native';

import { BarCodeReadEvent } from 'react-native-camera';
import QRCodeScanner from 'react-native-qrcode-scanner';

import {
  baseFontSize,
  baseSpacing,
  Colors,
} from './common';

type ViewWithoutUnlockKeyProps = {
  setQRCode: (code: string) => unknown;
};

export const ViewWithoutUnlockKey: React.FC<ViewWithoutUnlockKeyProps> = (
  props,
) => {
  const [isScanning, setIsScanning] = useState(false);

  const handleQRCodeRead = (code: BarCodeReadEvent) => {
    props.setQRCode(code.data);
    setIsScanning(false);
  };

  const handleStartScanning = () => {
    setIsScanning(true);
  };

  const handleAbortScanning = () => {
    setIsScanning(false);
  };

  const isScanningMarkup = (
    <View
      style={{
        width: '100%',
        height: '100%',
        alignItems: 'center',
        backgroundColor: Colors.white,
      }}
    >
      <Text
        style={{
          fontSize: baseFontSize,
          padding: baseSpacing,
        }}
      >
        Now please scan the QR code on your computer.
      </Text>
      <QRCodeScanner
        onRead={handleQRCodeRead}
        topContent={<Text>Please scan the QR code on the computer.</Text>}
        cameraStyle={{
          height: '100%',
          width: '100%',
        }}
        containerStyle={{
          width: '100%',
          height: '100%',
        }}
      />
      <View
        style={{
          padding: baseSpacing,
        }}
      >
        <Button
          title="Cancel, I give up."
          onPress={handleAbortScanning}
        />
      </View>
    </View>
  );

  const isNotScanningMarkup = (
    <View
      style={{
        flex: 1,
        flexDirection: 'column',
        justifyContent: 'space-evenly',
        alignItems: 'center',
        padding: baseSpacing,
        backgroundColor: Colors.white,
      }}
    >
      <Text
        style={{
          fontSize: baseFontSize,
          marginBottom: baseSpacing * 2,
        }}
      >
        It seems you need to pair the app with a computer running Ubuntu.
      </Text>

      <Text
        style={{
          fontSize: baseFontSize,
          marginBottom: baseSpacing * 2,
        }}
      >
        You can pair it by scanning the QR code on the server.
      </Text>

      <Button onPress={handleStartScanning} title="Start Scanning">
        Start Scanning for the QR code
      </Button>
    </View>
  );

  const markup = isScanning
    ? isScanningMarkup
    : isNotScanningMarkup;

  return markup;
};

export default ViewWithoutUnlockKey;
