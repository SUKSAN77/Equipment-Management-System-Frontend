import { BarChartComponent } from "@/components/chart-bar-multiple";
import { PieChartComponent } from "@/components/chart-pie-donut-text";
import EquipmentViewer from "@/components/EquipmentViewer";
import Navbar from "@/components/Navbar";

export default function App() {
    return (
        <div className="container mx-auto px-4">
            <Navbar />
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                <div className="col-span-1 md:col-span-2">
                    <div className="rounded-lg bg-white p-6 shadow-md">
                        <EquipmentViewer />
                    </div>
                </div>
                <div className="flex h-full flex-col rounded-lg bg-white p-6 shadow-md">
                    <h2 className="mb-4 text-2xl font-semibold">
                        สถิติประเภทอุปกรณ์
                    </h2>
                    <PieChartComponent />
                </div>
                <div className="flex h-full flex-col rounded-lg bg-white p-6 shadow-md">
                    <h2 className="mb-4 text-2xl font-semibold">
                        สถิติการใช้งาน
                    </h2>
                    <BarChartComponent />
                </div>
            </div>
        </div>
    );
}
