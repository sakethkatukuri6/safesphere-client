import React from 'react';
import { Tabs } from 'expo-router';
import { Home, MapPin, ShieldAlert, Users, User } from 'lucide-react-native';
import colors from '../../theme/colors';

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: colors.bottomBarBackground,
          borderTopColor: colors.border,
          borderTopWidth: 1,
          height: 64,
          paddingBottom: 10,
          paddingTop: 8,
        },
        tabBarActiveTintColor: colors.blue,
        tabBarInactiveTintColor: colors.bottomBarInactive,
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '600',
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color, size }) => <Home size={22} color={color} />,
        }}
      />
      <Tabs.Screen
        name="nearby"
        options={{
          title: 'Nearby',
          tabBarIcon: ({ color, size }) => <MapPin size={22} color={color} />,
        }}
      />
      <Tabs.Screen
        name="evidence"
        options={{
          title: 'Evidence',
          tabBarIcon: ({ color, size }) => <ShieldAlert size={22} color={color} />,
        }}
      />
      <Tabs.Screen
        name="circle"
        options={{
          title: 'Circle',
          tabBarIcon: ({ color, size }) => <Users size={22} color={color} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color, size }) => <User size={22} color={color} />,
        }}
      />
    </Tabs>
  );
}
