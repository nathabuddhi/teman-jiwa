import { type ReactNode, useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { onAuthStateChanged, type User } from "firebase/auth";
import { auth } from "../lib/firebase";
import { toast } from "sonner";
import { getCurrUserRole } from "@/handlers/auth";

type AccessLevel = "public" | "guest" | "auth" | "user" | "admin" | "expert";

interface RouteGuardProps {
    children: ReactNode;
    access?: AccessLevel;
}

export default function RouteMiddleware({
    children,
    access = "public",
}: RouteGuardProps) {
    const navigate = useNavigate();
    const [user, setUser] = useState<User | null>(null);
    const [authChecked, setAuthChecked] = useState(false);
    const hasRedirected = useRef(false);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
            setUser(firebaseUser);
            setAuthChecked(true);
            hasRedirected.current = false;
        });

        return () => unsubscribe();
    }, []);

    useEffect(() => {
        const checkAccess = async () => {
            if (!authChecked || hasRedirected.current) return;

            if (access === "guest" && user) {
                toast.warning("You are already logged in.");
                hasRedirected.current = true;
                navigate("/");
                return;
            }

            if (
                (access === "auth" ||
                    access === "user" ||
                    access === "admin" ||
                    access === "expert") &&
                !user
            ) {
                toast.warning("This page is for logged-in users only.");
                hasRedirected.current = true;
                navigate("/login");
                return;
            }

            if (
                user &&
                ["user", "admin", "expert"].includes(access) &&
                (await getCurrUserRole()) !== access
            ) {
                toast.warning("You are not authorized to access this page.");
                hasRedirected.current = true;
                navigate("/");
                return;
            }
        };

        checkAccess();
    }, [authChecked, access, user, navigate]);

    if (!authChecked) return null;

    return <>{children}</>;
}
