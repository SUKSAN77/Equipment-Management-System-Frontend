"use client";

// import "@fontsource/sarabun/thai.css";
// import "@fontsource/sarabun/400.css"; // normal weight
// import "@fontsource/sarabun/700.css"; // bold weight

import { zodResolver } from "@hookform/resolvers/zod";
import { format } from "date-fns";
import { debounce } from "lodash";
import { Download, Edit, Plus, Search, Trash2, X } from "lucide-react";
import Image from "next/image";
import pdfMake from "pdfmake/build/pdfmake";
import { memo, useCallback, useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import * as z from "zod";

import { EquipmentsService } from "@/client";
import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
    Dialog,
    DialogContent,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
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
import { useCategories, useEquipments, useRooms } from "@/hooks/api";
import { Equipment, UpdateEquipment } from "@/types/equipments";

const getRoleLabel = (role: number) => {
    const statusNumber = role;
    switch (statusNumber) {
        case 0:
            return "ปกติ";
        case 1:
            return "ชำรุด";
        case 2:
            return "จำหน่าย";
        default:
            return "ไม่ทราบสถานะ";
    }
};

const equipmentCreateSchema = z.object({
    name: z.string().min(1, { message: "กรุณากรอกชื่อครุภัณฑ์" }),
    description: z.string().optional(),
    lifetime: z.union([z.string(), z.number()]),
    price: z.number().min(0),
    status: z.union([z.string(), z.number()]),
    customId: z.string().min(1, { message: "กรุณากรอกรหัสครุภัณฑ์" }),
    acquiredDate: z.union([z.string(), z.number(), z.date()]),
    serialNumber: z.string().optional(),
    acquisitionMethod: z.string(),
    disposalDate: z.union([z.string(), z.number(), z.date()]).optional(),
    notes: z.string().optional(),
    roomId: z.string().optional().nullable(),
    categoryId: z.string().optional().nullable(),
});

const equipmentUpdateSchema = z.object({
    name: z.string().optional(),
    description: z.string().optional(),
    serialNumber: z.string().optional(),
    acquisitionMethod: z.string().optional(),
    disposalDate: z.union([z.string(), z.number(), z.date()]).optional(),
    notes: z.string().optional(),
    roomId: z.string().optional(),
    categoryId: z.string().optional(),
});

type EquipmentCreateValues = z.infer<typeof equipmentCreateSchema>;
type EquipmentUpdateValues = z.infer<typeof equipmentUpdateSchema>;

interface NewEquipment {
    name: string;
    customId: string;
    serialNumber: string;
    status: number;
    price: number;
    acquisitionMethod: string;
    acquiredDate: string;
    notes: string;
    image: File | null;
    receipt: File | null;
    roomId: string;
    categoryId: string;
    description: string;
}

// Update the type definition for UpdateEquipment to include all fields
interface UpdateEquipmentForm extends UpdateEquipment {
    acquiredDate?: string;
    status?: number;
    price?: number;
}

// กำหนดฟอนต์ Sarabun

pdfMake.fonts = {
    THSarabunNew: {
        normal: "THSarabunNew",
        bold: "THSarabunNew",
        italics: "THSarabunNew",
        bolditalics: "THSarabunNew",
    },
};

// Create a separate component for lazy loaded images
const LazyLoadedImage = memo(
    ({
        src,
        alt,
        className,
    }: {
        src: string;
        alt: string;
        className?: string;
    }) => {
        return (
            <div className="relative h-24 w-24">
                <Image
                    src={src}
                    alt={alt}
                    fill
                    sizes="(max-width: 96px) 100vw, 96px"
                    className={`${className} object-contain`}
                    loading="lazy"
                    unoptimized={
                        src.startsWith("data:") || src.startsWith("http")
                    }
                />
            </div>
        );
    },
);
LazyLoadedImage.displayName = "LazyLoadedImage";

// Create a separate component for equipment images
const EquipmentImages = memo(
    ({
        images,
    }: {
        images: Array<{ id: string; filepath: string; filename: string }>;
    }) => {
        return (
            <div className="flex flex-wrap gap-2">
                {images.map((image) => (
                    <a
                        key={image.id}
                        href={`http://localhost:8000/${image.filepath.replace(/\\/g, "/")}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block"
                    >
                        <div className="relative h-24 w-24 overflow-hidden rounded border border-gray-200">
                            <Image
                                src={`http://localhost:8000/${image.filepath.replace(/\\/g, "/")}`}
                                alt={image.filename}
                                fill
                                sizes="(max-width: 96px) 100vw, 96px"
                                className="object-cover"
                                loading="lazy"
                                unoptimized
                            />
                        </div>
                    </a>
                ))}
            </div>
        );
    },
);
EquipmentImages.displayName = "EquipmentImages";

export default function EquipmentManagement() {
    const { equipments, mutate } = useEquipments();
    const { categories } = useCategories();
    const { rooms } = useRooms();

    const [searchTerm, setSearchTerm] = useState("");
    const [filterCategory, setFilterCategory] = useState("");
    const [filterStatus, setFilterStatus] = useState("");
    const [filterRoom, setFilterRoom] = useState("");
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [selectedEquipment, setSelectedEquipment] =
        useState<Equipment | null>(null);
    const [isDetailsDialogOpen, setIsDetailsDialogOpen] = useState(false);
    const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
    const [editingEquipment, setEditingEquipment] = useState<Equipment | null>(
        null,
    );
    const [isLoading, setIsLoading] = useState(false);
    const [isDeleteAlertOpen, setIsDeleteAlertOpen] = useState(false);
    const [equipmentToDelete, setEquipmentToDelete] = useState<string | null>(
        null,
    );
    const [newEquipment, setNewEquipment] = useState<NewEquipment[]>([
        {
            name: "",
            customId: "",
            serialNumber: "",
            status: 0,
            price: 0,
            acquisitionMethod: "",
            acquiredDate: new Date().toISOString().split("T")[0],
            notes: "",
            image: null,
            receipt: null,
            roomId: "",
            categoryId: "",
            description: "",
        },
    ]);
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(10);

    const addForm = useForm<EquipmentCreateValues>({
        resolver: zodResolver(equipmentCreateSchema),
        defaultValues: {
            name: "",
            description: "",
            lifetime: 0,
            price: 0,
            status: 0,
            customId: "",
            acquiredDate: new Date().toISOString(),
            serialNumber: "",
            acquisitionMethod: "",
            notes: "",
            roomId: "",
            categoryId: "",
        },
    });

    const editForm = useForm<EquipmentUpdateValues>({
        resolver: zodResolver(equipmentUpdateSchema),
    });

    const handleCloseDialog = () => {
        setIsDialogOpen(false);
        addForm.reset();
    };

    const handleShowDetails = useCallback((equipment: Equipment) => {
        setSelectedEquipment(equipment);
        setIsDetailsDialogOpen(true);
    }, []);

    const handleEditEquipment = useCallback(
        (equipment: Equipment) => {
            setEditingEquipment(equipment);
            editForm.reset({
                name: equipment.name,
                description: equipment.description || undefined,
                serialNumber: equipment.serialNumber || undefined,
                acquisitionMethod: equipment.acquisitionMethod,
                notes: equipment.notes || undefined,
                roomId: equipment.roomId || undefined,
                categoryId: equipment.categoryId || undefined,
            });
            setIsEditDialogOpen(true);
        },
        [editForm],
    );

    const handleEditChange = useCallback(
        (field: keyof UpdateEquipmentForm, value: string | number | null) => {
            if (!editingEquipment) return;

            setEditingEquipment((prev) => {
                if (!prev) return null;
                return {
                    ...prev,
                    [field]: value,
                };
            });
        },
        [editingEquipment],
    );

    const handleSaveEdit = async () => {
        if (!editingEquipment) return;

        setIsLoading(true);
        try {
            const editPayload: UpdateEquipment = {};
            const fields: (keyof UpdateEquipment)[] = [
                "name",
                "description",
                "serialNumber",
                "acquisitionMethod",
                "notes",
                "roomId",
                "categoryId",
            ];

            fields.forEach((field) => {
                const value = editingEquipment[field as keyof Equipment];
                if (value !== undefined && value !== null) {
                    editPayload[field] = value.toString();
                }
            });

            if (Object.keys(editPayload).length > 0) {
                const { error } =
                    await EquipmentsService.patchApiV1EquipmentsById({
                        path: { id: editingEquipment.id },
                        body: editPayload,
                    });

                if (error) {
                    throw new Error(error.message);
                }
            }

            setIsEditDialogOpen(false);
            setEditingEquipment(null);
            editForm.reset();
            toast.success("แก้ไขครุภัณฑ์สำเร็จ");
            await mutate();
        } catch (error) {
            if (error instanceof Error) {
                toast.error(error.message);
            } else {
                toast.error("เกิดข้อผิดพลาดในการแก้ไขครุภัณฑ์");
                console.error(error);
            }
        } finally {
            setIsLoading(false);
        }
    };

    const handleNewEquipmentChange = useCallback(
        (
            index: number,
            field: keyof NewEquipment,
            value: string | number | File | null,
        ) => {
            setNewEquipment((prev) => {
                const updated = [...prev];
                updated[index] = {
                    ...updated[index],
                    [field]: value,
                };
                return updated;
            });
        },
        [],
    );

    const handleAddNewEquipmentField = () => {
        setNewEquipment((prev) => [
            ...prev,
            {
                name: "",
                customId: "",
                serialNumber: "",
                status: 0,
                price: 0,
                acquisitionMethod: "",
                acquiredDate: new Date().toISOString().split("T")[0],
                notes: "",
                image: null,
                receipt: null,
                roomId: "",
                categoryId: "",
                description: "",
            },
        ]);
    };

    const handleRemoveEquipment = (index: number) => {
        setNewEquipment((prev) => prev.filter((_, i) => i !== index));
    };

    // เพิ่มฟังก์ชันตรวจสอบความซ้ำซ้อน
    const checkDuplicates = (equipments: NewEquipment[]) => {
        const duplicates = {
            serialNumbers: new Map<string, number[]>(), // เก็บ index ของรายการที่ซ้ำ
            customIds: new Map<string, number[]>(), // เก็บ index ของรายการที่ซ้ำ
            duplicateSerialNumbers: new Set<string>(),
            duplicateCustomIds: new Set<string>(),
        };

        // ตรวจสอบและเก็บ index ของรายการที่ซ้ำ
        equipments.forEach((equipment, index) => {
            if (equipment.serialNumber) {
                const indices =
                    duplicates.serialNumbers.get(equipment.serialNumber) || [];
                indices.push(index);
                duplicates.serialNumbers.set(equipment.serialNumber, indices);
                if (indices.length > 1) {
                    duplicates.duplicateSerialNumbers.add(
                        equipment.serialNumber,
                    );
                }
            }
            if (equipment.customId) {
                const indices =
                    duplicates.customIds.get(equipment.customId) || [];
                indices.push(index);
                duplicates.customIds.set(equipment.customId, indices);
                if (indices.length > 1) {
                    duplicates.duplicateCustomIds.add(equipment.customId);
                }
            }
        });

        return {
            hasDuplicates:
                duplicates.duplicateSerialNumbers.size > 0 ||
                duplicates.duplicateCustomIds.size > 0,
            duplicateSerialNumbers: Array.from(
                duplicates.duplicateSerialNumbers,
            ),
            duplicateCustomIds: Array.from(duplicates.duplicateCustomIds),
            // เพิ่มการส่งคืนข้อมูล index ที่ซ้ำ
            serialNumberIndices: duplicates.serialNumbers,
            customIdIndices: duplicates.customIds,
        };
    };

    const handleSaveEquipment = async () => {
        setIsLoading(true);
        try {
            // ตรวจสอบความซ้ำซ้อนในรายการที่จะเพิ่ม
            const {
                hasDuplicates,
                duplicateSerialNumbers,
                duplicateCustomIds,
            } = checkDuplicates(newEquipment);

            if (hasDuplicates) {
                let errorMessage = "พบข้อมูลซ้ำในรายการที่จะเพิ่ม:\n";
                if (duplicateSerialNumbers.length > 0) {
                    errorMessage += `Serial Number ที่ซ้ำ: ${duplicateSerialNumbers.join(", ")}\n`;
                }
                if (duplicateCustomIds.length > 0) {
                    errorMessage += `รหัสครุภัณฑ์ที่ซ้ำ: ${duplicateCustomIds.join(", ")}`;
                }
                toast.error(errorMessage);
                setIsLoading(false);
                return;
            }

            // ตรวจสอบความซ้ำซ้อนกับฐานข้อมูลทีละรายการ
            for (const equipment of newEquipment) {
                // ตรวจสอบ Serial Number
                if (equipment.serialNumber) {
                    const { data: serialCheckResponse } =
                        await EquipmentsService.getApiV1Equipments({
                            query: {
                                limit: 1000,
                                offset: 0,
                            },
                        });
                    const serialCheck = serialCheckResponse?.data;
                    if (
                        serialCheck?.some(
                            (eq) => eq.serialNumber === equipment.serialNumber,
                        )
                    ) {
                        toast.error(
                            `Serial Number "${equipment.serialNumber}" มีอยู่ในระบบแล้ว`,
                        );
                        setIsLoading(false);
                        return;
                    }
                }

                // ตรวจสอบ Custom ID
                if (equipment.customId) {
                    const { data: customIdCheckResponse } =
                        await EquipmentsService.getApiV1Equipments({
                            query: {
                                limit: 1000,
                                offset: 0,
                            },
                        });
                    const customIdCheck = customIdCheckResponse?.data;
                    if (
                        customIdCheck?.some(
                            (eq) => eq.customId === equipment.customId,
                        )
                    ) {
                        toast.error(
                            `รหัสครุภัณฑ์ "${equipment.customId}" มีอยู่ในระบบแล้ว`,
                        );
                        setIsLoading(false);
                        return;
                    }
                }
            }

            // ถ้าไม่มีการซ้ำกัน ดำเนินการบันทึก
            for (const equipment of newEquipment) {
                const requestBody = {
                    name: equipment.name,
                    description: equipment.description || "",
                    lifetime: 0,
                    price: Number(equipment.price),
                    status: Number(equipment.status),
                    customId: equipment.customId,
                    acquiredDate: equipment.acquiredDate,
                    serialNumber: equipment.serialNumber || "",
                    acquisitionMethod: equipment.acquisitionMethod,
                    notes: equipment.notes || "",
                    roomId: equipment.roomId || undefined,
                    categoryId: equipment.categoryId || undefined,
                };

                const { data, error } =
                    await EquipmentsService.postApiV1Equipments({
                        body: requestBody,
                    });

                if (error) {
                    throw new Error(error.message);
                }

                // อัพโหลดรูปภาพครุภัณฑ์
                if (data && equipment.image) {
                    const form = new FormData();
                    form.append("file", equipment.image);
                    const response = await fetch(
                        `http://localhost:8000/api/v1/equipments/${data.id}/images`,
                        {
                            method: "POST",
                            body: form,
                            credentials: "include",
                        },
                    );
                    const imageError = await response.json();
                    if (!response.ok) {
                        toast.error("ไม่สามารถอัพโหลดรูปภาพครุภัณฑ์ได้");
                        console.error(
                            "Image upload error:",
                            imageError?.message,
                        );
                    }
                }

                // อัพโหลดรูปภาพใบเสร็จ
                if (data && equipment.receipt) {
                    const form = new FormData();
                    form.append("file", equipment.receipt);

                    const response = await fetch(
                        `http://localhost:8000/api/v1/equipments/${data.id}/receipt`,
                        {
                            method: "POST",
                            body: form,
                            credentials: "include",
                        },
                    );
                    const receiptError = await response.json();
                    if (!response.ok) {
                        toast.error("ไม่สามารถอัพโหลดรูปภาพใบเสร็จได้");
                        console.error(
                            "Receipt upload error:",
                            receiptError?.message,
                        );
                    }
                }
            }

            setIsDialogOpen(false);
            setNewEquipment([
                {
                    name: "",
                    customId: "",
                    serialNumber: "",
                    status: 0,
                    price: 0,
                    acquisitionMethod: "",
                    acquiredDate: new Date().toISOString().split("T")[0],
                    notes: "",
                    image: null,
                    receipt: null,
                    roomId: "",
                    categoryId: "",
                    description: "",
                },
            ]);
            toast.success("เพิ่มครุภัณฑ์สำเร็จ");
            await mutate();
        } catch (error) {
            if (error instanceof Error) {
                toast.error(error.message);
            } else {
                toast.error("เกิดข้อผิดพลาดในการเพิ่มครุภัณฑ์");
                console.error(error);
            }
        } finally {
            setIsLoading(false);
        }
    };

    const handleDelete = async () => {
        if (!equipmentToDelete) return;

        setIsLoading(true);
        try {
            const { error } = await EquipmentsService.deleteApiV1EquipmentsById(
                {
                    path: { id: equipmentToDelete },
                },
            );

            if (error) {
                throw new Error(
                    error.message || "เกิดข้อผิดพลาดในการลบครุภัณฑ์",
                );
            }

            setIsDeleteAlertOpen(false);
            setEquipmentToDelete(null);
            toast.success("ลบครุภัณฑ์สำเร็จ");
            await mutate();
        } catch (error) {
            if (error instanceof Error) {
                toast.error(error.message);
            } else {
                toast.error("เกิดข้อผิดพลาดในการลบครุภัณฑ์");
                console.error(error);
            }
        } finally {
            setIsLoading(false);
        }
    };

    // Memoize filtered equipments
    const filteredEquipments = useMemo(() => {
        return equipments.filter((item) => {
            const matchesSearch =
                item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                (item.customId &&
                    item.customId
                        .toLowerCase()
                        .includes(searchTerm.toLowerCase()));

            const matchesCategory =
                filterCategory === "" ||
                filterCategory === "all" ||
                item.categoryId === filterCategory;

            const matchesStatus =
                filterStatus === "" ||
                filterStatus === "all" ||
                item.status.toString() === filterStatus;

            const matchesRoom =
                filterRoom === "" ||
                filterRoom === "all" ||
                item.roomId === filterRoom;

            return (
                matchesSearch && matchesCategory && matchesStatus && matchesRoom
            );
        });
    }, [equipments, searchTerm, filterCategory, filterStatus, filterRoom]);

    // Memoize total pages
    const totalPages = useMemo(() => {
        return Math.ceil(filteredEquipments.length / itemsPerPage);
    }, [filteredEquipments.length, itemsPerPage]);

    // Memoize paginated equipments with proper pagination calculation
    const { startIndex, endIndex, paginatedEquipments } = useMemo(() => {
        const start = (currentPage - 1) * itemsPerPage;
        const end = start + itemsPerPage;
        return {
            startIndex: start,
            endIndex: end,
            paginatedEquipments: filteredEquipments.slice(start, end),
        };
    }, [filteredEquipments, currentPage, itemsPerPage]);

    // Memoize helper functions
    const getCategoryName = useCallback(
        (categoryId: string | null) => {
            if (!categoryId) return "-";
            const category = categories.find((c) => c.id === categoryId);
            return category ? category.name : categoryId;
        },
        [categories],
    );

    const getRoomNumber = useCallback(
        (roomId: string | null) => {
            if (!roomId) return "-";
            const room = rooms.find((r) => r.id === roomId);
            return room ? `ห้อง ${room.roomNumber}` : roomId;
        },
        [rooms],
    );

    // Reset to first page when filters change
    useEffect(() => {
        setCurrentPage(1);
    }, [searchTerm, filterCategory, filterStatus, filterRoom]);

    // Add debounced search
    const debouncedSetSearchTerm = useCallback(
        (value: string) => {
            debounce(() => setSearchTerm(value), 300)();
        },
        [setSearchTerm],
    );

    // Replace image observer with LazyLoadedImage component
    const imageSection = useMemo(() => {
        if (!selectedEquipment?.images?.length) {
            return <span className="text-gray-500">ไม่มีรูปภาพ</span>;
        }
        return <EquipmentImages images={selectedEquipment.images} />;
    }, [selectedEquipment?.images]);

    // Optimize PDF generation
    const generatePDF = useCallback(async () => {
        const worker = new Worker(
            new URL("../workers/pdfWorker.ts", import.meta.url),
        );
        worker.postMessage({
            equipments: paginatedEquipments,
            categories,
            rooms,
        });

        worker.onmessage = (e) => {
            const { pdfBlob } = e.data;
            const url = URL.createObjectURL(pdfBlob);
            const a = document.createElement("a");
            a.href = url;
            a.download = `รายงานครุภัณฑ์_${format(new Date(), "dd-MM-yyyy")}.pdf`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        };
    }, [paginatedEquipments, categories, rooms]);

    // Add optimized search input
    const SearchInput = useMemo(() => {
        return (
            <div className="relative">
                <Search className="absolute left-2 top-1/2 -translate-y-1/2 transform text-gray-400" />
                <Input
                    placeholder="ค้นหาครุภัณฑ์..."
                    onChange={(e) => debouncedSetSearchTerm(e.target.value)}
                    className="pl-8"
                />
            </div>
        );
    }, [debouncedSetSearchTerm]);

    // Add optimized filters
    const Filters = useMemo(() => {
        return (
            <div className="flex flex-col space-y-2 sm:flex-row sm:space-x-4 sm:space-y-0">
                <Select
                    value={filterCategory}
                    onValueChange={setFilterCategory}
                >
                    <SelectTrigger>
                        <SelectValue placeholder="ประเภทครุภัณฑ์" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">ทั้งหมด</SelectItem>
                        {categories.map((category) => (
                            <SelectItem key={category.id} value={category.id}>
                                {category.name}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
                <Select value={filterRoom} onValueChange={setFilterRoom}>
                    <SelectTrigger>
                        <SelectValue placeholder="ห้อง" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">ทั้งหมด</SelectItem>
                        {rooms.map((room) => (
                            <SelectItem key={room.id} value={room.id}>
                                ห้อง {room.roomNumber}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
                <Select value={filterStatus} onValueChange={setFilterStatus}>
                    <SelectTrigger className="w-full sm:w-[180px]">
                        <SelectValue placeholder="สถานะ" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">ทั้งหมด</SelectItem>
                        <SelectItem value="0">ปกติ</SelectItem>
                        <SelectItem value="1">ชำรุด</SelectItem>
                        <SelectItem value="2">จำหน่าย</SelectItem>
                    </SelectContent>
                </Select>
            </div>
        );
    }, [filterCategory, categories, filterRoom, rooms, filterStatus]);

    // Add back the handleCopyPreviousData function
    const handleCopyPreviousData = useCallback(
        (index: number) => {
            if (index === 0 || !newEquipment[index - 1]) return;

            setNewEquipment((prev) => {
                const updated = [...prev];
                updated[index] = {
                    ...prev[index - 1],
                    image: prev[index].image, // Keep original image
                    receipt: prev[index].receipt, // Keep original receipt
                };
                return updated;
            });
        },
        [newEquipment],
    );

    return (
        <div className="space-y-6">
            <Card className="mb-6">
                <CardHeader>
                    <div className="flex flex-col items-start justify-between sm:flex-row sm:items-center">
                        <CardTitle className="text-3xl font-bold">
                            จัดการครุภัณฑ์
                        </CardTitle>
                        <div className="flex space-x-2">
                            <Button
                                variant="outline"
                                onClick={generatePDF}
                                className="bg-green-500 text-white hover:bg-green-600"
                            >
                                <Download className="mr-2 h-4 w-4" />{" "}
                                พิมพ์รายงาน
                            </Button>
                            <Button
                                onClick={() => setIsDialogOpen(true)}
                                className="bg-blue-500 hover:bg-blue-600"
                            >
                                <Plus className="mr-2 h-4 w-4" /> เพิ่มครุภัณฑ์
                            </Button>
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="mb-6 flex flex-col space-y-4">
                        {SearchInput}
                        {Filters}
                    </div>

                    <div className="-mx-4 overflow-x-auto sm:mx-0">
                        <div className="inline-block min-w-full align-middle">
                            <div
                                className="overflow-hidden rounded-lg border border-gray-200"
                                style={{
                                    height: "600px",
                                    position: "relative",
                                }}
                            >
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>รหัสครุภัณฑ์</TableHead>
                                            <TableHead>ชื่อครุภัณฑ์</TableHead>
                                            <TableHead>สถานะ</TableHead>
                                            <TableHead>ราคา</TableHead>
                                            <TableHead>วันที่ได้มา</TableHead>
                                            <TableHead>หมวดหมู่</TableHead>
                                            <TableHead>ห้อง</TableHead>
                                            <TableHead>ผู้เพิ่ม</TableHead>
                                            <TableHead>การจัดการ</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {paginatedEquipments.length === 0 ? (
                                            <TableRow>
                                                <TableCell
                                                    colSpan={9}
                                                    className="py-4 text-center"
                                                >
                                                    <p className="text-gray-500">
                                                        ไม่พบครุภัณฑ์ที่ตรงกับเงื่อนไขที่กำหนด
                                                    </p>
                                                </TableCell>
                                            </TableRow>
                                        ) : (
                                            paginatedEquipments.map(
                                                (equipment) => (
                                                    <TableRow
                                                        key={equipment.id}
                                                    >
                                                        <TableCell>
                                                            {equipment.customId ||
                                                                "NULL"}
                                                        </TableCell>
                                                        <TableCell>
                                                            <button
                                                                onClick={() =>
                                                                    handleShowDetails(
                                                                        equipment,
                                                                    )
                                                                }
                                                                className="text-left hover:text-blue-600 hover:underline"
                                                            >
                                                                {equipment.name}
                                                            </button>
                                                        </TableCell>
                                                        <TableCell>
                                                            {getRoleLabel(
                                                                equipment.status,
                                                            )}
                                                        </TableCell>
                                                        <TableCell>
                                                            {Number(
                                                                equipment.price,
                                                            ).toLocaleString()}{" "}
                                                            บาท
                                                        </TableCell>
                                                        <TableCell>
                                                            {new Date(
                                                                String(
                                                                    equipment.acquiredDate,
                                                                ),
                                                            ).toLocaleDateString(
                                                                "th-TH",
                                                            )}
                                                        </TableCell>
                                                        <TableCell>
                                                            {getCategoryName(
                                                                equipment.categoryId,
                                                            )}
                                                        </TableCell>
                                                        <TableCell>
                                                            {getRoomNumber(
                                                                equipment.roomId,
                                                            )}
                                                        </TableCell>
                                                        <TableCell>
                                                            {equipment.creator
                                                                ?.firstName ||
                                                                "ไม่ทราบ"}
                                                        </TableCell>
                                                        <TableCell>
                                                            <div className="flex gap-2">
                                                                <Button
                                                                    variant="outline"
                                                                    size="sm"
                                                                    className="flex items-center gap-1"
                                                                    onClick={() =>
                                                                        handleEditEquipment(
                                                                            equipment,
                                                                        )
                                                                    }
                                                                >
                                                                    <Edit className="h-4 w-4" />{" "}
                                                                    แก้ไข
                                                                </Button>
                                                                <Button
                                                                    variant="destructive"
                                                                    size="sm"
                                                                    className="flex items-center gap-1"
                                                                    onClick={() => {
                                                                        setEquipmentToDelete(
                                                                            equipment.id,
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

                    <div className="flex items-center justify-between border-t border-gray-200 px-4 py-3 sm:px-6">
                        <div className="flex flex-1 justify-between sm:hidden">
                            <Button
                                variant="outline"
                                onClick={() =>
                                    setCurrentPage((prev) =>
                                        Math.max(prev - 1, 1),
                                    )
                                }
                                disabled={currentPage === 1}
                            >
                                ก่อนหน้า
                            </Button>
                            <Button
                                variant="outline"
                                onClick={() =>
                                    setCurrentPage((prev) =>
                                        Math.min(prev + 1, totalPages),
                                    )
                                }
                                disabled={currentPage === totalPages}
                            >
                                ถัดไป
                            </Button>
                        </div>
                        <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
                            <div className="flex items-center gap-4">
                                <p className="text-sm text-gray-700">
                                    แสดง{" "}
                                    <span className="font-medium">
                                        {startIndex + 1}
                                    </span>{" "}
                                    ถึง{" "}
                                    <span className="font-medium">
                                        {endIndex}
                                    </span>{" "}
                                    จากทั้งหมด{" "}
                                    <span className="font-medium">
                                        {filteredEquipments.length}
                                    </span>{" "}
                                    รายการ
                                </p>
                                <div className="flex items-center gap-2">
                                    <span className="text-sm text-gray-700">
                                        แสดง:
                                    </span>
                                    <Select
                                        value={String(itemsPerPage)}
                                        onValueChange={(value) =>
                                            setItemsPerPage(Number(value))
                                        }
                                    >
                                        <SelectTrigger className="h-8 w-[70px]">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="10">
                                                10
                                            </SelectItem>
                                            <SelectItem value="50">
                                                50
                                            </SelectItem>
                                            <SelectItem value="100">
                                                100
                                            </SelectItem>
                                        </SelectContent>
                                    </Select>
                                    <span className="text-sm text-gray-700">
                                        รายการต่อหน้า
                                    </span>
                                </div>
                            </div>
                            <div>
                                <nav
                                    className="isolate inline-flex -space-x-px rounded-md shadow-sm"
                                    aria-label="Pagination"
                                >
                                    <Button
                                        variant="outline"
                                        className="rounded-l-md"
                                        onClick={() =>
                                            setCurrentPage((prev) =>
                                                Math.max(prev - 1, 1),
                                            )
                                        }
                                        disabled={currentPage === 1}
                                    >
                                        ก่อนหน้า
                                    </Button>
                                    {[...Array(totalPages)].map((_, index) => {
                                        const pageNumber = index + 1;
                                        return (
                                            <Button
                                                key={pageNumber}
                                                variant={
                                                    currentPage === pageNumber
                                                        ? "default"
                                                        : "outline"
                                                }
                                                onClick={() =>
                                                    setCurrentPage(pageNumber)
                                                }
                                                className={`${currentPage === pageNumber ? "bg-blue-600 text-white hover:bg-blue-700" : "hover:bg-gray-50"} px-4 py-2`}
                                            >
                                                {pageNumber}
                                            </Button>
                                        );
                                    })}
                                    <Button
                                        variant="outline"
                                        className="rounded-r-md"
                                        onClick={() =>
                                            setCurrentPage((prev) =>
                                                Math.min(prev + 1, totalPages),
                                            )
                                        }
                                        disabled={currentPage === totalPages}
                                    >
                                        ถัดไป
                                    </Button>
                                </nav>
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>

            <Dialog open={isDialogOpen} onOpenChange={handleCloseDialog}>
                <DialogContent className="max-h-[80vh] overflow-y-auto sm:max-w-[600px]">
                    <DialogHeader>
                        <DialogTitle className="text-xl font-semibold">
                            เพิ่มครุภัณฑ์
                        </DialogTitle>
                    </DialogHeader>

                    <div className="space-y-4">
                        <Accordion
                            type="single"
                            collapsible
                            className="space-y-4"
                        >
                            {newEquipment.map((item, index) => (
                                <AccordionItem
                                    key={index}
                                    value={`item-${index}`}
                                >
                                    <AccordionTrigger className="rounded-lg px-4 py-2 hover:bg-gray-50/50">
                                        <div className="flex w-full items-center justify-between">
                                            <span>
                                                {item.name ||
                                                    `ครุภัณฑ์ ${index + 1}`}
                                            </span>
                                            <div
                                                className="flex items-center gap-2"
                                                onClick={(e) =>
                                                    e.stopPropagation()
                                                }
                                            >
                                                {index > 0 && (
                                                    <div
                                                        className="flex h-8 cursor-pointer items-center rounded px-2 text-sm hover:bg-blue-100 hover:text-blue-600"
                                                        onClick={() =>
                                                            handleCopyPreviousData(
                                                                index,
                                                            )
                                                        }
                                                    >
                                                        ดึงข้อมูลก่อนหน้า
                                                    </div>
                                                )}
                                                {newEquipment.length > 1 && (
                                                    <div
                                                        className="flex h-8 w-8 cursor-pointer items-center justify-center rounded p-0 hover:bg-red-100 hover:text-red-600"
                                                        onClick={() =>
                                                            handleRemoveEquipment(
                                                                index,
                                                            )
                                                        }
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </AccordionTrigger>
                                    <AccordionContent className="space-y-4 p-4">
                                        <div className="grid gap-4">
                                            <div className="space-y-2">
                                                <label className="text-sm font-medium">
                                                    ชื่อครุภัณฑ์
                                                </label>
                                                <Input
                                                    value={item.name}
                                                    onChange={(e) =>
                                                        handleNewEquipmentChange(
                                                            index,
                                                            "name",
                                                            e.target.value,
                                                        )
                                                    }
                                                    placeholder="ชื่อครุภัณฑ์"
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <label className="text-sm font-medium">
                                                    รายละเอียด
                                                </label>
                                                <Input
                                                    value={item.description}
                                                    onChange={(e) =>
                                                        handleNewEquipmentChange(
                                                            index,
                                                            "description",
                                                            e.target.value,
                                                        )
                                                    }
                                                    placeholder="รายละเอียดครุภัณฑ์"
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <label className="text-sm font-medium">
                                                    รหัสครุภัณฑ์
                                                </label>
                                                <Input
                                                    value={item.customId}
                                                    onChange={(e) =>
                                                        handleNewEquipmentChange(
                                                            index,
                                                            "customId",
                                                            e.target.value,
                                                        )
                                                    }
                                                    placeholder="รหัสครุภัณฑ์"
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <label className="text-sm font-medium">
                                                    Serial Number
                                                </label>
                                                <Input
                                                    value={item.serialNumber}
                                                    onChange={(e) =>
                                                        handleNewEquipmentChange(
                                                            index,
                                                            "serialNumber",
                                                            e.target.value,
                                                        )
                                                    }
                                                    placeholder="Serial Number"
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <label className="text-sm font-medium">
                                                    สถานะ
                                                </label>
                                                <Select
                                                    value={`${item.status}`}
                                                    onValueChange={(value) =>
                                                        handleNewEquipmentChange(
                                                            index,
                                                            "status",
                                                            value,
                                                        )
                                                    }
                                                >
                                                    <SelectTrigger>
                                                        <SelectValue placeholder="เลือกสถานะ" />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="0">
                                                            ปกติ
                                                        </SelectItem>
                                                        <SelectItem value="1">
                                                            ชำรุด
                                                        </SelectItem>
                                                        <SelectItem value="2">
                                                            จำหน่าย
                                                        </SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                            <div className="space-y-2">
                                                <label className="text-sm font-medium">
                                                    ราคา
                                                </label>
                                                <Input
                                                    type="number"
                                                    value={item.price}
                                                    onChange={(e) =>
                                                        handleNewEquipmentChange(
                                                            index,
                                                            "price",
                                                            e.target.value,
                                                        )
                                                    }
                                                    placeholder="ราคา"
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <label className="text-sm font-medium">
                                                    วิธีการได้มา
                                                </label>
                                                <Input
                                                    value={
                                                        item.acquisitionMethod
                                                    }
                                                    onChange={(e) =>
                                                        handleNewEquipmentChange(
                                                            index,
                                                            "acquisitionMethod",
                                                            e.target.value,
                                                        )
                                                    }
                                                    placeholder="วิธีการได้มา"
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <label className="text-sm font-medium">
                                                    วันที่ได้รับ
                                                </label>
                                                <Input
                                                    type="date"
                                                    value={item.acquiredDate}
                                                    onChange={(e) =>
                                                        handleNewEquipmentChange(
                                                            index,
                                                            "acquiredDate",
                                                            e.target.value,
                                                        )
                                                    }
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <label className="text-sm font-medium">
                                                    หมายเหตุ
                                                </label>
                                                <Input
                                                    value={item.notes}
                                                    onChange={(e) =>
                                                        handleNewEquipmentChange(
                                                            index,
                                                            "notes",
                                                            e.target.value,
                                                        )
                                                    }
                                                    placeholder="หมายเหตุ"
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <label className="text-sm font-medium">
                                                    ห้อง
                                                </label>
                                                <Select
                                                    value={
                                                        item.roomId || "none"
                                                    }
                                                    onValueChange={(value) =>
                                                        handleNewEquipmentChange(
                                                            index,
                                                            "roomId",
                                                            value === "none"
                                                                ? ""
                                                                : value,
                                                        )
                                                    }
                                                >
                                                    <SelectTrigger>
                                                        <SelectValue placeholder="เลือกห้อง" />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="none">
                                                            ไม่ระบุห้อง
                                                        </SelectItem>
                                                        {rooms.map((room) => (
                                                            <SelectItem
                                                                key={room.id}
                                                                value={room.id}
                                                            >
                                                                ห้อง{" "}
                                                                {
                                                                    room.roomNumber
                                                                }
                                                            </SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                            <div className="space-y-2">
                                                <label className="text-sm font-medium">
                                                    หมวดหมู่
                                                </label>
                                                <Select
                                                    value={
                                                        item.categoryId ||
                                                        "none"
                                                    }
                                                    onValueChange={(value) =>
                                                        handleNewEquipmentChange(
                                                            index,
                                                            "categoryId",
                                                            value === "none"
                                                                ? ""
                                                                : value,
                                                        )
                                                    }
                                                >
                                                    <SelectTrigger>
                                                        <SelectValue placeholder="เลือกหมวดหมู่" />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="none">
                                                            ไม่ระบุหมวดหมู่
                                                        </SelectItem>
                                                        {categories.map(
                                                            (category) => (
                                                                <SelectItem
                                                                    key={
                                                                        category.id
                                                                    }
                                                                    value={
                                                                        category.id
                                                                    }
                                                                >
                                                                    {
                                                                        category.name
                                                                    }
                                                                </SelectItem>
                                                            ),
                                                        )}
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                            <div className="space-y-2">
                                                <label className="text-sm font-medium">
                                                    รูปภาพครุภัณฑ์
                                                </label>
                                                <div className="flex items-center gap-4">
                                                    <Input
                                                        type="file"
                                                        accept="image/*"
                                                        onChange={(e) => {
                                                            const file =
                                                                e.target
                                                                    .files?.[0];
                                                            handleNewEquipmentChange(
                                                                index,
                                                                "image",
                                                                file || null,
                                                            );
                                                        }}
                                                        className="flex-1"
                                                    />
                                                    {item.image && (
                                                        <div className="relative h-20 w-20">
                                                            <Image
                                                                src={URL.createObjectURL(
                                                                    item.image,
                                                                )}
                                                                alt="Equipment preview"
                                                                fill
                                                                className="rounded-md object-cover"
                                                            />
                                                            <Button
                                                                variant="ghost"
                                                                size="sm"
                                                                className="absolute -right-2 -top-2 z-10 h-6 w-6 rounded-full p-0"
                                                                onClick={() =>
                                                                    handleNewEquipmentChange(
                                                                        index,
                                                                        "image",
                                                                        null,
                                                                    )
                                                                }
                                                            >
                                                                <X className="h-4 w-4" />
                                                            </Button>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                            <div className="space-y-2">
                                                <label className="text-sm font-medium">
                                                    รูปภาพใบเสร็จ
                                                </label>
                                                <div className="flex items-center gap-4">
                                                    <Input
                                                        type="file"
                                                        accept="image/*"
                                                        onChange={(e) => {
                                                            const file =
                                                                e.target
                                                                    .files?.[0];
                                                            handleNewEquipmentChange(
                                                                index,
                                                                "receipt",
                                                                file || null,
                                                            );
                                                        }}
                                                        className="flex-1"
                                                    />
                                                    {item.receipt && (
                                                        <div className="relative h-20 w-20">
                                                            <Image
                                                                src={URL.createObjectURL(
                                                                    item.receipt,
                                                                )}
                                                                alt="Receipt preview"
                                                                fill
                                                                className="rounded-md object-cover"
                                                            />
                                                            <Button
                                                                variant="ghost"
                                                                size="sm"
                                                                className="absolute -right-2 -top-2 z-10 h-6 w-6 rounded-full p-0"
                                                                onClick={() =>
                                                                    handleNewEquipmentChange(
                                                                        index,
                                                                        "receipt",
                                                                        null,
                                                                    )
                                                                }
                                                            >
                                                                <X className="h-4 w-4" />
                                                            </Button>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </AccordionContent>
                                </AccordionItem>
                            ))}
                        </Accordion>

                        <Button
                            variant="outline"
                            onClick={handleAddNewEquipmentField}
                            className="mt-4 w-full"
                        >
                            <Plus className="mr-2 h-4 w-4" /> เพิ่มรายการใหม่
                        </Button>
                    </div>

                    <DialogFooter className="mt-6">
                        <Button variant="outline" onClick={handleCloseDialog}>
                            ยกเลิก
                        </Button>
                        <Button
                            onClick={handleSaveEquipment}
                            className="bg-blue-500 hover:bg-blue-600"
                            disabled={isLoading}
                        >
                            {isLoading ? "กำลังบันทึก..." : "บันทึก"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {selectedEquipment && (
                <Dialog
                    open={isDetailsDialogOpen}
                    onOpenChange={setIsDetailsDialogOpen}
                >
                    <DialogContent className="sm:max-w-[600px]">
                        <DialogHeader>
                            <DialogTitle className="text-xl font-semibold">
                                รายละเอียดครุภัณฑ์
                            </DialogTitle>
                        </DialogHeader>
                        <div className="grid gap-4 py-4">
                            <div className="grid grid-cols-4 items-center gap-4">
                                <span className="font-medium">
                                    รหัสครุภัณฑ์:
                                </span>
                                <span className="col-span-3">
                                    {selectedEquipment.customId}
                                </span>
                            </div>
                            <div className="grid grid-cols-4 items-center gap-4">
                                <span className="font-medium">
                                    ชื่อครุภัณฑ์:
                                </span>
                                <span className="col-span-3">
                                    {selectedEquipment.name}
                                </span>
                            </div>
                            <div className="grid grid-cols-4 items-center gap-4">
                                <span className="font-medium">รายละเอียด:</span>
                                <span className="col-span-3">
                                    {selectedEquipment.description}
                                </span>
                            </div>
                            <div className="grid grid-cols-4 items-center gap-4">
                                <span className="font-medium">
                                    Serial Number:
                                </span>
                                <span className="col-span-3">
                                    {selectedEquipment.serialNumber}
                                </span>
                            </div>
                            <div className="grid grid-cols-4 items-center gap-4">
                                <span className="font-medium">สถานะ:</span>
                                <span className="col-span-3">
                                    {getRoleLabel(selectedEquipment.status)}
                                </span>
                            </div>
                            <div className="grid grid-cols-4 items-center gap-4">
                                <span className="font-medium">ราคา:</span>
                                <span className="col-span-3">
                                    {(
                                        selectedEquipment.price as number
                                    ).toLocaleString()}{" "}
                                    บาท
                                </span>
                            </div>
                            <div className="grid grid-cols-4 items-center gap-4">
                                <span className="font-medium">
                                    อายุการใช้งาน:
                                </span>
                                <span className="col-span-3">
                                    {selectedEquipment.lifetime} ปี
                                </span>
                            </div>
                            <div className="grid grid-cols-4 items-center gap-4">
                                <span className="font-medium">
                                    วิธีการได้มา:
                                </span>
                                <span className="col-span-3">
                                    {selectedEquipment.acquisitionMethod}
                                </span>
                            </div>
                            <div className="grid grid-cols-4 items-center gap-4">
                                <span className="font-medium">
                                    วันที่ได้รับ:
                                </span>
                                <span className="col-span-3">
                                    {new Date(
                                        String(selectedEquipment.acquiredDate),
                                    ).toLocaleDateString("th-TH")}
                                </span>
                            </div>
                            <div className="grid grid-cols-4 items-center gap-4">
                                <span className="font-medium">ห้อง:</span>
                                <span className="col-span-3">
                                    {getRoomNumber(selectedEquipment.roomId)}
                                </span>
                            </div>
                            <div className="grid grid-cols-4 items-center gap-4">
                                <span className="font-medium">หมวดหมู่:</span>
                                <span className="col-span-3">
                                    {getCategoryName(
                                        selectedEquipment.categoryId,
                                    )}
                                </span>
                            </div>
                            <div className="grid grid-cols-4 items-center gap-4">
                                <span className="font-medium">รูปภาพ:</span>
                                <div className="col-span-3">{imageSection}</div>
                            </div>
                            <div className="grid grid-cols-4 items-center gap-4">
                                <span className="font-medium">
                                    รูปภาพใบเสร็จ:
                                </span>
                                <div className="col-span-3">
                                    {selectedEquipment.receiptImage ? (
                                        <a
                                            href={`http://localhost:8000/${selectedEquipment.receiptImage.filepath.replace(/\\/g, "/")}`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="block"
                                        >
                                            <div className="relative h-24 w-24 overflow-hidden rounded border border-gray-200">
                                                <Image
                                                    src={`http://localhost:8000/${selectedEquipment.receiptImage.filepath.replace(/\\/g, "/")}`}
                                                    alt={
                                                        selectedEquipment
                                                            .receiptImage
                                                            .filename
                                                    }
                                                    fill
                                                    sizes="(max-width: 96px) 100vw, 96px"
                                                    className="object-cover"
                                                    loading="lazy"
                                                    unoptimized
                                                />
                                            </div>
                                        </a>
                                    ) : (
                                        <span className="text-gray-500">
                                            ไม่มีรูปภาพใบเสร็จ
                                        </span>
                                    )}
                                </div>
                            </div>
                        </div>
                        <DialogFooter>
                            <Button
                                variant="outline"
                                onClick={() => setIsDetailsDialogOpen(false)}
                            >
                                ปิด
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            )}

            {editingEquipment && (
                <Dialog
                    open={isEditDialogOpen}
                    onOpenChange={setIsEditDialogOpen}
                >
                    <DialogContent className="max-h-[80vh] overflow-y-auto sm:max-w-[600px]">
                        <DialogHeader>
                            <DialogTitle className="text-xl font-semibold">
                                แก้ไขข้อมูลครุภัณฑ์
                            </DialogTitle>
                        </DialogHeader>
                        <div className="grid gap-4 py-4">
                            <div className="grid gap-2">
                                <label className="text-sm font-medium">
                                    ชื่อครุภัณฑ์
                                </label>
                                <Input
                                    value={editingEquipment.name}
                                    onChange={(e) =>
                                        handleEditChange("name", e.target.value)
                                    }
                                />
                            </div>
                            <div className="grid gap-2">
                                <label className="text-sm font-medium">
                                    รายละเอียด
                                </label>
                                <Input
                                    value={editingEquipment.description || ""}
                                    onChange={(e) =>
                                        handleEditChange(
                                            "description",
                                            e.target.value || null,
                                        )
                                    }
                                />
                            </div>
                            <div className="grid gap-2">
                                <label className="text-sm font-medium">
                                    Serial Number
                                </label>
                                <Input
                                    value={editingEquipment.serialNumber || ""}
                                    onChange={(e) =>
                                        handleEditChange(
                                            "serialNumber",
                                            e.target.value || null,
                                        )
                                    }
                                />
                            </div>
                            <div className="grid gap-2">
                                <label className="text-sm font-medium">
                                    สถานะ
                                </label>
                                <Select
                                    value={String(editingEquipment.status)}
                                    onValueChange={(value) =>
                                        handleEditChange(
                                            "status",
                                            Number(value),
                                        )
                                    }
                                >
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="0">ปกติ</SelectItem>
                                        <SelectItem value="1">ชำรุด</SelectItem>
                                        <SelectItem value="2">
                                            จำหน่าย
                                        </SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="grid gap-2">
                                <label className="text-sm font-medium">
                                    ราคา
                                </label>
                                <Input
                                    type="number"
                                    value={String(editingEquipment.price)}
                                    onChange={(e) =>
                                        handleEditChange(
                                            "price",
                                            Number(e.target.value),
                                        )
                                    }
                                />
                            </div>
                            <div className="grid gap-2">
                                <label className="text-sm font-medium">
                                    วันที่ได้รับ
                                </label>
                                <Input
                                    type="date"
                                    value={
                                        String(
                                            editingEquipment.acquiredDate,
                                        ).split("T")[0]
                                    }
                                    onChange={(e) =>
                                        handleEditChange(
                                            "acquiredDate",
                                            e.target.value,
                                        )
                                    }
                                />
                            </div>
                            <div className="grid gap-2">
                                <label className="text-sm font-medium">
                                    ห้อง
                                </label>
                                <Select
                                    value={editingEquipment.roomId || ""}
                                    onValueChange={(value) =>
                                        handleEditChange(
                                            "roomId",
                                            value || null,
                                        )
                                    }
                                >
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {rooms.map((room) => (
                                            <SelectItem
                                                key={room.id}
                                                value={room.id}
                                            >
                                                ห้อง {room.roomNumber}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                        <DialogFooter className="sticky bottom-0 border-t bg-white py-4">
                            <Button
                                variant="outline"
                                onClick={() => setIsEditDialogOpen(false)}
                            >
                                ยกเลิก
                            </Button>
                            <Button
                                onClick={handleSaveEdit}
                                className="bg-blue-500 hover:bg-blue-600"
                            >
                                บันทึก
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            )}

            {/* Add Delete Confirmation Dialog */}
            <Dialog
                open={isDeleteAlertOpen}
                onOpenChange={setIsDeleteAlertOpen}
            >
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>ยืนยันการลบครุภัณฑ์</DialogTitle>
                    </DialogHeader>
                    <div className="py-4">
                        <p>
                            คุณแน่ใจหรือไม่ที่จะลบครุภัณฑ์นี้?
                            การกระทำนี้ไม่สามารถย้อนกลับได้
                        </p>
                    </div>
                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => {
                                setIsDeleteAlertOpen(false);
                                setEquipmentToDelete(null);
                            }}
                        >
                            ยกเลิก
                        </Button>
                        <Button
                            variant="destructive"
                            onClick={handleDelete}
                            disabled={isLoading}
                        >
                            {isLoading ? "กำลังลบ..." : "ลบ"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
