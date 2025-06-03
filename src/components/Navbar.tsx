import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Menu } from "lucide-react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { onAuthStateChanged, signOut, type User } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { toast } from "sonner";
import { getCurrUserName } from "@/handlers/auth";
import { HyperText } from "@/components/magicui/hyper-text";

const navItems = [
    { name: "HOME", href: "/" },
    { name: "MODULES", href: "/modules" },
    { name: "APPOINTMENTS", href: "/appointments" },
    { name: "FORUM", href: "/forum" },
    { name: "FAQ", href: "/faq" },
    { name: "CONTACT", href: "/contact" },
    { name: "PROFILE", href: "/profile" },
];

export function Navbar() {
    const [isOpen, setIsOpen] = useState(false);
    const [user, setUser] = useState<User | null>(null);
    const [userName, setUserName] = useState<string>("Guest");

    useEffect(() => {
        async function fetchUserName() {
            setUserName(await getCurrUserName());
        }

        const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
            setUser(currentUser);
            fetchUserName();
        });
        return () => unsubscribe();
    }, []);

    const handleLogout = async () => {
        try {
            await signOut(auth);
        } catch (err) {
            toast.error("Logout failed: " + (err as Error).message);
        }
    };

    return (
        <header className="w-full border-lightgreen border-2 rounded-2xl px-4 py-2 max-w-7xl m-2">
            <div className="flex items-center justify-between">
                <div className="flex items-center w-full">
                    <Link
                        to="/"
                        className="text-primarygreen font-bold text-lg mr-8 flex">
                        <img className="w-6 mr-1" src="/icon-cropped.svg"></img>
                        TEMANJIWA
                    </Link>

                    <nav className="w-full flex flex-row justify-evenly px-2 pr-4">
                        {navItems.map((item) => (
                            <Link
                                key={item.name}
                                to={item.href}
                                className="text-sm font-medium text-gray-700 hover:text-primarygreen transition-colors">
                                {item.name}
                            </Link>
                        ))}
                    </nav>
                </div>

                <HyperText key={userName} className="text-xs w-30">{`Welcome, ${
                    userName.split(" ")[0]
                }`}</HyperText>
                <div className="hidden md:block">
                    {user ? (
                        <Button
                            variant={"destructive"}
                            className=" text-white rounded-xl"
                            onClick={handleLogout}>
                            LOGOUT
                        </Button>
                    ) : (
                        <Button className="bg-primarygreen hover:bg-darkgreen text-white rounded-xl">
                            <Link to="/login">LOGIN</Link>
                        </Button>
                    )}
                </div>

                <div className="md:hidden">
                    <Sheet open={isOpen} onOpenChange={setIsOpen}>
                        <SheetTrigger asChild>
                            <Button variant="ghost" size="icon">
                                <Menu className="h-5 w-5" />
                                <span className="sr-only">Toggle menu</span>
                            </Button>
                        </SheetTrigger>
                        <SheetContent side="right">
                            <nav className="flex flex-col space-y-4 mt-8">
                                {navItems.map((item) => (
                                    <Link
                                        key={item.name}
                                        to={item.href}
                                        className="text-sm font-medium text-gray-700 hover:text-primarygreen transition-colors"
                                        onClick={() => setIsOpen(false)}>
                                        {item.name}
                                    </Link>
                                ))}
                                {user ? (
                                    <Button
                                        className="bg-primarygreen hover:bg-darkgreen text-white w-full mt-4"
                                        onClick={() => {
                                            setIsOpen(false);
                                            handleLogout();
                                        }}>
                                        LOGOUT
                                    </Button>
                                ) : (
                                    <Button className="bg-primarygreen hover:bg-darkgreen text-white w-full mt-4">
                                        <Link
                                            to="/login"
                                            onClick={() => setIsOpen(false)}>
                                            LOGIN
                                        </Link>
                                    </Button>
                                )}
                            </nav>
                        </SheetContent>
                    </Sheet>
                </div>
            </div>
        </header>
    );
}
