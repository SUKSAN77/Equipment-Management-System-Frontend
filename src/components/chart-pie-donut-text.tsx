"use client";

import * as React from "react";
import { Label, Pie, PieChart } from "recharts";

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
import { useEquipments } from "@/hooks/api";
import { Equipment } from "@/types/equipments";

// แก้ไขฟังก์ชัน calculateChartData รับพารามิเตอร์ equipments
const calculateChartData = (equipments: Equipment[] = []) => {
    const statusCount = equipments.reduce(
        (acc, item) => {
            acc[item.status] = (acc[item.status] || 0) + 1;
            return acc;
        },
        {} as Record<number, number>,
    );

    return [
        { status: "ปกติ", count: statusCount[0] || 0, fill: "#22c55e" },
        { status: "ชำรุด", count: statusCount[1] || 0, fill: "#f59e0b" },
        { status: "จำหน่าย", count: statusCount[2] || 0, fill: "#ef4444" },
    ];
};

const chartConfig = {
    count: {
        label: "จำนวน",
    },
    normal: {
        label: "ปกติ",
        color: "#22c55e",
    },
    maintenance: {
        label: "ชำรุด",
        color: "#f59e0b",
    },
    disposed: {
        label: "จำหน่าย",
        color: "#ef4444",
    },
} satisfies ChartConfig;

export function PieChartComponent() {
    const { equipments } = useEquipments();

    const chartData = React.useMemo(
        () => calculateChartData(equipments),
        [equipments],
    );
    const totalItems = React.useMemo(() => equipments.length, [equipments]);

    return (
        <Card className="flex flex-1 flex-col justify-between">
            <CardHeader className="items-center pb-0">
                <CardTitle>สถานะครุภัณฑ์</CardTitle>
                <CardDescription>
                    แสดงสัดส่วนสถานะของครุภัณฑ์ทั้งหมด
                </CardDescription>
            </CardHeader>
            <CardContent className="pb-0">
                <ChartContainer
                    config={chartConfig}
                    className="mx-auto aspect-square max-h-[250px]"
                >
                    <PieChart>
                        <ChartTooltip
                            cursor={false}
                            content={<ChartTooltipContent hideLabel />}
                        />
                        <Pie
                            data={chartData}
                            dataKey="count"
                            nameKey="status"
                            innerRadius={60}
                            strokeWidth={5}
                        >
                            <Label
                                content={({ viewBox }) => {
                                    if (
                                        viewBox &&
                                        "cx" in viewBox &&
                                        "cy" in viewBox
                                    ) {
                                        return (
                                            <text
                                                x={viewBox.cx}
                                                y={viewBox.cy}
                                                textAnchor="middle"
                                                dominantBaseline="middle"
                                            >
                                                <tspan
                                                    x={viewBox.cx}
                                                    y={viewBox.cy}
                                                    className="fill-foreground text-3xl font-bold"
                                                >
                                                    {totalItems}
                                                </tspan>
                                                <tspan
                                                    x={viewBox.cx}
                                                    y={(viewBox.cy || 0) + 24}
                                                    className="fill-muted-foreground"
                                                >
                                                    รายการ
                                                </tspan>
                                            </text>
                                        );
                                    }
                                }}
                            />
                        </Pie>
                    </PieChart>
                </ChartContainer>
            </CardContent>
            <CardFooter className="flex-col gap-2 text-sm">
                <div className="flex w-full items-center justify-between">
                    {chartData.map((item, index) => (
                        <div key={index} className="flex items-center gap-2">
                            <div
                                className="h-3 w-3 rounded-full"
                                style={{ backgroundColor: item.fill }}
                            />
                            <span>
                                {item.status} ({item.count})
                            </span>
                        </div>
                    ))}
                </div>
                <div className="leading-none text-muted-foreground">
                    ข้อมูล ณ วันที่ {new Date().toLocaleDateString("th-TH")}
                </div>
            </CardFooter>
        </Card>
    );
}
