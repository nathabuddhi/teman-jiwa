import { Outlet } from "react-router-dom";
import { Navbar } from "./Navbar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Toaster } from "sonner";

export default function Layout() {
    return (
        <ScrollArea className="h-screen w-full overflow-auto overflow-x-hidden">
            <Toaster richColors />
            <div className="w-full border-b">
                <div className="max-w-7xl mx-auto">
                    <Navbar />
                </div>
            </div>

            <main className="w-full">
                <Outlet />
            </main>
        </ScrollArea>
    );
}
