import {
    AirVent,
    Armchair,
    Bath,
    BatteryCharging,
    Bed,
    Coffee,
    type LucideIcon,
    Sparkles,
    Tv,
    UserCheck,
    Wifi,
} from "lucide-react";

const ICON_MAP: Record<string, LucideIcon> = {
    AirVent,
    Wifi,
    Coffee,
    Bed,
    Tv,
    BatteryCharging,
    Bath,
    Armchair,
    UserCheck,
};

interface AmenityIconProps {
    iconName: string;
    size?: number;
    className?: string;
}

export default function AmenityIcon({ iconName, size = 16, className }: AmenityIconProps) {
    const Icon = ICON_MAP[iconName] || Sparkles;
    return <Icon size={size} className={className} />;
}
