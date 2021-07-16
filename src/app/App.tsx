import React, {
  useEffect,
  useState,
} from 'react';

import {
  Button,
  View,
  Text,
} from 'react-native';

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
  const onQRCodeRead = (code) => {
    console.log({ code });
  }

  const markup = (
    <View
      style={{
        flex: 1,
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'flex-start',
        padding: defaultPadding,
      }}
    >
      <Text
        style={{
          fontSize: defaultFontSize,
        }}
      >
        It seems you need to pair the app with a computer running Ubuntu.
      </Text>
      <QRCodeScanner
        onRead={onQRCodeRead}
        topContent={<Text>Please scan the QR code on the computer.</Text>}
      />
    </View>
  );

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
