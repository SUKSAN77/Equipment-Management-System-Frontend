"use client";

import { Box, Home, Menu, Tag, Users, X } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type React from "react";
import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

import Navbar from "./Navbar";

export default function Layout({ children }: { children: React.ReactNode }) {
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const pathname = usePathname();

    const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);

    // ปิด sidebar เมื่อคลิกนอก sidebar บนมือถือ
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            const sidebar = document.getElementById("sidebar");
            if (
                isSidebarOpen &&
                sidebar &&
                !sidebar.contains(event.target as Node)
            ) {
                setIsSidebarOpen(false);
            }
        };

        document.addEventListener("mousedown", handleClickOutside);
        return () =>
            document.removeEventListener("mousedown", handleClickOutside);
    }, [isSidebarOpen]);

    const navItems = [
        { href: "/home", icon: Home, label: "หน้าหลัก" },
        { href: "/equipment", icon: Box, label: "จัดการครุภัณฑ์" },
        { href: "/users", icon: Users, label: "จัดการผู้ใช้" },
        { href: "/rooms", icon: Home, label: "จัดการห้อง" },
        { href: "/categories", icon: Tag, label: "จัดการหมวดหมู่" },
    ];

    return (
        <div className="flex h-screen bg-gray-50">
            {/* Overlay for mobile */}
            {isSidebarOpen && (
                <div
                    className="fixed inset-0 z-30 bg-black/20 backdrop-blur-sm md:hidden"
                    onClick={() => setIsSidebarOpen(false)}
                />
            )}

            {/* Sidebar */}
            <aside
                id="sidebar"
                className={cn(
                    "fixed inset-y-0 left-0 z-40 w-64 transform bg-white shadow-lg transition-transform duration-300 ease-in-out",
                    isSidebarOpen ? "translate-x-0" : "-translate-x-full",
                    "md:relative md:translate-x-0",
                )}
            >
                <div className="flex h-16 items-center justify-between border-b px-6">
                    <span className="bg-gradient-to-r from-blue-600 to-blue-400 bg-clip-text text-xl font-semibold text-transparent">
                        ระบบจัดการ
                    </span>
                    <Button
                        variant="ghost"
                        size="icon"
                        className="transition-colors hover:bg-gray-100 md:hidden"
                        onClick={toggleSidebar}
                    >
                        <X className="h-5 w-5" />
                    </Button>
                </div>
                <nav className="space-y-1 p-4">
                    {navItems.map((item) => {
                        const isActive = pathname === item.href;
                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                onClick={() => setIsSidebarOpen(false)}
                            >
                                <Button
                                    variant="ghost"
                                    className={cn(
                                        "w-full justify-start transition-colors duration-200",
                                        isActive
                                            ? "bg-blue-50 text-blue-600 hover:bg-blue-100"
                                            : "hover:bg-gray-100",
                                    )}
                                >
                                    <item.icon
                                        className={cn(
                                            "mr-2 h-4 w-4",
                                            isActive
                                                ? "text-blue-600"
                                                : "text-gray-500",
                                        )}
                                    />
                                    {item.label}
                                </Button>
                            </Link>
                        );
                    })}
                </nav>
            </aside>

            {/* Main content */}
            <div className="flex flex-1 flex-col overflow-hidden">
                <Navbar />
                <main className="flex-1 overflow-y-auto overflow-x-hidden bg-gray-50 p-4 md:p-6">
                    {children}
                </main>
            </div>

            {/* Mobile sidebar toggle */}
            <Button
                variant="ghost"
                size="icon"
                className="fixed bottom-4 right-4 z-50 bg-white shadow-lg transition-colors duration-200 hover:bg-gray-100 md:hidden"
                onClick={toggleSidebar}
            >
                <Menu className="h-6 w-6" />
            </Button>
        </div>
    );
}
