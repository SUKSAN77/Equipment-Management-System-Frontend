"use client";

import React from "react";
import { Bar, BarChart, CartesianGrid, Legend, XAxis, YAxis } from "recharts";

import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import {
    type ChartConfig,
    ChartContainer,
    ChartTooltip,
    ChartTooltipContent,
} from "@/components/ui/chart";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { useEquipments } from "@/hooks/api";
import { Equipment } from "@/types/equipments";

// คำนวณข้อมูลรายเดือน
const calculateMonthlyData = (
    equipments: Equipment[] = [],
    selectedYear: number,
) => {
    // สร้าง Map เพื่อเก็บข้อมูลแยกตามปี
    type MonthlyData = {
        month: string;
        ปกติ: number;
        ชำรุด: number;
        จำหน่าย: number;
    };

    const yearDataMap = new Map<number, MonthlyData[]>();
    const monthlyTemplate = new Array(12).fill(null).map((_, index) => ({
        month: new Date(selectedYear, index).toLocaleString("th-TH", {
            month: "short",
        }),
        ปกติ: 0,
        ชำรุด: 0,
        จำหน่าย: 0,
    }));

    equipments.forEach((item) => {
        const date = new Date(item.acquiredDate as string);
        const year = date.getFullYear();
        if (!yearDataMap.has(year)) {
            yearDataMap.set(year, JSON.parse(JSON.stringify(monthlyTemplate)));
        }

        const monthIndex = date.getMonth();
        const status = item.status;
        const yearData = yearDataMap.get(year)!;

        if (status === 0) yearData[monthIndex].ปกติ++;
        else if (status === 1) yearData[monthIndex].ชำรุด++;
        else if (status === 2) yearData[monthIndex].จำหน่าย++;
    });

    // ส่งคืนข้อมูลของปีที่เลือก
    return yearDataMap.get(selectedYear) || monthlyTemplate;
};

const chartConfig = {
    ปกติ: {
        label: "ปกติ",
        color: "#22c55e",
    },
    ชำรุด: {
        label: "ชำรุด",
        color: "#f59e0b",
    },
    จำหน่าย: {
        label: "จำหน่าย",
        color: "#ef4444",
    },
} satisfies ChartConfig;

export function BarChartComponent() {
    const { equipments } = useEquipments();
    const [selectedYear, setSelectedYear] = React.useState(
        new Date().getFullYear(),
    );

    // หาปีที่มีข้อมูลทั้งหมด
    const availableYears = React.useMemo(() => {
        const years = new Set<number>();
        equipments?.forEach((item) => {
            const date = new Date(item.acquiredDate as string);
            years.add(date.getFullYear());
        });
        return Array.from(years).sort((a, b) => b - a);
    }, [equipments]);

    const chartData = React.useMemo(
        () => calculateMonthlyData(equipments, selectedYear),
        [equipments, selectedYear],
    );

    return (
        <Card className="flex-1">
            <CardHeader className="flex flex-row items-center justify-between">
                <div>
                    <CardTitle>สถิติครุภัณฑ์รายเดือน</CardTitle>
                    <CardDescription>
                        แสดงจำนวนครุภัณฑ์แยกตามสถานะรายเดือน
                    </CardDescription>
                </div>
                <Select
                    value={selectedYear.toString()}
                    onValueChange={(value) => setSelectedYear(parseInt(value))}
                >
                    <SelectTrigger className="w-[180px]">
                        <SelectValue placeholder="เลือกปี" />
                    </SelectTrigger>
                    <SelectContent>
                        {availableYears.map((year) => (
                            <SelectItem key={year} value={year.toString()}>
                                ปี {year + 543}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </CardHeader>
            <CardContent>
                <ChartContainer config={chartConfig}>
                    <BarChart
                        data={chartData}
                        margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                        height={300}
                    >
                        <CartesianGrid strokeDasharray="3 3" vertical={false} />
                        <XAxis
                            dataKey="month"
                            tickLine={false}
                            axisLine={false}
                        />
                        <YAxis
                            tickLine={false}
                            axisLine={false}
                            allowDecimals={false}
                        />
                        <Legend />
                        <ChartTooltip
                            cursor={{ fill: "rgba(200, 200, 200, 0.1)" }}
                            content={<ChartTooltipContent />}
                        />
                        <Bar
                            dataKey="ปกติ"
                            fill="#22c55e"
                            radius={[4, 4, 0, 0]}
                            stackId="a"
                        />
                        <Bar
                            dataKey="ชำรุด"
                            fill="#f59e0b"
                            radius={[4, 4, 0, 0]}
                            stackId="a"
                        />
                        <Bar
                            dataKey="จำหน่าย"
                            fill="#ef4444"
                            radius={[4, 4, 0, 0]}
                            stackId="a"
                        />
                    </BarChart>
                </ChartContainer>
            </CardContent>
            <CardFooter className="flex-col items-start gap-2 text-sm">
                <div className="leading-none text-muted-foreground">
                    แสดงจำนวนครุภัณฑ์ทั้งหมดแยกตามสถานะในแต่ละเดือน ปี{" "}
                    {selectedYear + 543}
                </div>
            </CardFooter>
        </Card>
    );
}
