import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

import { Equipment } from "@/types/equipments";

interface Category {
    id: string;
    name: string;
}

interface Room {
    id: string;
    roomNumber: string;
}

interface WorkerData {
    equipments: Equipment[];
    categories: Category[];
    rooms: Room[];
}

self.onmessage = async (e: MessageEvent<WorkerData>) => {
    const { equipments, categories, rooms } = e.data;

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

        // หัวข้อเอกสาร
        doc.setFontSize(18);
        doc.text("รายงานครุภัณฑ์", 14, 22);

        // Helper functions
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

        // สร้างตารางหลังจากโหลดฟอนต์เสร็จแล้ว
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
            body: equipments.map((item) => [
                item.customId || "-",
                item.name,
                getRoleLabel(item.status),
                `${Number(item.price).toLocaleString()} บาท`,
                new Date(String(item.acquiredDate)).toLocaleDateString("th-TH"),
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

        // เพิ่มวันที่พิมพ์
        const today = new Date();
        const dateStr = `วันที่พิมพ์: ${today.toLocaleDateString("th-TH")}`;
        doc.setFontSize(10);
        doc.text(dateStr, 14, doc.internal.pageSize.height - 10);

        // ส่งข้อมูล PDF กลับไปยัง main thread
        const pdfBlob = doc.output("blob");
        self.postMessage({ pdfBlob });
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (error) {
        self.postMessage({ error: "เกิดข้อผิดพลาดในการสร้าง PDF" });
    }
};
