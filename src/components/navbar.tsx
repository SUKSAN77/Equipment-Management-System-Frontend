"use client";

import { LogOut, User } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { use, useState } from "react";

import { AuthService } from "@/client";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { UserProfileDialog } from "@/components/UserProfileDialog";
import { useUser } from "@/lib/auth";
import { UserRole } from "@/types/users";

export function Navbar() {
    const { userPromise } = useUser();
    const user = use(userPromise);
    const [showProfileDialog, setShowProfileDialog] = useState(false);

    const router = useRouter();

    const handleLogout = async () => {
        const { data } = await AuthService.postApiV1AuthLogout({
            headers: { "Content-Type": "application/json" },
            credentials: "include",
        });
        console.log(data);
        router.push("/login");
    };

    return (
        <>
            <div className="sticky top-0 z-30 border-b bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/60">
                <div className="flex h-16 items-center px-4 transition-all duration-200 md:px-6">
                    <div className="flex items-center gap-4">
                        {user &&
                            [
                                UserRole.ADMIN,
                                UserRole.DEPARTMENT_HEAD,
                                UserRole.INVENTORY_MANAGER,
                            ].includes(user.role) && (
                                <div>
                                    <Link href="/">
                                        <Button variant="link">หน้าแรก</Button>
                                    </Link>
                                    <Link href="/home">
                                        <Button variant="link">
                                            หน้าการจัดการ
                                        </Button>
                                    </Link>
                                </div>
                            )}
                    </div>

                    <div className="ml-auto flex items-center gap-4">
                        <div className="hidden md:block">
                            <p className="flex items-center gap-2 text-sm font-medium">
                                <span className="text-xs text-muted-foreground">
                                    {user?.role === UserRole.ADMIN &&
                                        "ผู้ดูแลระบบ"}
                                    {user?.role === UserRole.DEPARTMENT_HEAD &&
                                        "หัวหน้าฝ่าย"}
                                    {user?.role ===
                                        UserRole.INVENTORY_MANAGER &&
                                        "ผู้จัดการคลัง"}
                                    {user?.role === UserRole.INSTRUCTOR &&
                                        "อาจารย์"}
                                    {user?.role === UserRole.STAFF &&
                                        "เจ้าหน้าที่"}
                                    {user?.role === UserRole.UNKNOWN &&
                                        "ไม่ทราบบทบาท"}
                                </span>
                                <span>
                                    {user?.firstName} {user?.lastName}
                                </span>
                            </p>
                        </div>
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button
                                    variant="ghost"
                                    className="relative h-9 w-9 rounded-full transition-colors duration-200 hover:bg-gray-100"
                                >
                                    <Avatar className="h-9 w-9 ring-2 ring-gray-100">
                                        <AvatarFallback className="bg-blue-500 text-white">
                                            {user?.firstName?.charAt(0)}
                                            {user?.lastName?.charAt(0)}
                                        </AvatarFallback>
                                    </Avatar>
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent
                                className="w-56"
                                align="end"
                                forceMount
                                sideOffset={8}
                            >
                                <DropdownMenuLabel className="font-normal">
                                    <div className="flex flex-col space-y-1.5">
                                        <p className="text-sm font-medium leading-none">
                                            {user?.firstName} {user?.lastName}
                                        </p>
                                        <p className="text-xs leading-none text-muted-foreground">
                                            {user?.email}
                                        </p>
                                    </div>
                                </DropdownMenuLabel>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                    className="cursor-pointer transition-colors duration-200 hover:bg-gray-100"
                                    onClick={() => setShowProfileDialog(true)}
                                >
                                    <User className="mr-2 h-4 w-4" />
                                    <span>ข้อมูลส่วนตัว</span>
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                    className="cursor-pointer text-red-600 transition-colors duration-200 hover:bg-red-50"
                                    onClick={handleLogout}
                                >
                                    <LogOut className="mr-2 h-4 w-4" />
                                    <span>ออกจากระบบ</span>
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                </div>
            </div>

            {user && (
                <UserProfileDialog
                    user={user}
                    open={showProfileDialog}
                    onOpenChange={setShowProfileDialog}
                    onSuccess={() => {
                        // Refresh the page to get updated user data
                        window.location.reload();
                    }}
                />
            )}
        </>
    );
}

export default Navbar;
