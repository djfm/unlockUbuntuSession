import React, {
  useEffect,
  useState,
} from 'react';

import {
  ActivityIndicator,
  Button,
  View,
  Text,
} from 'react-native';

import AsyncStorage from '@react-native-async-storage/async-storage';

import { BarCodeReadEvent } from 'react-native-camera';
import QRCodeScanner from 'react-native-qrcode-scanner';

type UnlockKey = {
  hostname: string
  serverURL: string
  secret: string
}

const baseSpacing = 10;
const baseFontSize = 20;

const Colors = {
  primary: '#1292B4',
  white: '#FFF',
  lighter: '#F3F3F3',
  light: '#DAE1E7',
  dark: '#444',
  darker: '#222',
  black: '#000',
};

const getUnlockKey = async (): Promise<UnlockKey | undefined> => {
  const jsonKey = await AsyncStorage.getItem('unlockKey');
  if (jsonKey) {
    return JSON.parse(jsonKey);
  }
  return undefined;
};

const forgetUnlockKey = async (): Promise<void> =>
  AsyncStorage.removeItem('unlockKey');

type UIWithUnlockKeyProps = {
  unlockKey: UnlockKey
  unPair: () => void
}
const UIWithUnlockKey = ({
  unlockKey,
  unPair,
}: UIWithUnlockKeyProps) => {
  const [isLocked, setIsLocked] = useState<boolean | undefined>(undefined);
  const [isWaiting, setIsWaiting] = useState(false);

  const handleUnPairPressed = async () => {
    setIsWaiting(true);
    try {
      await forgetUnlockKey();
      setIsWaiting(false);
      unPair();
    } catch (e) {
      console.log(e);
      setIsWaiting(false);
    }
  };

  const handleUnlockPressed = async () => {
    setIsWaiting(true);
    try {
      const resp = await fetch(`${unlockKey.serverURL}/unlock`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          secret: unlockKey.secret,
        }),
      });

      if (resp.ok) {
        const status = await resp.json();
        if (!status.ok) {
          throw new Error('Seems like the operation failed.');
        }
        setIsLocked(false);
      } else {
        throw new Error(`Invalid response with status: ${resp.status}.`);
      }
    } catch (e) {
      console.log(e);
    } finally {
      setIsWaiting(false);
    }
  };

  const handleLockPressed = async () => {
    setIsWaiting(true);
    try {
      const resp = await fetch(`${unlockKey.serverURL}/lock`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          secret: unlockKey.secret,
        }),
      });

      setIsWaiting(false);

      if (resp.ok) {
        const status = await resp.json();
        if (!status.ok) {
          throw new Error('Seems like the operation failed.');
        }
        setIsLocked(true);
      } else {
        throw new Error(`Invalid response with status: ${resp.status}.`);
      }
    } catch (e) {
      console.log(e);
    } finally {
      setIsWaiting(false);
    }
  };

  const markup = (
    <View
      style={{
        flex: 1,
      }}
    >
      {isWaiting && (
        <ActivityIndicator
          size="large"
          color={Colors.primary}

        />
      )}
      <View
        style={{
          flex: 1,
          justifyContent: 'space-evenly',
          alignItems: 'center',
          backgroundColor: Colors.white,
        }}
      >
        <Text
          style={{
            fontSize: baseFontSize,
            padding: 2 * baseSpacing,
            textAlign: 'center',
          }}
        >
          Unlock Ubuntu Sessions seems to be Properly Configured.
        </Text>

        <View
          style={{
            flex: 0,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-evenly',
          }}
        >
          <Text
            style={{
              fontSize: baseFontSize,
              padding: baseSpacing,
            }}
          >
            paired with
            &quot;
            {unlockKey.hostname}
            &quot;
            {'\n'}
            @&nbsp;
            {unlockKey.serverURL}
          </Text>
          <Button
            title="Un-pair"
            onPress={handleUnPairPressed}
            disabled={isWaiting}
          >
            Un-pair
          </Button>
        </View>
        <View>
          <View
            style={{
              marginTop: 2 * baseSpacing,
              marginBottom: 2 * baseSpacing,
            }}
          >
            {(isLocked === true || isLocked === undefined) && (
              <Button
                title="Unlock Session"
                onPress={handleUnlockPressed}
                disabled={isWaiting}
              >
                Unlock Session
              </Button>
            )}
          </View>

          {(isLocked === false || isLocked === undefined) && (
            <Button
              title="Lock Session"
              onPress={handleLockPressed}
              disabled={isWaiting}
            >
              Lock Session
            </Button>
          )}
        </View>
      </View>
    </View>
  );

  return markup;
};

type UIWithoutUnlockKeyProps = {
  setQRCode: (code: string) => unknown
}
const UIWithoutUnlockKey = (
  props: UIWithoutUnlockKeyProps,
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

const App: React.FC = () => {
  const [unlockKey, setUnlockKey] = useState<UnlockKey>();

  const setQRCode = async (code: string) => {
    const key = JSON.parse(code);
    setUnlockKey(key);
  };

  useEffect(() => {
    (async () => {
      const key = await getUnlockKey();
      if (key !== undefined) {
        setUnlockKey(key);
      }
    })();
  });

  const markup = unlockKey === undefined
    ? <UIWithoutUnlockKey setQRCode={setQRCode} />
    : (
      <UIWithUnlockKey
        unlockKey={unlockKey}
        unPair={() => setUnlockKey(undefined)}
      />
    );

  return markup;
};

export default App;
