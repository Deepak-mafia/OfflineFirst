import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import BusinessScreen from './src/screens/BusinessScreen';
import ArticleScreen from './src/screens/ArticleScreen';

const Stack = createStackNavigator();

export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="Businesses">
        <Stack.Screen name="Businesses" component={BusinessScreen} />
        <Stack.Screen name="Articles" component={ArticleScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
