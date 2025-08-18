import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import React from 'react';
import 'react-native-gesture-handler';
import CustomerDeliveryScreen from './app/CustomerDeliveryScreen';
import MorningStock from './app/MorningStockScreen';
import LoginScreen from './screens/LoginScreen';

export type RootStackParamList = {
  LoginScreen: undefined;
  MorningStock: { workerId: string };
  CustomerDelivery: { workerId: string; products: Record<string, number> };
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator
        initialRouteName="LoginScreen"
        screenOptions={{ headerShown: false }}
      >
        <Stack.Screen name="LoginScreen" component={LoginScreen} />
        <Stack.Screen name="MorningStock" component={MorningStock} />
        <Stack.Screen name="CustomerDelivery" component={CustomerDeliveryScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
