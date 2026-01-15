"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

import { UsersService } from "@/client";
import { Button } from "@/components/ui/button";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

export function RegisterForm({
    className,
    ...props
}: React.ComponentPropsWithoutRef<"div">) {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setIsLoading(true);

        const formData = new FormData(e.currentTarget);
        const email = formData.get("email") as string;
        const password = formData.get("password") as string;
        const firstName = formData.get("firstname") as string;
        const lastName = formData.get("lastname") as string;

        try {
            const { data, error } = await UsersService.postApiV1UsersSignup({
                body: {
                    email,
                    password,
                    firstName: firstName || undefined,
                    lastName: lastName || undefined,
                },
            });

            if (error) {
                toast.error("เกิดข้อผิดพลาด: " + error.message);
                return;
            }

            if (data) {
                toast.success("สมัครสมาชิกสำเร็จ");
                router.push("/login");
            }
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
        } catch (error) {
            toast.error("เกิดข้อผิดพลาดที่ไม่คาดคิด กรุณาลองใหม่อีกครั้ง");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className={cn("flex flex-col gap-6", className)} {...props}>
            <Card>
                <CardHeader>
                    <CardTitle className="text-2xl">ลงทะเบียน</CardTitle>
                    <CardDescription>
                        ลงทะเบียนโดยกรอกข้อมูลด้านล่างนี้
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit}>
                        <div className="flex flex-col gap-6">
                            <div className="grid gap-2">
                                <Label htmlFor="email">
                                    อีเมล{" "}
                                    <span className="text-red-500">*</span>
                                </Label>
                                <Input
                                    id="email"
                                    name="email"
                                    type="email"
                                    placeholder="cos@rumail.ru.ac.th"
                                    required
                                    disabled={isLoading}
                                />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="password">
                                    รหัสผ่าน{" "}
                                    <span className="text-red-500">*</span>
                                </Label>
                                <Input
                                    id="password"
                                    name="password"
                                    type="password"
                                    required
                                    disabled={isLoading}
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="grid gap-2">
                                    <Label htmlFor="firstname">ชื่อ</Label>
                                    <Input
                                        id="firstname"
                                        name="firstname"
                                        type="text"
                                        placeholder="ชื่อจริง"
                                        disabled={isLoading}
                                    />
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor="lastname">นามสกุล</Label>
                                    <Input
                                        id="lastname"
                                        name="lastname"
                                        type="text"
                                        placeholder="นามสกุล"
                                        disabled={isLoading}
                                    />
                                </div>
                            </div>
                            <Button
                                type="submit"
                                className="w-full"
                                disabled={isLoading}
                            >
                                {isLoading ? "กำลังดำเนินการ..." : "ลงทะเบียน"}
                            </Button>
                        </div>
                        <div className="mt-4 text-center text-sm">
                            มีบัญชีอยู่แล้ว?{" "}
                            <Link
                                href="/login"
                                className="underline underline-offset-4"
                            >
                                เข้าสู่ระบบ
                            </Link>
                        </div>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
}
