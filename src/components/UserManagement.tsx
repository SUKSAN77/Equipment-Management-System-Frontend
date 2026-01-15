"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { format, formatDistanceToNow } from "date-fns";
import { th } from "date-fns/locale";
import { Edit, Loader2, Plus, Search, Trash2 } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import * as z from "zod";

import { UsersService } from "@/client";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import {
    HoverCard,
    HoverCardContent,
    HoverCardTrigger,
} from "@/components/ui/hover-card";
import { Input } from "@/components/ui/input";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { useUsers } from "@/hooks/api";
import { UpdateUser, User, UserRole } from "@/types/users";

const USER_ROLES = {
    [UserRole.ADMIN]: "ผู้ดูแลระบบ",
    [UserRole.DEPARTMENT_HEAD]: "หัวหน้าภาควิชา",
    [UserRole.INVENTORY_MANAGER]: "ผู้จัดการคลัง",
    [UserRole.INSTRUCTOR]: "อาจารย์",
    [UserRole.STAFF]: "เจ้าหน้าที่",
    [UserRole.UNKNOWN]: "ไม่ทราบบทบาท",
} as const;

const userCreateSchema = z.object({
    email: z.string().email({ message: "กรุณากรอกอีเมลให้ถูกต้อง" }).max(320, {
        message: "อีเมลต้องมีความยาวไม่เกิน 320 ตัวอักษร",
    }),
    password: z.string().min(1, { message: "กรุณากรอกรหัสผ่าน" }).max(256, {
        message: "รหัสผ่านต้องมีความยาวไม่เกิน 256 ตัวอักษร",
    }),
    firstName: z.string().min(1, { message: "กรุณากรอกชื่อ" }).max(128, {
        message: "ชื่อต้องมีความยาวไม่เกิน 128 ตัวอักษร",
    }),
    lastName: z.string().min(1, { message: "กรุณากรอกนามสกุล" }).max(128, {
        message: "นามสกุลต้องมีความยาวไม่เกิน 128 ตัวอักษร",
    }),
    role: z.string(),
    isActive: z.boolean(),
    emailVerified: z.boolean(),
});

const userUpdateSchema = z.object({
    email: z.string().email({ message: "กรุณากรอกอีเมลให้ถูกต้อง" }).max(320, {
        message: "อีเมลต้องมีความยาวไม่เกิน 320 ตัวอักษร",
    }),
    password: z.string().optional(),
    firstName: z.string().min(1, { message: "กรุณากรอกชื่อ" }).max(128, {
        message: "ชื่อต้องมีความยาวไม่เกิน 128 ตัวอักษร",
    }),
    lastName: z.string().min(1, { message: "กรุณากรอกนามสกุล" }).max(128, {
        message: "นามสกุลต้องมีความยาวไม่เกิน 128 ตัวอักษร",
    }),
    role: z.string(),
    isActive: z.boolean(),
    emailVerified: z.boolean(),
});

type UserCreateValues = z.infer<typeof userCreateSchema>;
type UserUpdateValues = z.infer<typeof userUpdateSchema>;

const DateDisplay = ({ dateString }: { dateString: string }) => {
    if (typeof dateString !== "string") return <span>ไม่ระบุ</span>;

    try {
        const date = new Date(dateString);
        const relativeTime = formatDistanceToNow(date, {
            addSuffix: true,
            locale: th,
        });

        const fullDateTime = format(date, "PPPPp", { locale: th });

        return (
            <HoverCard>
                <HoverCardTrigger>
                    <span className="cursor-pointer border-b border-dotted border-gray-400">
                        {relativeTime}
                    </span>
                </HoverCardTrigger>
                <HoverCardContent className="w-auto p-2">
                    <p className="text-sm">{fullDateTime}</p>
                </HoverCardContent>
            </HoverCard>
        );
    } catch (error) {
        console.error("Error formatting date:", error);
        return <span>วันที่ไม่ถูกต้อง</span>;
    }
};

const getRoleLabel = (role: number) => {
    return USER_ROLES[role as keyof typeof USER_ROLES] || "ไม่ทราบบทบาท";
};

