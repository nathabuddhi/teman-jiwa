"use client";

import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast, Toaster } from "sonner";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { format } from "date-fns";
import { CalendarIcon, Upload, X } from "lucide-react";
import { registerAccount } from "../handlers/auth";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
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
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export default function RegisterPage() {
    const formSchema = z
        .object({
            displayName: z
                .string()
                .min(1, { message: "Full name is required" }),
            dateOfBirth: z.date({
                required_error: "Please select your date of birth.",
            }),
            isExpert: z.boolean().optional(),
            email: z.string().email({ message: "Invalid email address" }),
            password: z
                .string()
                .min(8, { message: "Password must be at least 8 characters" })
                .regex(/[A-Z]/, {
                    message: "Password must contain an uppercase letter",
                })
                .regex(/[a-z]/, {
                    message: "Password must contain a lowercase letter",
                })
                .regex(/\d/, { message: "Password must contain a number" })
                .regex(/[^A-Za-z0-9]/, {
                    message: "Password must contain a special character",
                }),
            confirmPassword: z.string(),
            avatar: z.instanceof(File).optional(),
        })
        .refine((data) => data.password === data.confirmPassword, {
            message: "Passwords do not match",
            path: ["confirmPassword"],
        })
        .refine(
            (data) => {
                const today = new Date();
                const age =
                    today.getFullYear() - data.dateOfBirth.getFullYear();
                const monthDiff =
                    today.getMonth() - data.dateOfBirth.getMonth();
                const dayDiff = today.getDate() - data.dateOfBirth.getDate();

                return (
                    age > 12 ||
                    (age === 12 &&
                        (monthDiff > 0 || (monthDiff === 0 && dayDiff >= 0)))
                );
            },
            {
                message: "You must be at least 12 years old to register.",
                path: ["dateOfBirth"],
            }
        );

    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [avatarPreview, setAvatarPreview] = useState<string | null>(null);

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            displayName: "",
            dateOfBirth: undefined,
            email: "",
            password: "",
            confirmPassword: "",
            avatar: undefined,
        },
    });

    const handleAvatarChange = (file: File | null) => {
        if (file) {
            const reader = new FileReader();
            reader.onload = (e) => {
                setAvatarPreview(e.target?.result as string);
            };
            reader.readAsDataURL(file);
            form.setValue("avatar", file);
        } else {
            setAvatarPreview(null);
            form.setValue("avatar", undefined);
        }
    };

    const onSubmit = async (values: z.infer<typeof formSchema>) => {
        setLoading(true);

        if (!values.avatar) {
            toast.error("Please upload a profile picture.");
            return;
            setLoading(false);
        }

        try {
            await registerAccount(
                values.email,
                values.password,
                values.displayName,
                values.dateOfBirth,
                values.isExpert ?? false,
                values.avatar
            );

            toast.success("Account created successfully!");
            navigate("/login");
        } catch (error: any) {
            if (error.message.includes("auth/email-already-in-use")) {
                toast.error("Email already in use.");
            } else if (error.message.includes("auth/invalid-email")) {
                toast.error("Invalid email address.");
            } else if (error.message.includes("auth/weak-password")) {
                toast.error(
                    "Password should be at least 8 characters, contain at least one uppercase letter, one lowercase letter, one number, and one special character."
                );
            } else {
                toast.error("An error occurred: " + error.message);
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex items-center justify-center min-w-screen min-h-screen bg-lightgreen bg-opacity-20 px-4">
            <Toaster richColors />
            <Card className="w-full max-w-md bg-white border-0 shadow-lg">
                <CardHeader className="space-y-1">
                    <CardTitle className="text-2xl font-bold text-center text-darkgreen">
                        Create an Account
                    </CardTitle>
                    <CardDescription className="text-center">
                        Enter your details below to create your account
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <Form {...form}>
                        <form
                            onSubmit={form.handleSubmit(onSubmit)}
                            className="space-y-4">
                            <FormField
                                control={form.control}
                                name="displayName"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Full Name</FormLabel>
                                        <FormControl>
                                            <Input
                                                placeholder="John Doe"
                                                {...field}
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="dateOfBirth"
                                render={({ field }) => (
                                    <FormItem className="flex flex-col">
                                        <FormLabel>Date of birth</FormLabel>
                                        <Popover>
                                            <PopoverTrigger className="w-full">
                                                <Button
                                                    variant={"outline"}
                                                    className={cn(
                                                        "w-full pl-3 text-left font-normal",
                                                        !field.value &&
                                                            "text-muted-foreground"
                                                    )}>
                                                    {field.value ? (
                                                        format(
                                                            field.value,
                                                            "PPP"
                                                        )
                                                    ) : (
                                                        <span>Pick a date</span>
                                                    )}
                                                    <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                                </Button>
                                            </PopoverTrigger>
                                            <PopoverContent
                                                className="w-auto p-0"
                                                align="start">
                                                <FormControl>
                                                    <Calendar
                                                        mode="single"
                                                        selected={field.value}
                                                        onSelect={
                                                            field.onChange
                                                        }
                                                        disabled={(date) =>
                                                            date > new Date() ||
                                                            date <
                                                                new Date(
                                                                    "1900-01-01"
                                                                )
                                                        }
                                                        initialFocus
                                                    />
                                                </FormControl>
                                            </PopoverContent>
                                        </Popover>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="email"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Email</FormLabel>
                                        <FormControl>
                                            <Input
                                                placeholder="name@example.com"
                                                {...field}
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="password"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Password</FormLabel>
                                        <FormControl>
                                            <Input
                                                type="password"
                                                placeholder="••••••••"
                                                {...field}
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="confirmPassword"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Confirm Password</FormLabel>
                                        <FormControl>
                                            <Input
                                                type="password"
                                                placeholder="••••••••"
                                                {...field}
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="avatar"
                                render={() => (
                                    <FormItem className="flex flex-col items-center">
                                        <FormLabel>Profile Picture</FormLabel>
                                        <div className="relative">
                                            <Avatar className="h-20 w-20">
                                                <AvatarImage
                                                    src={
                                                        avatarPreview ||
                                                        "/placeholder.svg"
                                                    }
                                                />
                                                <AvatarFallback>
                                                    <Upload className="h-8 w-8 text-gray-400" />
                                                </AvatarFallback>
                                            </Avatar>
                                            {avatarPreview && (
                                                <Button
                                                    type="button"
                                                    variant="destructive"
                                                    size="sm"
                                                    className="absolute -top-2 -right-2 h-6 w-6 rounded-full p-0"
                                                    onClick={() =>
                                                        handleAvatarChange(null)
                                                    }>
                                                    <X className="h-3 w-3" />
                                                </Button>
                                            )}
                                        </div>
                                        <FormControl>
                                            <Input
                                                type="file"
                                                accept="image/*"
                                                onChange={(e) => {
                                                    const file =
                                                        e.target.files?.[0];
                                                    handleAvatarChange(
                                                        file || null
                                                    );
                                                }}
                                                className="w-full"
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="isExpert"
                                render={({ field }) => (
                                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                                        <div className="space-y-0.5">
                                            <FormLabel>
                                                Are you an Expert?
                                            </FormLabel>
                                        </div>
                                        <FormControl>
                                            <Switch
                                                checked={field.value}
                                                onCheckedChange={field.onChange}
                                                aria-readonly
                                            />
                                        </FormControl>
                                    </FormItem>
                                )}
                            />

                            <Button
                                type="submit"
                                className="w-full bg-primarygreen hover:bg-darkgreen text-white"
                                disabled={loading}>
                                {loading ? "Creating Account..." : "Register"}
                            </Button>
                        </form>
                    </Form>
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
