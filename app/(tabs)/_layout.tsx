import { Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';

import { colors } from '@/theme/tokens';
import { tr } from '@/i18n/tr';

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.primaryDark,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopColor: colors.border,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: tr.tabs.home,
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="home" size={size} color={color as string} />
          ),
        }}
      />
      <Tabs.Screen
        name="journal"
        options={{
          title: tr.tabs.journal,
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="book-outline" size={size} color={color as string} />
          ),
        }}
      />
      <Tabs.Screen
        name="development"
        options={{
          title: tr.tabs.development,
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="leaf-outline" size={size} color={color as string} />
          ),
        }}
      />
      <Tabs.Screen
        name="guide"
        options={{
          title: tr.tabs.guide,
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="compass-outline" size={size} color={color as string} />
          ),
        }}
      />
      <Tabs.Screen
        name="archive"
        options={{
          title: tr.tabs.archive,
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="archive-outline" size={size} color={color as string} />
          ),
        }}
      />
    </Tabs>
  );
}
