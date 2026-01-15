import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type Activity = {
    id: string;
    user: {
        name: string;
        avatar: string;
    };
    action: string;
    equipment: string;
    timestamp: string;
};

const recentActivities: Activity[] = [
    {
        id: "1",
        user: { name: "อาจารย์สมชาย", avatar: "/avatars/somchai.jpg" },
        action: "เพิ่มครุภัณฑ์",
        equipment: "โน้ตบุ๊ก Dell XPS 15",
        timestamp: "2 นาทีที่แล้ว",
    },
    {
        id: "2",
        user: { name: "คุณสมหญิง", avatar: "/avatars/somying.jpg" },
        action: "แก้ไขสถานะ",
        equipment: "เครื่องฉายโปรเจคเตอร์",
        timestamp: "1 ชั่วโมงที่แล้ว",
    },
    {
        id: "3",
        user: { name: "นายสมศักดิ์", avatar: "/avatars/somsak.jpg" },
        action: "ย้ายสถานที่",
        equipment: "เครื่องพิมพ์ HP LaserJet",
        timestamp: "3 ชั่วโมงที่แล้ว",
    },
];

export function RecentActivities() {
    return (
        <Card>
            <CardHeader>
                <CardTitle>กิจกรรมล่าสุด</CardTitle>
            </CardHeader>
            <CardContent>
                <div className="space-y-8">
                    {recentActivities.map((activity) => (
                        <div key={activity.id} className="flex items-center">
                            <Avatar className="h-9 w-9">
                                <AvatarImage
                                    src={activity.user.avatar}
                                    alt={activity.user.name}
                                />
                                <AvatarFallback>
                                    {activity.user.name[0]}
                                </AvatarFallback>
                            </Avatar>
                            <div className="ml-4 space-y-1">
                                <p className="text-sm font-medium leading-none">
                                    {activity.user.name} {activity.action}
                                </p>
                                <p className="text-sm text-muted-foreground">
                                    {activity.equipment}
                                </p>
                            </div>
                            <div className="ml-auto text-sm font-medium text-muted-foreground">
                                {activity.timestamp}
                            </div>
                        </div>
                    ))}
                </div>
            </CardContent>
        </Card>
    );
}
