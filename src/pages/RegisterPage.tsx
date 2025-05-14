"use client";

import type React from "react";

import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { registerAccount, validatePassword } from "../handlers/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Calendar } from "@/components/ui/calendar";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import { CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

export default function RegisterPage() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [displayName, setDisplayName] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [dateOfBirth, setDateOfBirth] = useState<Date | undefined>(
        new Date()
    );

    const navigate = useNavigate();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!email || !password || !displayName || !confirmPassword) {
            toast.error("Please fill in all fields.");
            return;
        }

        let passwordValidation = validatePassword(password.trim());
        if (passwordValidation !== "") {
            toast.error(passwordValidation);
            return;
        }

        if (password !== confirmPassword) {
            toast.error("Passwords do not match.");
            return;
        }

        if (!dateOfBirth) {
            toast.error("Please select your date of birth.");
            return;
        }

        const today = new Date();
        const age = today.getFullYear() - dateOfBirth.getFullYear();
        const monthDiff = today.getMonth() - dateOfBirth.getMonth();
        const dayDiff = today.getDate() - dateOfBirth.getDate();

        if (
            age < 12 ||
            (age === 12 && (monthDiff < 0 || (monthDiff === 0 && dayDiff < 0)))
        ) {
            if (import.meta.env.VITE_ENVIRONMENT !== "development") {
                toast.error("You must be at least 12 years old to register.");
                return;
            }
        }

        setLoading(true);

        try {
            await registerAccount(
                email,
                password,
                displayName,
                dateOfBirth,
            );
            toast.info("Please verify your email address.");
            navigate("/verify?email=" + email);
        } catch (error: any) {
            if (
                error.message === "Firebase: Error (auth/email-already-in-use)."
            ) {
                toast.error("Email already in use.");
            } else if (
                error.message === "Firebase: Error (auth/invalid-email)."
            ) {
                toast.error("Invalid email address.");
            } else if (
                error.message === "Firebase: Error (auth/weak-password)."
            ) {
                toast.error(
                    "Password should be at least 8 characters, contain at least one uppercase letter, one lowercase letter, one number, and one special character."
                );
            } else {
                toast.error(
                    "An error occured: " + error.message ||
                        "An unknown error occured."
                );
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex items-center justify-center min-h-screen bg-lightgreen bg-opacity-20 px-4">
            <Card className="w-full max-w-md bg-white border-0 shadow-lg rounded-lg">
                <CardHeader className="space-y-1">
                    <CardTitle className="text-2xl font-bold text-center text-darkgreen">
                        Create an Account
                    </CardTitle>
                    <CardDescription className="text-center">
                        Enter your details below to create your account
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="displayName">Full Name</Label>
                            <Input
                                id="displayName"
                                type="text"
                                placeholder="John Doe"
                                value={displayName}
                                onChange={(e) => setDisplayName(e.target.value)}
                                disabled={loading}
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="dateOfBirth">Date Of Birth</Label>
                            <Popover>
                                <PopoverTrigger asChild>
                                    <Button
                                        variant={"outline"}
                                        className={cn(
                                            "w-full justify-start text-left font-normal",
                                            !dateOfBirth &&
                                                "text-muted-foreground"
                                        )}>
                                        <CalendarIcon className="mr-2 h-4 w-4" />
                                        {dateOfBirth ? (
                                            format(dateOfBirth, "PPP")
                                        ) : (
                                            <span>Pick a date</span>
                                        )}
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-0 bg-white z-50 shadow-md border rounded-md">
                                    <Calendar
                                        mode="single"
                                        selected={dateOfBirth}
                                        onSelect={setDateOfBirth}
                                        initialFocus
                                    />
                                </PopoverContent>
                            </Popover>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="email">Email</Label>
                            <Input
                                id="email"
                                type="email"
                                placeholder="name@example.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                disabled={loading}
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="password">Password</Label>
                            <Input
                                id="password"
                                type="password"
                                placeholder="••••••••"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                disabled={loading}
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="confirmPassword">
                                Confirm Password
                            </Label>
                            <Input
                                id="confirmPassword"
                                type="password"
                                placeholder="••••••••"
                                value={confirmPassword}
                                onChange={(e) =>
                                    setConfirmPassword(e.target.value)
                                }
                                disabled={loading}
                                required
                            />
                        </div>
                        <Button
                            type="submit"
                            className="w-full bg-primarygreen hover:bg-darkgreen text-white"
                            disabled={loading}>
                            {loading ? "Creating Account..." : "Register"}
                        </Button>
                    </form>
                </CardContent>
                <CardFooter className="flex flex-col space-y-4">
                    <div className="text-center text-sm">
                        Already have an account?{" "}
                        <a
                            href="/login"
                            className="text-primarygreen hover:underline font-medium"
                            onClick={(e) => {
                                e.preventDefault();
                                navigate("/login");
                            }}>
                            Sign in
                        </a>
                    </div>
                </CardFooter>
            </Card>
        </div>
    );
}
