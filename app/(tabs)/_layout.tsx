import { Tabs } from "expo-router";

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerStyle: { backgroundColor: "#0f172a" },
        headerTintColor: "#f8fafc",
        tabBarActiveTintColor: "#0f172a",
        tabBarInactiveTintColor: "#64748b",
      }}
    >
      <Tabs.Screen name="jobs" options={{ title: "Jobs", headerTitle: "Jobs" }} />
      <Tabs.Screen
        name="courses"
        options={{ title: "Courses", headerTitle: "Courses" }}
      />
      <Tabs.Screen name="auth" options={{ title: "Auth", headerTitle: "Auth" }} />
    </Tabs>
  );
}
