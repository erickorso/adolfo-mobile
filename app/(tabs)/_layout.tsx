import { Tabs } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import type { ComponentProps } from "react";

type IonName = ComponentProps<typeof Ionicons>["name"];

function TabIcon({
  name,
  color,
  size,
}: {
  name: IonName;
  color: string;
  size: number;
}) {
  return <Ionicons name={name} size={size} color={color} />;
}

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerStyle: { backgroundColor: "#0f172a" },
        headerTintColor: "#f8fafc",
        headerTitleStyle: { fontWeight: "600" },
        tabBarActiveTintColor: "#0f172a",
        tabBarInactiveTintColor: "#94a3b8",
        tabBarStyle: {
          backgroundColor: "#ffffff",
          borderTopColor: "#e2e8f0",
        },
      }}
    >
      <Tabs.Screen
        name="jobs"
        options={{
          title: "Jobs",
          headerTitle: "Jobs",
          tabBarIcon: ({ color, size }) => (
            <TabIcon name="briefcase-outline" color={color} size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name="courses"
        options={{
          title: "Courses",
          headerTitle: "Courses",
          tabBarIcon: ({ color, size }) => (
            <TabIcon name="school-outline" color={color} size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name="coach"
        options={{
          title: "Coach",
          headerTitle: "Career Coach",
          tabBarIcon: ({ color, size }) => (
            <TabIcon name="chatbubbles-outline" color={color} size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name="scope"
        options={{
          title: "Scope",
          headerTitle: "Search scope",
          tabBarIcon: ({ color, size }) => (
            <TabIcon name="options-outline" color={color} size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name="auth"
        options={{
          title: "Auth",
          headerTitle: "Auth",
          tabBarIcon: ({ color, size }) => (
            <TabIcon name="person-circle-outline" color={color} size={size} />
          ),
        }}
      />
    </Tabs>
  );
}
