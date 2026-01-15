"use client";

import { Loader2 } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";

import { AuthService } from "@/client";
import { Button } from "@/components/ui/button";
import {
    Card,
    CardContent,
    CardFooter,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";

export default function Page() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const called = useRef(false);
    const code = searchParams.get("code");
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    // const state = searchParams.get("state");

    useEffect(() => {
        const handleCallback = async () => {
            try {
                setIsLoading(true);
                if (called.current) return;
                called.current = true;
                console.log("code", code);
                if (code) {
                    const { response } =
                        await AuthService.postApiV1AuthGoogleCallback({
                            body: { code: code },
                            headers: { "Content-Type": "application/json" },
                            credentials: "include",
                        });
                    if (response.ok) {
                        router.push("/");
                        router.refresh();
                    }

                    if (response.status === 403 || response.status === 400) {
                        setIsLoading(false);
                        setError("ติดต่อเจ้าหน้าที่และลองใหม่อีกครั้ง");
                    }

                    console.log(response);
                }
            } catch (err: unknown) {
                if (err instanceof Error) {
                    setError(err.message);
                } else {
                    setError("เกิดข้อผิดพลาดไม่รู้จัก");
                }
                console.error(err);
            }
        };
        handleCallback();
    }, [code, router]);

    if (isLoading) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-gray-100">
                <Card className="w-[450px]">
                    <CardHeader>
                        <CardTitle className="text-center text-2xl font-bold text-blue-600">
                            <Loader2 className="mx-auto h-8 w-8 animate-spin" />
                            กำลังเข้าสู่ระบบ
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="mb-4 text-center text-gray-600">
                            กรุณารอสักครู่...
                        </p>
                    </CardContent>
                </Card>
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-gray-100">
                <Card className="w-[450px]">
                    <CardHeader>
                        <CardTitle className="text-center text-2xl font-bold text-green-600">
                            สร้างบัญชีผู้ใช้สำเร็จ
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="mb-4 text-center text-gray-600">
                            {error}
                        </p>
                    </CardContent>
                    <CardFooter className="flex justify-center">
                        <Button
                            onClick={() => router.push("/login")}
                            className="bg-blue-600 text-white hover:bg-blue-700"
                        >
                            กลับไปหน้าเข้าสู่ระบบ
                        </Button>
                    </CardFooter>
                </Card>
            </div>
        );
    }

    return (
        <div>
            <div className="flex min-h-screen items-center justify-center bg-gray-100">
                <Card className="w-[450px]">
                    <CardHeader>
                        <CardTitle className="text-center text-2xl font-bold text-blue-600">
                            <Loader2 className="mx-auto h-8 w-8 animate-spin text-blue-600" />
                            Redirecting...
                        </CardTitle>
                    </CardHeader>
                </Card>
            </div>
        </div>
    );
}
