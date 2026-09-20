import {
  useEffect,
  useState,
} from 'react';

import NetInfo from '@react-native-community/netinfo';

export const useNetworkStatus = () => {
    
  const [isOnline, setIsOnline] =
    useState<boolean | null>(null);

  useEffect(() => {
    const unsubscribe =
      NetInfo.addEventListener(
        state => {
          const online =
            state.isConnected === true &&
            state.isInternetReachable !==
              false;

          setIsOnline(online);
        },
      );

    return unsubscribe;
  }, []);

  return isOnline;
};