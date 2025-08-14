// App.tsx
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import React from 'react';
import 'react-native-gesture-handler';
import MorningStock from './app/MorningStockScreen';
import LoginScreen from './screens/LoginScreen';

// 1. Define exact route names
export type RootStackParamList = {
  LoginScreen: undefined;
  MorningStock: undefined; // Must match EXACTLY
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator
        initialRouteName="LoginScreen"
        screenOptions={{ headerShown: false }}
      >
        <Stack.Screen 
          name="LoginScreen" // Must match EXACTLY
          component={LoginScreen} 
        />
        <Stack.Screen 
          name="MorningStock" // Must match EXACTLY
          component={MorningStock}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}