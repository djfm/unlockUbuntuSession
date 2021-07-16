import React, {
  useEffect,
  useState,
} from 'react';

import {
  Button,
  View,
  Text,
} from 'react-native';

import {
  Colors,
} from 'react-native/Libraries/NewAppScreen';

import AsyncStorage from '@react-native-async-storage/async-storage';

import QRCodeScanner from 'react-native-qrcode-scanner';

type UnlockKey = {
  serverURL: string
  secretKey: string
}

const defaultPadding = 10;
const defaultFontSize = 20;

const getUnlockKey = async (): Promise<UnlockKey | undefined> => {
  const jsonKey = await AsyncStorage.getItem('unlockKey');
  if (jsonKey) {
    return JSON.parse(jsonKey);
  }
  return undefined;
};

type UIWithUnlockKeyProps = {
  unlockKey: UnlockKey
}
const UIWithUnlockKey = ({ unlockKey }: UIWithUnlockKeyProps) => {
  const handleUnlockPressed = () => {

  };

  const handleLockPressed = () => {

  }

  const markup = (
    <View
      style={{
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
      }}
    >
      <Text>Universal React with Expo lol</Text>
      <Button
        title="Unlock Screen"
        onPress={handleUnlockPressed}
      >
        Unlock Screen
      </Button>
      <Button
        title="Lock Screen"
        onPress={handleLockPressed}
      >
        Lock Screen
      </Button>
    </View>
  );

  return markup;
};

const UIWithoutUnlockKey = () => {
  const [isScanning, setIsScanning] = useState(false);

  const handleQRCodeRead = (code) => {
    console.log({ code });
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
          fontSize: defaultFontSize,
          padding: defaultPadding,
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
          padding: defaultPadding,
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
        justifyContent: 'center',
        alignItems: 'center',
        padding: defaultPadding,
        backgroundColor: Colors.white,
      }}
    >
      <Text
        style={{
          fontSize: defaultFontSize,
          marginBottom: defaultPadding * 2,
        }}
      >
        It seems you need to pair the app with a computer running Ubuntu.
      </Text>

      <Text
        style={{
          fontSize: defaultFontSize,
          marginBottom: defaultPadding * 2,
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

const App: React.FC = () => {
  const [unlockKey, setUnlockKey] = useState<UnlockKey>();

  useEffect(() => {
    (async () => {
      const key = await getUnlockKey();
      if (key !== undefined) {
        setUnlockKey(key);
      }
    })();
  });

  const markup = unlockKey === undefined
    ? <UIWithoutUnlockKey />
    : <UIWithUnlockKey unlockKey={unlockKey} />;

  return markup;
};

export default App;
