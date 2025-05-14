import {
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    signOut as firebaseSignOut,
} from "firebase/auth";
import { auth, firestore } from "./firebase";
import { collection, doc, setDoc } from "firebase/firestore";

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

export { auth };
