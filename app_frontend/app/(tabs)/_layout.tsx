import type { ReactNode } from 'react';
import { StyleSheet, View, type ColorValue } from 'react-native';
import { Tabs } from 'expo-router';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';

import { colors } from '@/theme/colors';

type IconProps = { focused: boolean; color: ColorValue; size: number };

// Barra ativa acima do ícone, como no mockup
function withIndicator(render: (props: IconProps) => ReactNode) {
  return function TabIcon(props: IconProps) {
    return (
      <View style={styles.iconWrapper}>
        <View style={[styles.indicator, props.focused && styles.indicatorActive]} />
        {render(props)}
      </View>
    );
  };
}

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: styles.tabBar,
        tabBarActiveTintColor: colors.text,
        tabBarInactiveTintColor: colors.muted,
        tabBarLabelStyle: styles.label,
        sceneStyle: { backgroundColor: colors.background },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: withIndicator(({ color, size }) => (
            <Feather name="home" size={size} color={color} />
          )),
        }}
      />
      <Tabs.Screen
        name="estudo"
        options={{
          title: 'Estudo',
          tabBarIcon: withIndicator(({ color, size }) => (
            <Feather name="book-open" size={size} color={color} />
          )),
        }}
      />
      <Tabs.Screen
        name="habitos"
        options={{
          title: 'Hábitos',
          tabBarIcon: withIndicator(({ color, size }) => (
            <Feather name="check-circle" size={size} color={color} />
          )),
        }}
      />
      <Tabs.Screen
        name="treino"
        options={{
          title: 'Treino',
          tabBarIcon: withIndicator(({ color, size }) => (
            <MaterialCommunityIcons name="dumbbell" size={size} color={color} />
          )),
        }}
      />
      <Tabs.Screen
        name="financas"
        options={{
          title: 'Finanças',
          tabBarIcon: withIndicator(({ color, size }) => (
            <MaterialCommunityIcons name="wallet-outline" size={size} color={color} />
          )),
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: colors.tabBar,
    borderTopColor: colors.border,
    borderTopWidth: StyleSheet.hairlineWidth,
    height: 72,
    paddingTop: 6,
  },
  label: {
    fontSize: 11,
    fontWeight: '500',
  },
  iconWrapper: {
    alignItems: 'center',
    gap: 6,
  },
  indicator: {
    width: 24,
    height: 2,
    borderRadius: 1,
    backgroundColor: 'transparent',
  },
  indicatorActive: {
    backgroundColor: colors.text,
  },
});
