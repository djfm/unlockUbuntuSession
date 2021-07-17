import React, { useState } from 'react';

import {
  ActivityIndicator,
  Button,
  View,
  Text,
} from 'react-native';

import AsyncStorage from '@react-native-async-storage/async-storage';

import {
  baseFontSize,
  baseSpacing,
  Colors,
  UnlockKey,
} from './common';

export type ViewWithUnlockKeyProps = {
  unlockKey: UnlockKey
  unPair: () => void
}

const forgetUnlockKey = async (): Promise<void> =>
  AsyncStorage.removeItem('unlockKey');

// eslint-disable-next-line no-console
const log = (...args: unknown[]) => console.log(...args);

export const ViewWithUnlockKey: React.FC<ViewWithUnlockKeyProps> = ({
  unlockKey,
  unPair,
}) => {
  const [isLocked, setIsLocked] = useState<boolean | undefined>(undefined);
  const [isWaiting, setIsWaiting] = useState(false);

  const handleUnPairPressed = async () => {
    setIsWaiting(true);
    try {
      await forgetUnlockKey();
      setIsWaiting(false);
      unPair();
    } catch (e) {
      log(e);
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
      log(e);
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
      log(e);
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
          The app seems to be Properly Configured!
        </Text>

        <View
          style={{
            flex: 0,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-evenly',
            backgroundColor: Colors.dark,
            alignSelf: 'stretch',
          }}
        >
          <Text
            style={{
              fontSize: baseFontSize,
              padding: baseSpacing,
              color: Colors.light,
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
            disabled={isWaiting || isLocked === true}
          >
            Un-pair
          </Button>
        </View>
        <View
          style={{
            padding: baseSpacing,
            backgroundColor: Colors.lighter,
          }}
        >
          <View
            style={{
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

export default ViewWithUnlockKey;
