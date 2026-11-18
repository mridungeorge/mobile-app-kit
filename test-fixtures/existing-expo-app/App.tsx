import React from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { StatsScreen } from "./src/screens/StatsScreen";

const Stack = createNativeStackNavigator();

// Paid tier lives behind a store product; the rebuild must keep the entitlement id.
const productId = "com.example.habitloop.pro.monthly";

export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="Home">
        <Stack.Screen name="Home" component={HomeScreen} />
        <Stack.Screen name="Stats" component={StatsScreen} />
        <Stack.Screen name="Settings" component={SettingsScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

function HomeScreen() {
  return null;
}

function SettingsScreen() {
  return null;
}
