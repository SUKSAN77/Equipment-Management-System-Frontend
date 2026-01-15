"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { format, formatDistanceToNow } from "date-fns";
import { th } from "date-fns/locale";
import { Edit, Loader2, Plus, Search, Trash2 } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import * as z from "zod";

import { CategoriesService } from "@/client";
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
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { useCategories } from "@/hooks/api";
import { Category } from "@/types/categories";

const categoryFormSchema = z.object({
    name: z.string().min(1, { message: "กรุณากรอกชื่อหมวดหมู่" }).max(128, {
        message: "ชื่อหมวดหมู่ต้องมีความยาวไม่เกิน 128 ตัวอักษร",
    }),
});

type CategoryFormValues = z.infer<typeof categoryFormSchema>;

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

export default function CategoryManagement() {
    const [searchTerm, setSearchTerm] = useState("");
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isDeleteAlertOpen, setIsDeleteAlertOpen] = useState(false);
    const [editingCategory, setEditingCategory] = useState<Category | null>(
        null,
    );
    const [categoryToDelete, setCategoryToDelete] = useState<string | null>(
        null,
    );
    const [isLoading, setIsLoading] = useState(false);

    const { categories, mutate } = useCategories();

    // Create form for adding categories
    const addForm = useForm<CategoryFormValues>({
        resolver: zodResolver(categoryFormSchema),
        defaultValues: {
            name: "",
        },
    });

    // Create form for editing categories
    const editForm = useForm<CategoryFormValues>({
        resolver: zodResolver(categoryFormSchema),
        defaultValues: {
            name: "",
        },
    });

    const handleAdd = async (values: CategoryFormValues) => {
        setIsLoading(true);
        try {
            const { error } = await CategoriesService.postApiV1Categories({
                body: { name: values.name },
            });

            if (!error) {
                setIsAddModalOpen(false);
                addForm.reset();
                toast.success("เพิ่มหมวดหมู่สำเร็จ");
                await mutate();
            } else {
                toast.error(
                    error.message || "เกิดข้อผิดพลาดในการเพิ่มหมวดหมู่",
                );
            }
        } finally {
            setIsLoading(false);
        }
    };

    const handleEdit = async (values: CategoryFormValues) => {
        if (!editingCategory) return;

        setIsLoading(true);
        try {
            const { error } = await CategoriesService.patchApiV1CategoriesById({
                path: { id: editingCategory.id },
                body: { name: values.name },
            });

            if (!error) {
                setIsEditModalOpen(false);
                setEditingCategory(null);
                editForm.reset();
                toast.success("แก้ไขหมวดหมู่สำเร็จ");
                await mutate();
            } else {
                toast.error(
                    error.message || "เกิดข้อผิดพลาดในการแก้ไขหมวดหมู่",
                );
            }
        } finally {
            setIsLoading(false);
        }
    };

    const handleDelete = async () => {
        if (!categoryToDelete) return;

        setIsLoading(true);
        try {
            const { error } = await CategoriesService.deleteApiV1CategoriesById(
                {
                    path: { id: categoryToDelete },
                },
            );

            if (!error) {
                setIsDeleteAlertOpen(false);
                setCategoryToDelete(null);
                toast.success("ลบหมวดหมู่สำเร็จ");
                await mutate();
            } else {
                toast.error(error.message || "เกิดข้อผิดพลาดในการลบหมวดหมู่");
            }
        } finally {
            setIsLoading(false);
        }
    };

    const filteredCategories = categories.filter((category) =>
        category.name.toLowerCase().includes(searchTerm.toLowerCase()),
    );

    return (
        <>
            <Card className="mb-6">
                <CardHeader>
                    <div className="flex flex-col items-start justify-between sm:flex-row sm:items-center">
                        <CardTitle className="text-3xl font-bold">
                            จัดการหมวดหมู่
                        </CardTitle>
                        <Button
                            className="mt-4 bg-blue-500 hover:bg-blue-600 sm:mt-0"
                            onClick={() => setIsAddModalOpen(true)}
                        >
                            <Plus className="mr-2 h-4 w-4" /> เพิ่มหมวดหมู่
                        </Button>
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="mb-6">
                        <div className="relative">
                            <Search className="absolute left-2 top-1/2 -translate-y-1/2 transform text-gray-400" />
                            <Input
                                placeholder="ค้นหาหมวดหมู่..."
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
                                            <TableHead>ชื่อหมวดหมู่</TableHead>
                                            <TableHead>วันที่สร้าง</TableHead>
                                            <TableHead>การจัดการ</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {!categories ? (
                                            <TableRow>
                                                <TableCell
                                                    colSpan={3}
                                                    className="py-4 text-center"
                                                >
                                                    <Loader2 className="mx-auto h-6 w-6 animate-spin" />
                                                    <p className="mt-2">
                                                        กำลังโหลดข้อมูล...
                                                    </p>
                                                </TableCell>
                                            </TableRow>
                                        ) : filteredCategories.length === 0 ? (
                                            <TableRow>
                                                <TableCell
                                                    colSpan={3}
                                                    className="py-4 text-center"
                                                >
                                                    ไม่พบข้อมูลหมวดหมู่
                                                </TableCell>
                                            </TableRow>
                                        ) : (
                                            filteredCategories.map(
                                                (category) => (
                                                    <TableRow key={category.id}>
                                                        <TableCell>
                                                            {category.name}
                                                        </TableCell>
                                                        <TableCell>
                                                            <DateDisplay
                                                                dateString={
                                                                    typeof category.createdAt ===
                                                                    "string"
                                                                        ? category.createdAt
                                                                        : ""
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
                                                                        setEditingCategory(
                                                                            category,
                                                                        );
                                                                        editForm.setValue(
                                                                            "name",
                                                                            category.name,
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
                                                                        setCategoryToDelete(
                                                                            category.id,
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
                                                ),
                                            )
                                        )}
                                    </TableBody>
                                </Table>
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Add Category Modal */}
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
                            เพิ่มหมวดหมู่ใหม่
                        </DialogTitle>
                        <DialogDescription>
                            กรอกชื่อหมวดหมู่ที่ต้องการเพิ่ม
                        </DialogDescription>
                    </DialogHeader>
                    <Form {...addForm}>
                        <form
                            onSubmit={addForm.handleSubmit(handleAdd)}
                            className="space-y-4 py-4"
                        >
                            <FormField
                                control={addForm.control}
                                name="name"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>ชื่อหมวดหมู่</FormLabel>
                                        <FormControl>
                                            <Input
                                                placeholder="กรอกชื่อหมวดหมู่"
                                                {...field}
                                            />
                                        </FormControl>
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
                                        "เพิ่ม"
                                    )}
                                </Button>
                            </DialogFooter>
                        </form>
                    </Form>
                </DialogContent>
            </Dialog>

            {/* Edit Category Modal */}
            <Dialog
                open={isEditModalOpen}
                onOpenChange={(open) => {
                    if (!open) {
                        editForm.reset();
                        setEditingCategory(null);
                    }
                    setIsEditModalOpen(open);
                }}
            >
                <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                        <DialogTitle className="text-xl">
                            แก้ไขหมวดหมู่
                        </DialogTitle>
                        <DialogDescription>
                            แก้ไขชื่อหมวดหมู่ที่ต้องการเปลี่ยน
                        </DialogDescription>
                    </DialogHeader>
                    <Form {...editForm}>
                        <form
                            onSubmit={editForm.handleSubmit(handleEdit)}
                            className="space-y-4 py-4"
                        >
                            <div className="space-y-2">
                                <p className="text-sm font-medium text-gray-500">
                                    ชื่อหมวดหมู่เดิม:{" "}
                                    <span className="font-semibold text-black">
                                        {editingCategory?.name}
                                    </span>
                                </p>
                            </div>
                            <FormField
                                control={editForm.control}
                                name="name"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>ชื่อหมวดหมู่ใหม่</FormLabel>
                                        <FormControl>
                                            <Input
                                                placeholder="กรอกชื่อหมวดหมู่ใหม่"
                                                {...field}
                                            />
                                        </FormControl>
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
                                        setEditingCategory(null);
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

            {/* Delete Category Alert */}
            <AlertDialog
                open={isDeleteAlertOpen}
                onOpenChange={setIsDeleteAlertOpen}
            >
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>ยืนยันการลบหมวดหมู่</AlertDialogTitle>
                        <AlertDialogDescription>
                            คุณต้องการลบหมวดหมู่นี้ใช่หรือไม่?
                            การกระทำนี้ไม่สามารถย้อนกลับได้
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel
                            onClick={() => {
                                setIsDeleteAlertOpen(false);
                                setCategoryToDelete(null);
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
                                "ลบ"
                            )}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    );
}
