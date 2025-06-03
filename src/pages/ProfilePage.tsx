import { useEffect, useState } from "react";
import { toast } from "sonner";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { format } from "date-fns";
import { CalendarIcon, Upload, X, Eye, EyeOff } from "lucide-react";
import {
    updatePassword,
    EmailAuthProvider,
    reauthenticateWithCredential,
} from "firebase/auth";
import { doc, updateDoc, getDoc } from "firebase/firestore";
import { firestore as db, auth } from "@/lib/firebase";
import { getCurrUserId } from "@/handlers/auth";
import supabase from "@/lib/supabase";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import {
    Card,
    CardContent,
    CardDescription,
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
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const profileSchema = z
    .object({
        full_name: z.string().min(1, { message: "Full name is required" }),
        date_of_birth: z.date({
            required_error: "Please select your date of birth.",
        }),
        avatar: z.instanceof(File).optional(),
    })
    .refine(
        (data) => {
            const today = new Date();
            const age = today.getFullYear() - data.date_of_birth.getFullYear();
            const monthDiff = today.getMonth() - data.date_of_birth.getMonth();
            const dayDiff = today.getDate() - data.date_of_birth.getDate();

            return (
                age > 12 ||
                (age === 12 &&
                    (monthDiff > 0 || (monthDiff === 0 && dayDiff >= 0)))
            );
        },
        {
            message: "You must be at least 12 years old.",
            path: ["date_of_birth"],
        }
    );

const passwordSchema = z
    .object({
        currentPassword: z
            .string()
            .min(1, { message: "Current password is required" }),
        newPassword: z
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
    })
    .refine((data) => data.newPassword === data.confirmPassword, {
        message: "Passwords do not match",
        path: ["confirmPassword"],
    });

type ProfileForm = z.infer<typeof profileSchema>;
type PasswordForm = z.infer<typeof passwordSchema>;

export default function ProfilePage() {
    const [loading, setLoading] = useState(false);
    const [passwordLoading, setPasswordLoading] = useState(false);
    const [currentUserId, setCurrentUserId] = useState<string>("");
    const [userEmail, setUserEmail] = useState<string>("");
    const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
    const [showCurrentPassword, setShowCurrentPassword] = useState(false);
    const [showNewPassword, setShowNewPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    const profileForm = useForm<ProfileForm>({
        resolver: zodResolver(profileSchema),
        defaultValues: {
            full_name: "",
            date_of_birth: undefined,
            avatar: undefined,
        },
    });

    const passwordForm = useForm<PasswordForm>({
        resolver: zodResolver(passwordSchema),
        defaultValues: {
            currentPassword: "",
            newPassword: "",
            confirmPassword: "",
        },
    });

    useEffect(() => {
        async function loadUserData() {
            try {
                const userId = await getCurrUserId();
                setCurrentUserId(userId);

                const userDoc = await getDoc(doc(db, "users", userId));
                if (userDoc.exists()) {
                    const userData = userDoc.data();
                    profileForm.setValue("full_name", userData.full_name || "");
                    profileForm.setValue(
                        "date_of_birth",
                        userData.date_of_birth?.toDate() || new Date()
                    );
                    setUserEmail(userData.email || "");
                    setAvatarPreview(userData.avatar || null);
                }
            } catch (error) {
                toast.error(
                    "Error loading profile data: " + (error as Error).message
                );
            }
        }

        loadUserData();
    }, [profileForm]);

    const handleAvatarChange = (file: File | null) => {
        if (file) {
            const reader = new FileReader();
            reader.onload = (e) => {
                setAvatarPreview(e.target?.result as string);
            };
            reader.readAsDataURL(file);
            profileForm.setValue("avatar", file);
        } else {
            setAvatarPreview(null);
            profileForm.setValue("avatar", undefined);
        }
    };

    const uploadAvatar = async (
        file: File,
        userId: string
    ): Promise<string | null> => {
        try {
            const fileExt = file.name.split(".").pop();
            const fileName = `${userId}-${Date.now()}.${fileExt}`;
            const filePath = `avatars/${fileName}`;

            const { error: uploadError } = await supabase.storage
                .from("images")
                .upload(filePath, file);

            if (uploadError) {
                throw uploadError;
            }

            const { data: urlData } = supabase.storage
                .from("images")
                .getPublicUrl(filePath);

            return urlData.publicUrl;
        } catch (error) {
            console.error("Error uploading avatar:", error);
            return null;
        }
    };

    const onProfileSubmit = async (values: ProfileForm) => {
        setLoading(true);
        try {
            let avatarUrl = avatarPreview;

            if (values.avatar) {
                const newAvatarUrl = await uploadAvatar(
                    values.avatar,
                    currentUserId
                );
                if (newAvatarUrl) {
                    avatarUrl = newAvatarUrl;
                }
            }

            await updateDoc(doc(db, "users", currentUserId), {
                full_name: values.full_name,
                date_of_birth: values.date_of_birth,
                avatar: avatarUrl,
            });

            toast.success("Profile updated successfully!");
        } catch (error) {
            toast.error("Error updating profile: " + (error as Error).message);
        } finally {
            setLoading(false);
        }
    };

    const onPasswordSubmit = async (values: PasswordForm) => {
        setPasswordLoading(true);
        try {
            const user = auth.currentUser;
            if (!user || !user.email) {
                throw new Error("No authenticated user found");
            }

            const credential = EmailAuthProvider.credential(
                user.email,
                values.currentPassword
            );
            await reauthenticateWithCredential(user, credential);

            await updatePassword(user, values.newPassword);

            passwordForm.reset();
            toast.success("Password updated successfully!");
        } catch (error: any) {
            if (error.code === "auth/wrong-password") {
                toast.error("Current password is incorrect");
            } else if (error.code === "auth/weak-password") {
                toast.error("New password is too weak");
            } else {
                toast.error("Error updating password: " + error.message);
            }
        } finally {
            setPasswordLoading(false);
        }
    };

    return (
        <div className="max-w-4xl mx-auto p-6 space-y-6">
            <div className="space-y-2">
                <h1 className="text-3xl font-bold text-green-700">
                    Profile Settings
                </h1>
                <p className="text-muted-foreground">
                    Manage your account settings and preferences
                </p>
            </div>

            <Tabs defaultValue="profile" className="space-y-6">
                <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="profile">
                        Profile Information
                    </TabsTrigger>
                    <TabsTrigger value="password">Change Password</TabsTrigger>
                </TabsList>

                <TabsContent value="profile">
                    <Card>
                        <CardHeader>
                            <CardTitle>Profile Information</CardTitle>
                            <CardDescription>
                                Update your personal information and profile
                                picture
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <Form {...profileForm}>
                                <form
                                    onSubmit={profileForm.handleSubmit(
                                        onProfileSubmit
                                    )}
                                    className="space-y-6">
                                    <FormField
                                        control={profileForm.control}
                                        name="avatar"
                                        render={() => (
                                            <FormItem className="flex flex-col items-center">
                                                <FormLabel>
                                                    Profile Picture
                                                </FormLabel>
                                                <div className="relative">
                                                    <Avatar className="h-24 w-24">
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
                                                                handleAvatarChange(
                                                                    null
                                                                )
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
                                                                e.target
                                                                    .files?.[0];
                                                            handleAvatarChange(
                                                                file || null
                                                            );
                                                        }}
                                                        className="w-full max-w-xs"
                                                    />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <FormField
                                            control={profileForm.control}
                                            name="full_name"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>
                                                        Full Name
                                                    </FormLabel>
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

                                        <FormItem>
                                            <FormLabel>Email Address</FormLabel>
                                            <FormControl>
                                                <Input
                                                    value={userEmail}
                                                    disabled
                                                    className="bg-gray-50"
                                                />
                                            </FormControl>
                                        </FormItem>

                                        <FormField
                                            control={profileForm.control}
                                            name="date_of_birth"
                                            render={({ field }) => (
                                                <FormItem className="flex flex-col">
                                                    <FormLabel>
                                                        Date of Birth
                                                    </FormLabel>
                                                    <Popover>
                                                        <PopoverTrigger asChild>
                                                            <FormControl>
                                                                <Button
                                                                    variant={
                                                                        "outline"
                                                                    }
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
                                                                        <span>
                                                                            Pick
                                                                            a
                                                                            date
                                                                        </span>
                                                                    )}
                                                                    <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                                                </Button>
                                                            </FormControl>
                                                        </PopoverTrigger>
                                                        <PopoverContent
                                                            className="w-auto p-0"
                                                            align="start">
                                                            <Calendar
                                                                mode="single"
                                                                selected={
                                                                    field.value
                                                                }
                                                                onSelect={
                                                                    field.onChange
                                                                }
                                                                disabled={(
                                                                    date
                                                                ) =>
                                                                    date >
                                                                        new Date() ||
                                                                    date <
                                                                        new Date(
                                                                            "1900-01-01"
                                                                        )
                                                                }
                                                                initialFocus
                                                            />
                                                        </PopoverContent>
                                                    </Popover>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                    </div>

                                    <Button
                                        type="submit"
                                        disabled={loading}
                                        className="bg-green-600 hover:bg-green-700">
                                        {loading
                                            ? "Updating..."
                                            : "Update Profile"}
                                    </Button>
                                </form>
                            </Form>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="password">
                    <Card>
                        <CardHeader>
                            <CardTitle>Change Password</CardTitle>
                            <CardDescription>
                                Update your password to keep your account secure
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <Form {...passwordForm}>
                                <form
                                    onSubmit={passwordForm.handleSubmit(
                                        onPasswordSubmit
                                    )}
                                    className="space-y-6">
                                    <FormField
                                        control={passwordForm.control}
                                        name="currentPassword"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>
                                                    Current Password
                                                </FormLabel>
                                                <FormControl>
                                                    <div className="relative">
                                                        <Input
                                                            type={
                                                                showCurrentPassword
                                                                    ? "text"
                                                                    : "password"
                                                            }
                                                            placeholder="Enter current password"
                                                            {...field}
                                                        />
                                                        <Button
                                                            type="button"
                                                            variant="ghost"
                                                            size="sm"
                                                            className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                                                            onClick={() =>
                                                                setShowCurrentPassword(
                                                                    !showCurrentPassword
                                                                )
                                                            }>
                                                            {showCurrentPassword ? (
                                                                <EyeOff className="h-4 w-4" />
                                                            ) : (
                                                                <Eye className="h-4 w-4" />
                                                            )}
                                                        </Button>
                                                    </div>
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />

                                    <FormField
                                        control={passwordForm.control}
                                        name="newPassword"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>
                                                    New Password
                                                </FormLabel>
                                                <FormControl>
                                                    <div className="relative">
                                                        <Input
                                                            type={
                                                                showNewPassword
                                                                    ? "text"
                                                                    : "password"
                                                            }
                                                            placeholder="Enter new password"
                                                            {...field}
                                                        />
                                                        <Button
                                                            type="button"
                                                            variant="ghost"
                                                            size="sm"
                                                            className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                                                            onClick={() =>
                                                                setShowNewPassword(
                                                                    !showNewPassword
                                                                )
                                                            }>
                                                            {showNewPassword ? (
                                                                <EyeOff className="h-4 w-4" />
                                                            ) : (
                                                                <Eye className="h-4 w-4" />
                                                            )}
                                                        </Button>
                                                    </div>
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />

                                    <FormField
                                        control={passwordForm.control}
                                        name="confirmPassword"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>
                                                    Confirm New Password
                                                </FormLabel>
                                                <FormControl>
                                                    <div className="relative">
                                                        <Input
                                                            type={
                                                                showConfirmPassword
                                                                    ? "text"
                                                                    : "password"
                                                            }
                                                            placeholder="Confirm new password"
                                                            {...field}
                                                        />
                                                        <Button
                                                            type="button"
                                                            variant="ghost"
                                                            size="sm"
                                                            className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                                                            onClick={() =>
                                                                setShowConfirmPassword(
                                                                    !showConfirmPassword
                                                                )
                                                            }>
                                                            {showConfirmPassword ? (
                                                                <EyeOff className="h-4 w-4" />
                                                            ) : (
                                                                <Eye className="h-4 w-4" />
                                                            )}
                                                        </Button>
                                                    </div>
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />

                                    <Button
                                        type="submit"
                                        disabled={passwordLoading}
                                        className="bg-green-600 hover:bg-green-700">
                                        {passwordLoading
                                            ? "Updating..."
                                            : "Update Password"}
                                    </Button>
                                </form>
                            </Form>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
}
