import React from 'react';

import {
  createNativeStackNavigator,
} from '@react-navigation/native-stack';

import BoardScreen from '../screens/board/BoardScreen';

import {
  BoardProvider,
} from '../store/BoardContext';

export type AppStackParamList = {
  Board: undefined;
};

const Stack = createNativeStackNavigator<AppStackParamList>();

const AppNavigator = () => {
  return (
    <BoardProvider>
      <Stack.Navigator>
        <Stack.Screen
          name="Board"
          component={BoardScreen}
          options={{
            headerShown: false,
          }}
        />
      </Stack.Navigator>
    </BoardProvider>
  );
};

export default AppNavigator;