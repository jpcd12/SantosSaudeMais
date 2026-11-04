import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAppTheme } from '@/contexts/ThemeContext';

export default function AppTabs() {
  const { theme } = useAppTheme();
  return (
    <Tabs screenOptions={{ headerStyle: { backgroundColor: theme.headerBg }, headerTintColor: theme.text, tabBarActiveTintColor: theme.primary, tabBarStyle: { backgroundColor: theme.card, borderTopColor: theme.border } }}>
      <Tabs.Screen name="index" options={{ title: 'Home', tabBarIcon: ({ color, size }) => <Ionicons name="home-outline" color={color} size={size} /> }} />
      <Tabs.Screen name="explore" options={{ title: 'Explore', tabBarIcon: ({ color, size }) => <Ionicons name="compass-outline" color={color} size={size} /> }} />
    </Tabs>
  );
}