export default function UserManagement() {
    const [searchTerm, setSearchTerm] = useState("");
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isDeleteAlertOpen, setIsDeleteAlertOpen] = useState(false);
    const [editingUser, setEditingUser] = useState<User | null>(null);
    const [userToDelete, setUserToDelete] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    const { users, mutate } = useUsers();

    // Create form for adding users
    const addForm = useForm<UserCreateValues>({
        resolver: zodResolver(userCreateSchema),
        defaultValues: {
            email: "",
            password: "",
            firstName: "",
            lastName: "",
            role: "0",
            isActive: true,
            emailVerified: false,
        },
    });

    // Create form for editing users
    const editForm = useForm<UserUpdateValues>({
        resolver: zodResolver(userUpdateSchema),
        defaultValues: {
            email: "",
            password: "",
            firstName: "",
            lastName: "",
            role: "0",
            isActive: true,
            emailVerified: false,
        },
    });

    const handleAdd = async (values: UserCreateValues) => {
        setIsLoading(true);
        try {
            const { error } = await UsersService.postApiV1Users({
                body: {
                    ...values,
                    role: parseInt(values.role),
                },
            });
            if (!error) {
                setIsAddModalOpen(false);
                addForm.reset();
                toast.success("เพิ่มผู้ใช้งานสำเร็จ");
                await mutate();
            } else {
                toast.error(
                    error.message || "เกิดข้อผิดพลาดในการเพิ่มผู้ใช้งาน",
                );
            }
        } finally {
            setIsLoading(false);
        }
    };

    const handleEdit = async (values: UserUpdateValues) => {
        if (!editingUser) return;

        setIsLoading(true);
        try {
            console.log("values:", values);
            const editPayload: UpdateUser = {};

            if (values.email !== editingUser.email && values.email.trim())
                editPayload.email = values.email.trim();
            if (values.password?.trim())
                editPayload.password = values.password.trim();
            if (values.firstName?.trim() !== editingUser.firstName)
                editPayload.firstName = values.firstName?.trim();
            if (values.lastName?.trim() !== editingUser.lastName)
                editPayload.lastName = values.lastName?.trim();
            if (values.role !== editingUser.role?.toString())
                editPayload.role = parseInt(values.role);
            if (values.isActive !== editingUser.isActive)
                editPayload.isActive = values.isActive;
            if (values.emailVerified !== editingUser.emailVerified)
                editPayload.emailVerified = values.emailVerified;

            // Only proceed if there are actual changes
            if (Object.keys(editPayload).length === 0) {
                toast.info("ไม่มีข้อมูลที่ต้องการแก้ไข");
                setIsEditModalOpen(false);
                return;
            }

            const { error } = await UsersService.patchApiV1UsersById({
                path: { id: editingUser.id },
                body: editPayload,
            });
            if (!error) {
                setIsEditModalOpen(false);
                setEditingUser(null);
                editForm.reset();
                toast.success("แก้ไขผู้ใช้งานสำเร็จ");
                await mutate();
            } else {
                toast.error(
                    error.message || "เกิดข้อผิดพลาดในการแก้ไขผู้ใช้งาน",
                );
            }
        } finally {
            setIsLoading(false);
        }
    };

    const handleDelete = async () => {
        if (!userToDelete) return;

        setIsLoading(true);
        try {
            const { error } = await UsersService.deleteApiV1UsersById({
                path: { id: userToDelete },
            });

            if (!error) {
                setIsDeleteAlertOpen(false);
                setUserToDelete(null);
                toast.success("ลบผู้ใช้งานสำเร็จ");
                await mutate();
            } else {
                toast.error(error.message || "เกิดข้อผิดพลาดในการลบผู้ใช้งาน");
            }
        } finally {
            setIsLoading(false);
        }
    };

    const filteredUsers = users.filter(
        (user) =>
            user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            user.firstName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            user.lastName?.toLowerCase().includes(searchTerm.toLowerCase()),
    );

    return (
        <>
            <Card className="mb-6">
                <CardHeader>
                    <div className="flex flex-col items-start justify-between sm:flex-row sm:items-center">
                        <CardTitle className="text-3xl font-bold">
                            จัดการผู้ใช้งาน
                        </CardTitle>
                        <Button
                            className="mt-4 bg-blue-500 hover:bg-blue-600 sm:mt-0"
                            onClick={() => setIsAddModalOpen(true)}
                        >
                            <Plus className="mr-2 h-4 w-4" /> เพิ่มผู้ใช้งาน
                        </Button>
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="mb-6">
                        <div className="relative">
                            <Search className="absolute left-2 top-1/2 -translate-y-1/2 transform text-gray-400" />
                            <Input
                                placeholder="ค้นหาผู้ใช้งาน..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="pl-8"
                            />
                        </div>
                    </div>

                    <div className="-mx-4 overflow-x-auto sm:mx-0">
                        <div className="inline-block min-w-full align-middle">
                            <div className="overflow-hidden rounded-lg border border-gray-200">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>อีเมล</TableHead>
                                            <TableHead>ชื่อ-นามสกุล</TableHead>
                                            <TableHead>บทบาท</TableHead>
                                            <TableHead>สถานะ</TableHead>
                                            <TableHead>วันที่สร้าง</TableHead>
                                            <TableHead>การจัดการ</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {!users ? (
                                            <TableRow>
                                                <TableCell
                                                    colSpan={6}
                                                    className="py-4 text-center"
                                                >
                                                    <Loader2 className="mx-auto h-6 w-6 animate-spin" />
                                                    <p className="mt-2">
                                                        กำลังโหลดข้อมูล...
                                                    </p>
                                                </TableCell>
                                            </TableRow>
                                        ) : filteredUsers.length === 0 ? (
                                            <TableRow>
                                                <TableCell
                                                    colSpan={6}
                                                    className="py-4 text-center"
                                                >
                                                    ไม่พบข้อมูลผู้ใช้งาน
                                                </TableCell>
                                            </TableRow>
                                        ) : (
                                            filteredUsers.map((user) => (
                                                <TableRow key={user.id}>
                                                    <TableCell>
                                                        {user.email}
                                                    </TableCell>
                                                    <TableCell>
                                                        {user.firstName}{" "}
                                                        {user.lastName}
                                                    </TableCell>
                                                    <TableCell>
                                                        {getRoleLabel(
                                                            typeof user.role ===
                                                                "string"
                                                                ? parseInt(
                                                                      user.role,
                                                                  )
                                                                : user.role,
                                                        )}
                                                    </TableCell>
                                                    <TableCell>
                                                        {user.isActive ? (
                                                            <span className="text-green-600">
                                                                ใช้งาน
                                                            </span>
                                                        ) : (
                                                            <span className="text-red-600">
                                                                ไม่ใช้งาน
                                                            </span>
                                                        )}
                                                    </TableCell>
                                                    <TableCell>
                                                        <DateDisplay
                                                            dateString={
                                                                typeof user.createdAt ===
                                                                "string"
                                                                    ? user.createdAt
                                                                    : new Date(
                                                                          user.createdAt as string,
                                                                      ).toISOString()
                                                            }
                                                        />
                                                    </TableCell>
                                                    <TableCell>
                                                        <div className="flex gap-2">
                                                            <Button
                                                                size="sm"
                                                                variant="outline"
                                                                className="flex items-center gap-1"
                                                                onClick={() => {
                                                                    setEditingUser(
                                                                        user,
                                                                    );
                                                                    editForm.reset(
                                                                        {
                                                                            email: user.email,
                                                                            password:
                                                                                "",
                                                                            firstName:
                                                                                user.firstName ||
                                                                                "",
                                                                            lastName:
                                                                                user.lastName ||
                                                                                "",
                                                                            role:
                                                                                typeof user.role ===
                                                                                "string"
                                                                                    ? user.role
                                                                                    : user.role?.toString() ||
                                                                                      "0",
                                                                            isActive:
                                                                                user.isActive ??
                                                                                true,
                                                                            emailVerified:
                                                                                user.emailVerified ??
                                                                                false,
                                                                        },
                                                                    );
                                                                    setIsEditModalOpen(
                                                                        true,
                                                                    );
                                                                }}
                                                            >
                                                                <Edit className="h-4 w-4" />{" "}
                                                                แก้ไข
                                                            </Button>
                                                            <Button
                                                                size="sm"
                                                                variant="destructive"
                                                                className="flex items-center gap-1"
                                                                onClick={() => {
                                                                    setUserToDelete(
                                                                        user.id,
                                                                    );
                                                                    setIsDeleteAlertOpen(
                                                                        true,
                                                                    );
                                                                }}
                                                            >
                                                                <Trash2 className="h-4 w-4" />{" "}
                                                                ลบ
                                                            </Button>
                                                        </div>
                                                    </TableCell>
                                                </TableRow>
                                            ))
                                        )}
                                    </TableBody>
                                </Table>
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Add User Modal */}
            <Dialog
                open={isAddModalOpen}
                onOpenChange={(open) => {
                    if (!open) {
                        addForm.reset();
                    }
                    setIsAddModalOpen(open);
                }}
            >
                <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                        <DialogTitle className="text-xl">
                            เพิ่มผู้ใช้งานใหม่
                        </DialogTitle>
                        <DialogDescription>
                            กรอกข้อมูลผู้ใช้งานที่ต้องการเพิ่ม
                        </DialogDescription>
                    </DialogHeader>
                    <Form {...addForm}>
                        <form
                            onSubmit={addForm.handleSubmit(handleAdd)}
                            className="space-y-4 py-4"
                        >
                            <FormField
                                control={addForm.control}
                                name="email"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>อีเมล</FormLabel>
                                        <FormControl>
                                            <Input
                                                placeholder="กรอกอีเมล"
                                                {...field}
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={addForm.control}
                                name="password"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>รหัสผ่าน</FormLabel>
                                        <FormControl>
                                            <Input
                                                type="password"
                                                placeholder="กรอกรหัสผ่าน"
                                                {...field}
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={addForm.control}
                                name="firstName"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>ชื่อ</FormLabel>
                                        <FormControl>
                                            <Input
                                                placeholder="กรอกชื่อ"
                                                {...field}
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={addForm.control}
                                name="lastName"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>นามสกุล</FormLabel>
                                        <FormControl>
                                            <Input
                                                placeholder="กรอกนามสกุล"
                                                {...field}
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={addForm.control}
                                name="role"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>บทบาท</FormLabel>
                                        <Select
                                            onValueChange={field.onChange}
                                            defaultValue={field.value}
                                        >
                                            <FormControl>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="เลือกบทบาท" />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                {Object.entries(USER_ROLES).map(
                                                    ([role, label]) => (
                                                        <SelectItem
                                                            key={role}
                                                            value={role.toString()}
                                                        >
                                                            {label}
                                                        </SelectItem>
                                                    ),
                                                )}
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <DialogFooter>
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => {
                                        setIsAddModalOpen(false);
                                        addForm.reset();
                                    }}
                                >
                                    ยกเลิก
                                </Button>
                                <Button type="submit" disabled={isLoading}>
                                    {isLoading ? (
                                        <>
                                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                            กำลังเพิ่ม...
                                        </>
                                    ) : (
                                        "บันทึก"
                                    )}
                                </Button>
                            </DialogFooter>
                        </form>
                    </Form>
                </DialogContent>
            </Dialog>

            {/* Edit User Modal */}
            <Dialog
                open={isEditModalOpen}
                onOpenChange={(open) => {
                    if (!open) {
                        editForm.reset();
                        setEditingUser(null);
                    }
                    setIsEditModalOpen(open);
                }}
            >
                <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                        <DialogTitle className="text-xl">
                            แก้ไขข้อมูลผู้ใช้งาน
                        </DialogTitle>
                        <DialogDescription>
                            แก้ไขข้อมูลผู้ใช้งานที่ต้องการเปลี่ยน
                        </DialogDescription>
                    </DialogHeader>
                    <Form {...editForm}>
                        <form
                            onSubmit={editForm.handleSubmit(handleEdit)}
                            className="space-y-4 py-4"
                        >
                            <FormField
                                control={editForm.control}
                                name="email"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>อีเมล</FormLabel>
                                        <FormControl>
                                            <Input
                                                placeholder="กรอกอีเมล"
                                                {...field}
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={editForm.control}
                                name="password"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>
                                            รหัสผ่าน
                                            (ไม่ต้องกรอกถ้าไม่ต้องการเปลี่ยน)
                                        </FormLabel>
                                        <FormControl>
                                            <Input
                                                type="password"
                                                placeholder="กรอกรหัสผ่านใหม่"
                                                {...field}
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={editForm.control}
                                name="firstName"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>ชื่อ</FormLabel>
                                        <FormControl>
                                            <Input
                                                placeholder="กรอกชื่อ"
                                                {...field}
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={editForm.control}
                                name="lastName"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>นามสกุล</FormLabel>
                                        <FormControl>
                                            <Input
                                                placeholder="กรอกนามสกุล"
                                                {...field}
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={editForm.control}
                                name="role"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>บทบาท</FormLabel>
                                        <Select
                                            onValueChange={field.onChange}
                                            defaultValue={field.value}
                                        >
                                            <FormControl>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="เลือกบทบาท" />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                {Object.entries(USER_ROLES).map(
                                                    ([role, label]) => (
                                                        <SelectItem
                                                            key={role}
                                                            value={role.toString()}
                                                        >
                                                            {label}
                                                        </SelectItem>
                                                    ),
                                                )}
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={editForm.control}
                                name="isActive"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>สถานะการใช้งาน</FormLabel>
                                        <Select
                                            onValueChange={(value) =>
                                                field.onChange(value === "true")
                                            }
                                            defaultValue={
                                                field.value ? "true" : "false"
                                            }
                                        >
                                            <FormControl>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="เลือกสถานะการใช้งาน" />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                <SelectItem value="true">
                                                    ใช้งาน
                                                </SelectItem>
                                                <SelectItem value="false">
                                                    ไม่ใช้งาน
                                                </SelectItem>
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={editForm.control}
                                name="emailVerified"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>
                                            สถานะการยืนยันอีเมล
                                        </FormLabel>
                                        <Select
                                            onValueChange={(value) =>
                                                field.onChange(value === "true")
                                            }
                                            defaultValue={
                                                field.value ? "true" : "false"
                                            }
                                        >
                                            <FormControl>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="เลือกสถานะการยืนยันอีเมล" />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                <SelectItem value="true">
                                                    ยืนยันแล้ว
                                                </SelectItem>
                                                <SelectItem value="false">
                                                    ยังไม่ยืนยัน
                                                </SelectItem>
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <DialogFooter>
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => {
                                        setIsEditModalOpen(false);
                                        setEditingUser(null);
                                        editForm.reset();
                                    }}
                                >
                                    ยกเลิก
                                </Button>
                                <Button type="submit" disabled={isLoading}>
                                    {isLoading ? (
                                        <>
                                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                            กำลังบันทึก...
                                        </>
                                    ) : (
                                        "บันทึก"
                                    )}
                                </Button>
                            </DialogFooter>
                        </form>
                    </Form>
                </DialogContent>
            </Dialog>

            {/* Delete User Alert */}
            <AlertDialog
                open={isDeleteAlertOpen}
                onOpenChange={setIsDeleteAlertOpen}
            >
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>
                            ยืนยันการลบผู้ใช้งาน
                        </AlertDialogTitle>
                        <AlertDialogDescription>
                            คุณต้องการลบผู้ใช้งานนี้ใช่หรือไม่?
                            การกระทำนี้ไม่สามารถย้อนกลับได้
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel
                            onClick={() => {
                                setIsDeleteAlertOpen(false);
                                setUserToDelete(null);
                            }}
                        >
                            ยกเลิก
                        </AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleDelete}
                            disabled={isLoading}
                            className="bg-red-500 hover:bg-red-600"
                        >
                            {isLoading ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    กำลังลบ...
                                </>
                            ) : (
                                "ยืนยัน"
                            )}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    );
}
