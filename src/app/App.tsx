import React, {
  useEffect,
  useState,
} from 'react';

import {
  View,
  Text,
} from 'react-native';

import AsyncStorage from '@react-native-async-storage/async-storage';

import ViewWithUnlockKey from './ViewWithUnlockKey';
import ViewWithoutUnlockKey from './ViewWithoutUnlockKey';

import {
  baseFontSize,
  baseSpacing,
  Colors,
  UnlockKey,
} from './common';

const getUnlockKey = async (): Promise<UnlockKey | undefined> => {
  const jsonKey = await AsyncStorage.getItem('unlockKey');
  if (jsonKey) {
    return JSON.parse(jsonKey);
  }
  return undefined;
};

const App: React.FC = () => {
  const [unlockKey, setUnlockKey] = useState<UnlockKey>();

  const setQRCode = async (code: string) => {
    const key = JSON.parse(code);
    await AsyncStorage.setItem(
      'unlockKey',
      JSON.stringify(key),
    );
    console.log('stored unlockKey');
    setUnlockKey(key);
  };

  useEffect(() => {
    let applyEffect = true;

    (async () => {
      const key = await getUnlockKey();
      if (key && applyEffect) {
        setUnlockKey(key);
      }
    })();

    return () => {
      applyEffect = false;
    };
  }, [unlockKey]);

  const body = unlockKey === undefined
    ? <ViewWithoutUnlockKey setQRCode={setQRCode} />
    : (
      <ViewWithUnlockKey
        unlockKey={unlockKey}
        unPair={() => setUnlockKey(undefined)}
      />
    );

  return (
    <View
      style={{
        flex: 1,
      }}
    >
      <View>
        <Text
          style={{
            fontSize: 1.5 * baseFontSize,
            color: Colors.white,
            textAlign: 'center',
            marginTop: baseSpacing,
            marginBottom: 2 * baseSpacing,
          }}
        >
          Unlock Ubuntu Session
        </Text>
      </View>
      {body}
    </View>
  );
};

export default App;
