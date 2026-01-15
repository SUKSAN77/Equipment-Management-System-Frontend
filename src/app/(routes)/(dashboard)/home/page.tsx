import { BarChartComponent } from "@/components/chart-bar-multiple";
import { PieChartComponent } from "@/components/chart-pie-donut-text";
import EquipmentViewer from "@/components/EquipmentViewer";
import Layout from "@/components/layout";

export default function Page() {
    return (
        <div className="min-h-screen bg-gray-50">
            <Layout>
                <div className="container mx-auto px-4 py-8">
                    <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                        <div className="col-span-1 md:col-span-2">
                            <div className="rounded-lg bg-white p-6 shadow-md">
                                <EquipmentViewer />
                            </div>
                        </div>
                        <div className="flex flex-col rounded-lg bg-white p-6 shadow-md">
                            <h2 className="mb-4 text-2xl font-semibold">
                                สถิติประเภทอุปกรณ์
                            </h2>
                            <PieChartComponent />
                        </div>
                        <div className="flex flex-col rounded-lg bg-white p-6 shadow-md">
                            <h2 className="mb-4 text-2xl font-semibold">
                                สถิติการใช้งาน
                            </h2>
                            <BarChartComponent />
                        </div>
                    </div>
                </div>
            </Layout>
        </div>
    );
}
