import { type ReactNode, useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { onAuthStateChanged, type User } from "firebase/auth";
import { auth, firestore } from "../handlers/firebase";
import { toast } from "sonner";
import { collection, doc, getDoc } from "firebase/firestore";

type AccessLevel = "public" | "guest" | "auth" | "user" | "admin" | "expert";

interface RouteGuardProps {
    children: ReactNode;
    access?: AccessLevel;
}

async function getRole(userId: string): Promise<AccessLevel> {
    const expert = await getDoc(doc(collection(firestore, "experts"), userId));
    if (expert.exists()) return "expert";

    const admin = await getDoc(doc(collection(firestore, "admins"), userId));
    if (admin.exists()) return "admin";

    const user = await getDoc(doc(collection(firestore, "users"), userId));
    if (user.exists()) return "user";

    return "guest";
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
                (await getRole(user.uid)) !== access
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
