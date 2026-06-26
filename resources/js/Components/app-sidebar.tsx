"use client"

import * as React from "react"
import {
  CheckCircle,
  LayoutDashboard,
  Settings,
  FileText,
  Users,
  Share2,
  Calendar as CalendarIcon,
  History,
  TrendingUp,
  Mail,
} from "lucide-react"

import { NavMain } from "@/components/nav-main"
import { NavUser } from "@/components/nav-user"
import { TeamSwitcher } from "@/components/team-switcher"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
} from "@/components/ui/sidebar"

const navMain = [
  {
    title: "Dashboard",
    url: "/dashboard",
    icon: LayoutDashboard,
  },
  {
    title: "Review Queue",
    url: "/review-queue",
    icon: CheckCircle,
  },
  {
    title: "Posts",
    url: "/posts",
    icon: FileText,
    items: [
      {
        title: "All Posts",
        url: "/posts",
      },
      {
        title: "Create New",
        url: "/posts/create",
      },
      {
        title: "Categories",
        url: "/categories",
      },
      {
        title: "Tags",
        url: "/tags",
      },
    ],
  },
  {
    title: "Analytics",
    url: "/analytics",
    icon: TrendingUp,
    items: [
      {
        title: "Dashboard",
        url: "/analytics",
      },
    ],
  },
  {
    title: "Admin",
    url: "#",
    icon: Users,
    items: [
      {
        title: "Manage Users",
        url: "/admin/users",
      },
      {
        title: "System Analytics",
        url: "/admin/analytics",
      },
    ],
  },
  {
    title: "Schedule",
    url: "/scheduling",
    icon: CalendarIcon,
    items: [
      {
        title: "Content Calendar",
        url: "/scheduling",
      },
      {
        title: "Publishing History",
        url: "/publishing-history",
      },
    ],
  },
  {
    title: "Social",
    url: "/social-connections",
    icon: Share2,
    items: [
      {
        title: "Social Connections",
        url: "/social-connections",
      },
    ],
  },
  {
    title: "Messaging",
    url: "/messages",
    icon: Mail,
    items: [
      {
        title: "Messages",
        url: "/messages",
      },
      {
        title: "Notifications",
        url: "/notifications",
      },
    ],
  },
  {
    title: "Settings",
    url: "/settings",
    icon: Settings,
    items: [
      {
        title: "Profile",
        url: "/settings",
      },
      {
        title: "Devices",
        url: "/devices",
      },
      {
        title: "Activity Logs",
        url: "/activity-logs",
      },
    ],
  },
]

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <TeamSwitcher />
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={navMain} />
      </SidebarContent>
      <SidebarFooter>
        <NavUser />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}
