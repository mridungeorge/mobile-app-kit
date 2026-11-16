import AsyncStorage from "@react-native-async-storage/async-storage";

const baseURL = "https://api.habitloop.app/v1";
const tokenKey = "habitloop.session";

export async function request(path: string) {
  const token = await AsyncStorage.getItem(tokenKey);
  const response = await fetch(`${baseURL}${path}`, {
    headers: {
      Accept: "application/json",
      Authorization: `Bearer ${token ?? ""}`
    }
  });
  if (!response.ok) throw new Error(`API ${response.status}`);
  return response.json();
}

export const endpoints = {
  habits: "/habits",
  streaks: "/habits/:id/streaks"
};

export const API_URL = process.env.EXPO_PUBLIC_API_URL ?? baseURL;
