"use client"

import * as React from "react"
import {
  BookOpen,
  Frame,
  History,
  LayoutDashboard,
  Settings,
  Smartphone,
  FileText,
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
    title: "Posts",
    url: "#",
    icon: FileText,
    items: [
      {
        title: "All Posts",
        url: "#",
      },
      {
        title: "Create New",
        url: "#",
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
