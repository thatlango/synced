import { Tabs } from 'expo-router';
import { View, Text, StyleSheet } from 'react-native';
import { COLORS, UI } from '../../constants';

function TabIcon({ name, focused }: { name: string; focused: boolean }) {
  const icons: Record<string, string> = {
    index: '⌂',
    transactions: '↔',
    analytics: '▥',
    household: '◎',
    settings: '⚙',
  };
  return (
    <View style={[styles.tabIcon, focused && styles.tabIconActive]}>
      <Text style={[styles.tabIconText, focused && styles.tabIconTextActive]}>
        {icons[name] || '•'}
      </Text>
    </View>
  );
}

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarStyle: {
          backgroundColor: COLORS.surface,
          borderTopColor: COLORS.border,
          borderTopWidth: StyleSheet.hairlineWidth,
          height: 78,
          paddingBottom: 10,
          paddingTop: 7,
        },
        tabBarActiveTintColor: COLORS.primary,
        tabBarInactiveTintColor: COLORS.textMuted,
        tabBarLabelStyle: { fontSize: 11, fontWeight: '600', marginTop: 2 },
        tabBarItemStyle: { paddingVertical: 2 },
        headerStyle: { backgroundColor: COLORS.surface },
        headerTintColor: COLORS.text,
        headerShadowVisible: false,
        headerTitleStyle: { fontWeight: '700', fontSize: 18, color: COLORS.text },
        sceneStyle: { backgroundColor: COLORS.background },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ focused }) => <TabIcon name="index" focused={focused} />,
          headerTitle: () => (
            <View style={styles.headerTitle}>
              <View style={styles.headerMark}>
                <Text style={styles.headerMarkText}>S</Text>
              </View>
              <Text style={styles.headerText}>Synced</Text>
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="transactions"
        options={{
          title: 'Activity',
          tabBarIcon: ({ focused }) => <TabIcon name="transactions" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="analytics"
        options={{
          title: 'Insights',
          tabBarIcon: ({ focused }) => <TabIcon name="analytics" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="household"
        options={{
          title: 'People',
          tabBarIcon: ({ focused }) => <TabIcon name="household" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: 'Settings',
          tabBarIcon: ({ focused }) => <TabIcon name="settings" focused={focused} />,
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  headerTitle: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  headerMark: {
    width: 30,
    height: 30,
    borderRadius: UI.radiusSm,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.primaryLight,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: COLORS.border,
  },
  headerMarkText: { fontSize: 15, fontWeight: '800', color: COLORS.primary },
  headerText: { fontSize: 20, fontWeight: '800', color: COLORS.text, letterSpacing: -0.4 },
  tabIcon: {
    minWidth: 34,
    height: 30,
    paddingHorizontal: 8,
    borderRadius: UI.radiusSm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabIconActive: { backgroundColor: COLORS.primaryLight },
  tabIconText: { fontSize: 20, lineHeight: 22, color: COLORS.textMuted, opacity: 0.8 },
  tabIconTextActive: { color: COLORS.primary, opacity: 1, fontWeight: '700' },
});