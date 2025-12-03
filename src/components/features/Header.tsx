import Link from "next/link";
import { Sparkles, History, User } from "lucide-react";
import { Button } from "../ui/button";

export function Header() {
    return (
        <header className="border-b bg-background/50 backdrop-blur-xl sticky top-0 z-50">
            <div className="container mx-auto px-4 h-16 flex items-center justify-between">
                <Link href="/" className="flex items-center gap-2">
                    <div className="bg-gradient-to-br from-indigo-500 to-purple-600 p-2 rounded-lg">
                        <Sparkles className="h-5 w-5 text-white" />
                    </div>
                    <h1 className="font-bold text-xl tracking-tight">Nano Banana Pro</h1>
                </Link>

                <div className="flex items-center gap-4">
                    <Link href="/history">
                        <Button variant="ghost" size="sm" className="gap-2">
                            <History className="h-4 w-4" />
                            History
                        </Button>
                    </Link>
                    <div className="h-4 w-px bg-border" />
                    <div className="flex items-center gap-2">
                        <span className="text-sm text-muted-foreground hidden md:inline-block">10 credits</span>
                        <Button variant="secondary" size="sm" className="gap-2 rounded-full">
                            <User className="h-4 w-4" />
                            Sign In
                        </Button>
                    </div>
                </div>
            </div>
        </header>
    );
}
