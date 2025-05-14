import {
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    signOut as firebaseSignOut,
    onAuthStateChanged,
    type User as FirebaseUser,
} from "firebase/auth";
import type { User } from "../types/user";
import { auth, firestore } from "./firebase";
import { collection, doc, setDoc } from "firebase/firestore";

export const formatUser = (user: FirebaseUser): User => {
    return {
        uid: user.uid,
        email: user.email,
        displayName: user.displayName,
        photoURL: user.photoURL,
    };
};

export const registerUser = async (
    email: string,
    password: string,
    displayName: string
): Promise<User> => {
    try {
        const userCredential = await createUserWithEmailAndPassword(
            auth,
            email,
            password
        );
        await setDoc(
            doc(collection(firestore, "Users"), userCredential.user.uid),
            {
                email: userCredential.user.email,
                displayName: displayName,
            }
        );

        return formatUser(userCredential.user);
    } catch (error: any) {
        throw new Error(error.message || "Failed to register user");
    }
};

export const signIn = async (
    email: string,
    password: string
): Promise<User> => {
    try {
        const userCredential = await signInWithEmailAndPassword(
            auth,
            email,
            password
        );
        return formatUser(userCredential.user);
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

export const getCurrentUser = (): User | null => {
    const user = auth.currentUser;
    return user ? formatUser(user) : null;
};

export const onAuthStateChange = (
    callback: (user: User | null) => void
): (() => void) => {
    return onAuthStateChanged(auth, (user) => {
        callback(user ? formatUser(user) : null);
    });
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

export { auth };
