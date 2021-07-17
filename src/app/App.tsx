import React, {
  useEffect,
  useState,
} from 'react';

import AsyncStorage from '@react-native-async-storage/async-storage';

import ViewWithUnlockKey from './ViewWithUnlockKey';
import ViewWithoutUnlockKey from './ViewWithoutUnlockKey';

import {
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
    ? <ViewWithoutUnlockKey setQRCode={setQRCode} />
    : (
      <ViewWithUnlockKey
        unlockKey={unlockKey}
        unPair={() => setUnlockKey(undefined)}
      />
    );

  return markup;
};

export default App;
