"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

import { AuthService } from "@/client";
import { Button } from "@/components/ui/button";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

const formSchema = z.object({
    username: z
        .string()
        .email({
            message: "Invalid email format.",
        })
        .max(320, {
            message: "Email must be at most 320 characters.",
        }),
    password: z.string().min(4, {
        message: "Password must be at least 4 characters.",
    }),
});

export function LoginFormHandle() {
    const router = useRouter();

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            username: "",
            password: "",
        },
    });

    async function onSubmit(values: z.infer<typeof formSchema>) {
        const { response, error } = await AuthService.postApiV1AuthLogin({
            body: values,
        });

        if (response.ok) {
            toast("Logged in successfully.");
            router.push("/home");
            router.refresh();
        } else {
            toast(error?.message ?? "An error occurred.");
        }
    }

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
                <FormField
                    control={form.control}
                    name="username"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>อีเมล</FormLabel>
                            <FormControl>
                                <Input
                                    placeholder="cos@rumail.ru.ac.th"
                                    type="email"
                                    {...field}
                                />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />
                <FormField
                    control={form.control}
                    name="password"
                    render={({ field }) => (
                        <FormItem>
                            <div className="flex items-center">
                                <FormLabel>รหัสผ่าน</FormLabel>
                                <Link
                                    href="/forgetpassword"
                                    className="ml-auto inline-block text-sm underline-offset-4 hover:underline"
                                >
                                    ลืมรหัสผ่าน?
                                </Link>
                            </div>

                            <FormControl>
                                <Input
                                    placeholder="********"
                                    type="password"
                                    {...field}
                                />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />
                <Button type="submit" className="w-full">
                    เข้าสู่ระบบ
                </Button>
            </form>
            <Button
                onClick={() => {
                    router.push("http://localhost:8000/api/v1/auth/google");
                }}
                variant="outline"
                className="mt-5 w-full"
            >
                เข้าสู่ระบบด้วยบัญชี Google
            </Button>
            <div className="mt-4 text-center text-sm">
                มีบัญชีแล้วหรือยัง?{" "}
                <Link href="/register" className="underline underline-offset-4">
                    ลงทะเบียน
                </Link>
            </div>
        </Form>
    );
}

export function LoginForm({
    className,
    ...props
}: React.ComponentPropsWithoutRef<"div">) {
    return (
        <div className={cn("flex flex-col gap-6", className)} {...props}>
            <Card>
                <CardHeader>
                    <CardTitle className="text-2xl">เข้าสู่ระบบ</CardTitle>
                    <CardDescription>
                        ป้อนอีเมลของคุณด้านล่างเพื่อเข้าสู่ระบบบัญชีของคุณ
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <LoginFormHandle />
                </CardContent>
            </Card>
        </div>
    );
}
