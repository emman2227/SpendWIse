import { Tabs } from 'expo-router';
import { Text } from 'react-native';

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: '#0F766E',
        tabBarInactiveTintColor: '#64748B',
        tabBarStyle: {
          backgroundColor: '#FFFFFF',
          borderTopColor: '#E2E8F0',
          height: 60,
          paddingBottom: 8,
          paddingTop: 8,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '600',
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Dashboard',
          tabBarIcon: ({ color }) => <Text style={{ color, fontSize: 16 }}>📊</Text>,
        }}
      />
      <Tabs.Screen
        name="expenses"
        options={{
          title: 'Expenses',
          tabBarIcon: ({ color }) => <Text style={{ color, fontSize: 16 }}>💳</Text>,
        }}
      />
      <Tabs.Screen
        name="budgets"
        options={{
          title: 'Budgets',
          tabBarIcon: ({ color }) => <Text style={{ color, fontSize: 16 }}>🎯</Text>,
        }}
      />
      <Tabs.Screen
        name="analytics"
        options={{
          title: 'Insights',
          tabBarIcon: ({ color }) => <Text style={{ color, fontSize: 16 }}>✨</Text>,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color }) => <Text style={{ color, fontSize: 16 }}>👤</Text>,
        }}
      />
    </Tabs>
  );
}
