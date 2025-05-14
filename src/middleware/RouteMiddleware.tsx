import { type ReactNode, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { onAuthStateChanged, type User } from "firebase/auth";
import { auth } from "../database/firebase";
import { toast } from "sonner";

type AccessLevel = "public" | "guest" | "auth";

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

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
            setUser(firebaseUser);
            setAuthChecked(true);
        });

        return () => unsubscribe();
    }, []);

    if (!authChecked) return null;

    if (access === "guest" && user) {
        navigate("/");
        toast.warning("You are already logged in.");
    }

    if (access === "auth" && !user) {
        navigate("/login");
        toast.warning("This page is for logged-in users only.");
    }

    return <>{children}</>;
}
