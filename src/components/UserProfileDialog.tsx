"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import * as z from "zod";

import { UsersService } from "@/client";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { UserMe } from "@/types/users";

const userProfileSchema = z.object({
    firstName: z.string().min(1, "กรุณากรอกชื่อ"),
    lastName: z.string().min(1, "กรุณากรอกนามสกุล"),
    email: z.string().email("กรุณากรอกอีเมลที่ถูกต้อง"),
});

type UserProfileValues = z.infer<typeof userProfileSchema>;

interface UserProfileDialogProps {
    user: UserMe;
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSuccess?: () => void;
}

export function UserProfileDialog({
    user,
    open,
    onOpenChange,
    onSuccess,
}: UserProfileDialogProps) {
    const form = useForm<UserProfileValues>({
        resolver: zodResolver(userProfileSchema),
        defaultValues: {
            firstName: user?.firstName || "",
            lastName: user?.lastName || "",
            email: user?.email || "",
        },
    });

    const [isDisabled, setIsDisabled] = useState(true);

    const handleDisable = () => {
        if (!isDisabled) {
            // Reset form to initial values when canceling
            form.reset({
                firstName: user?.firstName || "",
                lastName: user?.lastName || "",
                email: user?.email || "",
            });
        }
        setIsDisabled(!isDisabled);
    };

    const onSubmit = async (values: UserProfileValues) => {
        try {
            await UsersService.patchApiV1UsersMe({
                headers: { "Content-Type": "application/json" },
                body: values,
                credentials: "include",
            });

            toast.success("ข้อมูลส่วนตัวของคุณถูกอัพเดทเรียบร้อยแล้ว");

            onSuccess?.();
            onOpenChange(false);
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
        } catch (error) {
            toast.error("เกิดข้อผิดพลาด", {
                description: "ไม่สามารถอัพเดทข้อมูลได้ กรุณาลองใหม่อีกครั้ง",
            });
        }
    };

    return (
        <Dialog
            open={open}
            onOpenChange={(open) => {
                if (!open) {
                    setIsDisabled(true);
                    form.reset({
                        firstName: user?.firstName || "",
                        lastName: user?.lastName || "",
                        email: user?.email || "",
                    });
                }
                onOpenChange(open);
            }}
        >
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>ข้อมูลส่วนตัว</DialogTitle>
                    <DialogDescription>
                        แก้ไขข้อมูลส่วนตัวของคุณ การเปลี่ยนแปลงจะมีผลทันที
                    </DialogDescription>
                </DialogHeader>
                <Form {...form}>
                    <form
                        onSubmit={form.handleSubmit(onSubmit)}
                        className="space-y-4"
                    >
                        <FormField
                            control={form.control}
                            name="firstName"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>ชื่อ</FormLabel>
                                    <FormControl>
                                        <Input
                                            placeholder="ชื่อ"
                                            {...field}
                                            disabled={isDisabled}
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="lastName"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>นามสกุล</FormLabel>
                                    <FormControl>
                                        <Input
                                            placeholder="นามสกุล"
                                            {...field}
                                            disabled={isDisabled}
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="email"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>อีเมล</FormLabel>
                                    <FormControl>
                                        <Input
                                            placeholder="อีเมล"
                                            {...field}
                                            disabled={true}
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <DialogFooter>
                            {isDisabled ? (
                                <Button type="button" onClick={handleDisable}>
                                    แก้ไข
                                </Button>
                            ) : (
                                <div className="flex gap-2">
                                    <Button
                                        className="bg-red-500 hover:bg-red-600"
                                        type="reset"
                                        onClick={handleDisable}
                                    >
                                        ยกเลิก
                                    </Button>
                                    <Button
                                        className="bg-blue-600 hover:bg-blue-700"
                                        type="submit"
                                    >
                                        บันทึก
                                    </Button>
                                </div>
                            )}
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
}

export default UserProfileDialog;
