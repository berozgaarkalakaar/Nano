import Link from "next/link";
import {
    Home,
    Sparkles,
    Image as ImageIcon,
    Video,
    Bot,
    LayoutGrid,
    History,
    HelpCircle,
    Settings,
    Search,
    Users
} from "lucide-react";
import { cn } from "@/lib/utils";

interface SidebarProps {
    onAssistantClick?: () => void;
}

export function Sidebar({ onAssistantClick }: SidebarProps) {
    return (
        <div className="w-64 h-screen glass-panel border-r-0 flex flex-col flex-shrink-0 z-20 relative">
            {/* Logo */}
            <div className="p-4 flex items-center gap-2">
                <div className="bg-orange-600 p-1.5 rounded-lg">
                    <span className="font-bold text-white text-lg leading-none">P</span>
                </div>
                <span className="font-bold text-white text-lg tracking-tight">Personal</span>
            </div>

            {/* Main Nav */}
            <div className="px-2 py-2 space-y-1">
                <NavItem icon={Home} label="Home" />
                <NavItem icon={Sparkles} label="AI Suite" active />
            </div>

            <div className="px-4 py-2">
                <div className="h-px bg-white/5" />
            </div>

            {/* Pinned Tools */}
            <div className="px-4 py-2">
                <h3 className="text-xs font-semibold text-muted-foreground mb-2">Pinned</h3>
                <div className="space-y-1">
                    <NavItem icon={ImageIcon} label="Image Generator" activeVariant />
                    <NavItem icon={Bot} label="Assistant" onClick={onAssistantClick} />
                </div>
            </div>

            <div className="flex-1" />

            {/* Bottom Nav */}
            <div className="px-2 py-4 space-y-1">
                <NavItem icon={History} label="History" href="/history" />
            </div>
        </div>
    );
}

function NavItem({
    icon: Icon,
    label,
    active,
    activeVariant,
    href,
    onClick
}: {
    icon: any,
    label: string,
    active?: boolean,
    activeVariant?: boolean,
    href?: string,
    onClick?: () => void
}) {
    const content = (
        <div
            className={cn(
                "flex items-center gap-3 px-3 py-2 rounded-lg transition-colors cursor-pointer",
                activeVariant
                    ? "bg-white/10 text-white"
                    : active
                        ? "text-white"
                        : "text-muted-foreground hover:text-white hover:bg-white/5"
            )}
            onClick={onClick}
        >
            <Icon className={cn("h-5 w-5", active && "text-orange-500")} />
            <span className={cn("text-sm font-medium", active && "text-white")}>{label}</span>
        </div>
    );

    if (href) {
        return <Link href={href}>{content}</Link>;
    }

    return content;
}
