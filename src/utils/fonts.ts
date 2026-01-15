import { jsPDF } from "jspdf";

export const addFonts = (doc: jsPDF) => {
    // เพิ่มฟอนต์ Sarabun
    doc.addFont(
        "https://fonts.gstatic.com/s/sarabun/v13/DtVmJx26TKEr37c9YL5.ttf",
        "Sarabun",
        "normal",
    );
    doc.setFont("Sarabun");

    return doc;
};
