import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import React from 'react';
import LoginScreen from '../screens/LoginScreen';
import MorningStockScreen from './MorningStockScreen';

export type RootStackParamList = {
  LoginScreen: undefined;
  MorningStock: { workerId: string };
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function AppNavigator() {
  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="LoginScreen" screenOptions={{ headerShown: false }}>
        <Stack.Screen name="LoginScreen" component={LoginScreen} />
        <Stack.Screen name="MorningStock" component={MorningStockScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

