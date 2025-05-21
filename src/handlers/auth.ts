import {
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    signOut as firebaseSignOut,
} from "firebase/auth";
import { auth, firestore } from "../lib/firebase";
import { collection, doc, getDoc, setDoc } from "firebase/firestore";

export async function getCurrUserId(): Promise<string> {
    return new Promise((resolve, reject) => {
        const unsubscribe = auth.onAuthStateChanged((user) => {
            unsubscribe();
            if (user) {
                resolve(user.uid);
            } else {
                resolve("");
            }
        }, reject);
    });
}

async function checkFirestoreRole(user_id: string): Promise<string> {
    const expert = await getDoc(doc(collection(firestore, "experts"), user_id));
    if (expert.exists()) return "expert";

    const admin = await getDoc(doc(collection(firestore, "admins"), user_id));
    if (admin.exists()) return "admin";

    const user = await getDoc(doc(collection(firestore, "users"), user_id));
    if (user.exists()) return "user";

    return "guest";
}

export async function getCurrUserRole(): Promise<string> {
    return new Promise((resolve, reject) => {
        const unsubscribe = auth.onAuthStateChanged(async (user) => {
            unsubscribe();
            if (user) {
                resolve(checkFirestoreRole(user.uid));
            } else {
                resolve("guest");
            }
        }, reject);
    });
}

export const registerAccount = async (
    email: string,
    password: string,
    displayName: string,
    dateOfBirth: Date
): Promise<void> => {
    try {
        const userCredential = await createUserWithEmailAndPassword(
            auth,
            email,
            password
        );
        await setDoc(
            doc(collection(firestore, "users"), userCredential.user.uid),
            {
                email: userCredential.user.email,
                full_name: displayName,
                date_of_birth: dateOfBirth,
            }
        );
    } catch (error: any) {
        throw new Error(error.message || "Failed to register user");
    }
};

export const signIn = async (
    email: string,
    password: string
): Promise<void> => {
    try {
        await signInWithEmailAndPassword(auth, email, password);
    } catch (error: any) {
        throw new Error(error.message || "Failed to sign in");
    }
};

export const signOut = async (): Promise<void> => {
    try {
        await firebaseSignOut(auth);
    } catch (error: any) {
        throw new Error(error.message || "Failed to sign out");
    }
};

export function validatePassword(password: string): string {
    if (password.length < 8) {
        return "Password length must be at least 8 characters.";
    }

    if (!/[A-Z]/.test(password)) {
        return "Password must contain at least one uppercase letter.";
    }

    if (!/[a-z]/.test(password)) {
        return "Password must contain at least one lowercase letter.";
    }

    if (!/\d/.test(password)) {
        return "Password must contain at least one number.";
    }

    if (!/[!@#$-%^&*(),.?":{}|<>]/.test(password)) {
        return "Password must contain at least one special character.";
    }

    return "";
}
