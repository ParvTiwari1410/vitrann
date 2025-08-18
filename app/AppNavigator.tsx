import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import React from 'react';
import LoginScreen from '../screens/LoginScreen';
import CustomerDeliveryScreen from './CustomerDeliveryScreen';
import MorningStockScreen from './MorningStockScreen';

// 👇 Define all route params here
export type RootStackParamList = {
  LoginScreen: undefined;
  MorningStock: { workerId: string };
  CustomerDelivery: { workerId: string; products: Record<string, number> };
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function AppNavigator() {
  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="LoginScreen" screenOptions={{ headerShown: false }}>
        <Stack.Screen name="LoginScreen" component={LoginScreen} />
        <Stack.Screen name="MorningStock" component={MorningStockScreen} />
        <Stack.Screen name="CustomerDelivery" component={CustomerDeliveryScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
