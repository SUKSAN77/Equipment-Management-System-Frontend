"use client";

// import "@fontsource/sarabun/thai.css";
// import "@fontsource/sarabun/400.css";
// import "@fontsource/sarabun/700.css";

import { format } from "date-fns";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { Download, Search } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
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

const getRoleLabel = (role: string | number) => {
    const statusNumber = Number(role);
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

export default function EquipmentViewer() {
    const { equipments } = useEquipments();
    const { categories } = useCategories();
    const { rooms } = useRooms();

    const [searchTerm, setSearchTerm] = useState("");
    const [filterCategory, setFilterCategory] = useState("");
    const [filterStatus, setFilterStatus] = useState("");
    const [filterRoom, setFilterRoom] = useState("");
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(10);
    // Helper functions
    const getCategoryName = (categoryId: string | null) => {
        if (!categoryId) return "-";
        const category = categories.find((c) => c.id === categoryId);
        return category ? category.name : categoryId;
    };

    const getRoomNumber = (roomId: string | null) => {
        if (!roomId) return "-";
        const room = rooms.find((r) => r.id === roomId);
        return room ? `ห้อง ${room.roomNumber}` : roomId;
    };

    // Filtered equipment logic with pagination
    const filteredEquipments = equipments.filter((item) => {
        const matchesSearch =
            item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (item.customId &&
                item.customId.toLowerCase().includes(searchTerm.toLowerCase()));

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

        return matchesSearch && matchesCategory && matchesStatus && matchesRoom;
    });

    // Pagination calculations
    const totalPages = Math.ceil(filteredEquipments.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const paginatedEquipments = filteredEquipments.slice(
        startIndex,
        startIndex + itemsPerPage,
    );

    // Reset to first page when filters change
    useEffect(() => {
        setCurrentPage(1);
    }, [searchTerm, filterCategory, filterStatus, filterRoom]);

    // Print PDF function
    const handlePrintPDF = async () => {
        const doc = new jsPDF({
            orientation: "landscape",
        });

        try {
            const fontResponse = await fetch("/THSarabunNew.ttf");
            const fontBuffer = await fontResponse.arrayBuffer();
            const base64Font = Buffer.from(fontBuffer).toString("base64");
            doc.addFileToVFS("THSarabunNew.ttf", base64Font);
            doc.addFont("THSarabunNew.ttf", "THSarabunNew", "normal");
            doc.addFont("THSarabunNew-Bold.ttf", "THSarabunNew", "bold");
            doc.setFont("THSarabunNew");

            // Document title
            doc.setFontSize(18);
            doc.text("รายงานครุภัณฑ์", 14, 22);

            // Create table
            autoTable(doc, {
                startY: 30,
                head: [
                    [
                        "รหัสครุภัณฑ์",
                        "ชื่อครุภัณฑ์",
                        "สถานะ",
                        "ราคา",
                        "วันที่ได้มา",
                        "หมวดหมู่",
                        "ห้อง",
                        "ผู้เพิ่ม",
                    ],
                ],
                body: paginatedEquipments.map((item) => [
                    item.customId || "-",
                    item.name,
                    getRoleLabel(item.status),
                    `${Number(item.price).toLocaleString()} บาท`,
                    new Date(String(item.acquiredDate)).toLocaleDateString(
                        "th-TH",
                    ),
                    getCategoryName(item.categoryId),
                    getRoomNumber(item.roomId),
                    item.creator?.firstName || "ไม่ทราบ",
                ]),
                styles: {
                    font: "THSarabunNew",
                    fontSize: 12,
                },
                headStyles: {
                    fillColor: [71, 85, 105],
                    font: "THSarabunNew",
                },
                columnStyles: {
                    0: { cellWidth: 30 },
                    1: { cellWidth: "auto" },
                    2: { cellWidth: 20 },
                    3: { cellWidth: 30 },
                    4: { cellWidth: 30 },
                    5: { cellWidth: 30 },
                    6: { cellWidth: 30 },
                    7: { cellWidth: 30 },
                },
            });

            // Add print date
            const today = new Date();
            const dateStr = `วันที่พิมพ์: ${today.toLocaleDateString("th-TH")}`;
            doc.setFontSize(10);
            doc.text(dateStr, 14, doc.internal.pageSize.height - 10);

            // Save file
            doc.save(`รายงานครุภัณฑ์_${format(new Date(), "dd-MM-yyyy")}.pdf`);
        } catch (error) {
            console.error("Error loading font:", error);
            toast.error("เกิดข้อผิดพลาดในการโหลดฟอนต์");
        }
    };

    return (
        <div className="space-y-6">
            <div className="mb-6 flex flex-col items-start justify-between sm:flex-row sm:items-center">
                <h1 className="mb-4 text-3xl font-bold sm:mb-0">
                    รายการครุภัณฑ์
                </h1>
                <Button
                    variant="outline"
                    onClick={handlePrintPDF}
                    className="bg-green-500 text-white hover:bg-green-600"
                >
                    <Download className="mr-2 h-4 w-4" /> พิมพ์รายงาน
                </Button>
            </div>

            <div className="mb-6 flex flex-col space-y-4">
                <div className="relative">
                    <Search className="absolute left-2 top-1/2 -translate-y-1/2 transform text-gray-400" />
                    <Input
                        placeholder="ค้นหาครุภัณฑ์..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-8"
                    />
                </div>
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
                                <SelectItem
                                    key={category.id}
                                    value={category.id}
                                >
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
                    <Select
                        value={filterStatus}
                        onValueChange={setFilterStatus}
                    >
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
            </div>

            <div className="grid gap-6 md:grid-cols-1">
                <div className="space-y-6">
                    <div className="-mx-4 overflow-x-auto sm:mx-0">
                        <div className="inline-block min-w-full align-middle">
                            <div className="overflow-hidden border border-gray-200 sm:rounded-lg">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>รหัสครุภัณฑ์</TableHead>
                                            <TableHead>ชื่อครุภัณฑ์</TableHead>
                                            <TableHead>สถานะ</TableHead>
                                            <TableHead>ราคา</TableHead>
                                            <TableHead>วันที่ได้มา</TableHead>
                                            <TableHead>ห้อง</TableHead>
                                            <TableHead>ประเภท</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {paginatedEquipments.map((item) => (
                                            <TableRow key={item.id}>
                                                <TableCell>
                                                    {item.customId || "NULL"}
                                                </TableCell>
                                                <TableCell>
                                                    {item.name}
                                                </TableCell>
                                                <TableCell>
                                                    {getRoleLabel(item.status)}
                                                </TableCell>
                                                <TableCell>
                                                    {Number(
                                                        item.price,
                                                    ).toLocaleString()}{" "}
                                                    บาท
                                                </TableCell>
                                                <TableCell>
                                                    {new Date(
                                                        String(
                                                            item.acquiredDate,
                                                        ),
                                                    ).toLocaleDateString(
                                                        "th-TH",
                                                    )}
                                                </TableCell>
                                                <TableCell>
                                                    {getRoomNumber(item.roomId)}
                                                </TableCell>
                                                <TableCell>
                                                    {getCategoryName(
                                                        item.categoryId,
                                                    )}
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </div>
                        </div>
                    </div>

                    {filteredEquipments.length === 0 && (
                        <div className="mt-4 text-center">
                            <p className="text-gray-500">
                                ไม่พบครุภัณฑ์ที่ตรงกับเงื่อนไขที่กำหนด
                            </p>
                        </div>
                    )}

                    {/* Pagination Controls */}
                    {filteredEquipments.length > 0 && (
                        <div className="mt-4 flex items-center justify-between border-t border-gray-200 px-4 py-3 sm:px-6">
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
                                            {Math.min(
                                                startIndex + itemsPerPage,
                                                filteredEquipments.length,
                                            )}
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
                                        {[...Array(totalPages)].map(
                                            (_, index) => {
                                                const pageNumber = index + 1;
                                                return (
                                                    <Button
                                                        key={pageNumber}
                                                        variant={
                                                            currentPage ===
                                                            pageNumber
                                                                ? "default"
                                                                : "outline"
                                                        }
                                                        onClick={() =>
                                                            setCurrentPage(
                                                                pageNumber,
                                                            )
                                                        }
                                                        className={`${
                                                            currentPage ===
                                                            pageNumber
                                                                ? "bg-blue-600 text-white hover:bg-blue-700"
                                                                : "hover:bg-gray-50"
                                                        } px-4 py-2`}
                                                    >
                                                        {pageNumber}
                                                    </Button>
                                                );
                                            },
                                        )}
                                        <Button
                                            variant="outline"
                                            className="rounded-r-md"
                                            onClick={() =>
                                                setCurrentPage((prev) =>
                                                    Math.min(
                                                        prev + 1,
                                                        totalPages,
                                                    ),
                                                )
                                            }
                                            disabled={
                                                currentPage === totalPages
                                            }
                                        >
                                            ถัดไป
                                        </Button>
                                    </nav>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
