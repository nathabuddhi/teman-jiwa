"use client";

import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
    collection,
    getDocs,
    query,
    where,
    onSnapshot,
    doc,
    updateDoc,
    Timestamp,
    addDoc,
} from "firebase/firestore";
import { firestore as db } from "@/lib/firebase";
import { getCurrUserRole, getCurrUserId } from "@/handlers/auth";
import { Search, Clock, User, Calendar, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import type { Appointment } from "@/types/appointment";
import { toast } from "sonner";

interface Expert {
    id: string;
    full_name: string;
    specialization?: string;
}

export default function AppointmentPage() {
    const [appointments, setAppointments] = useState<Appointment[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [userRole, setUserRole] = useState<string>("");
    const [currentUserId, setCurrentUserId] = useState<string>("");
    const [searchTerm, setSearchTerm] = useState<string>("");
    const [userNames, setUserNames] = useState<Record<string, string>>({});
    const [expertNames, setExpertNames] = useState<Record<string, string>>({});
    const [experts, setExperts] = useState<Expert[]>([]);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [selectedExpert, setSelectedExpert] = useState<string>("");
    const [selectedDate, setSelectedDate] = useState<string>("");
    const [selectedTime, setSelectedTime] = useState<string>("");
    const [expertSearch, setExpertSearch] = useState<string>("");
    const [creating, setCreating] = useState(false);
    const navigate = useNavigate();

    const timeSlots = [
        "09:00",
        "10:00",
        "11:00",
        "12:00",
        "13:00",
        "14:00",
        "15:00",
        "16:00",
        "17:00",
    ];

    useEffect(() => {
        async function initializeData() {
            try {
                const [role, userId] = await Promise.all([
                    getCurrUserRole(),
                    getCurrUserId(),
                ]);
                setUserRole(role);
                setCurrentUserId(userId);

                const expertsSnapshot = await getDocs(
                    collection(db, "experts")
                );
                const expertsData: Expert[] = [];
                expertsSnapshot.forEach((doc) => {
                    expertsData.push({ id: doc.id, ...doc.data() } as Expert);
                });
                setExperts(expertsData);

                const [usersSnapshot, expertsNamesSnapshot] = await Promise.all(
                    [
                        getDocs(collection(db, "users")),
                        getDocs(collection(db, "experts")),
                    ]
                );

                const userNamesMap: Record<string, string> = {};
                const expertNamesMap: Record<string, string> = {};

                usersSnapshot.forEach((doc) => {
                    const data = doc.data();
                    userNamesMap[doc.id] = data.full_name || "Unknown User";
                });

                expertsNamesSnapshot.forEach((doc) => {
                    const data = doc.data();
                    expertNamesMap[doc.id] = data.full_name || "Unknown Expert";
                });

                setUserNames(userNamesMap);
                setExpertNames(expertNamesMap);

                setupAppointmentListener(role, userId);
            } catch (error) {
                toast.error(
                    "Error loading appointments: " + (error as Error).message
                );
                setLoading(false);
            }
        }

        initializeData();
    }, []);

    const setupAppointmentListener = (role: string, userId: string) => {
        let appointmentQuery;

        if (role === "admin") {
            appointmentQuery = collection(db, "appointments");
        } else if (role === "expert") {
            appointmentQuery = query(
                collection(db, "appointments"),
                where("expert_id", "==", userId)
            );
        } else {
            appointmentQuery = query(
                collection(db, "appointments"),
                where("user_id", "==", userId)
            );
        }

        const unsubscribe = onSnapshot(appointmentQuery, (snapshot) => {
            const appointmentData: Appointment[] = [];
            snapshot.forEach((doc) => {
                appointmentData.push({
                    id: doc.id,
                    ...doc.data(),
                } as Appointment);
            });

            appointmentData.sort(
                (a, b) => b.start_time.toMillis() - a.start_time.toMillis()
            );
            setAppointments(appointmentData);
            setLoading(false);
        });

        return unsubscribe;
    };

    const getStatusColor = (status: string) => {
        switch (status.toLowerCase().split(" ")[0]) {
            case "pending":
                return "bg-yellow-100 text-yellow-800";
            case "ongoing":
                return "bg-green-100 text-green-800";
            case "completed":
                return "bg-blue-100 text-blue-800";
            case "canceled":
                return "bg-red-100 text-red-800";
            default:
                return "bg-gray-100 text-gray-800";
        }
    };

    const handleAcceptAppointment = async (appointmentId: string) => {
        try {
            await updateDoc(doc(db, "appointments", appointmentId), {
                status: "Accepted",
            });
        } catch (error) {
            toast.error(
                "Error accepting appointment: " + (error as Error).message
            );
        }
    };

    const handleDeclineAppointment = async (appointmentId: string) => {
        try {
            await updateDoc(doc(db, "appointments", appointmentId), {
                status: "Canceled by Expert",
            });
        } catch (error) {
            toast.error(
                "Error declining appointment: " + (error as Error).message
            );
        }
    };

    const handleCancelAppointment = async (appointmentId: string) => {
        try {
            await updateDoc(doc(db, "appointments", appointmentId), {
                status: "Canceled by User",
            });
        } catch (error) {
            toast.error(
                "Error declining appointment: " + (error as Error).message
            );
        }
    };

    const handleStartAppointment = async (appointmentId: string) => {
        try {
            await updateDoc(doc(db, "appointments", appointmentId), {
                status: "Ongoing",
            });
            navigate(`/appointment/${appointmentId}`);
        } catch (error) {
            toast.error(
                "Error starting appointment: " + (error as Error).message
            );
        }
    };

    const handleChatWithExpert = (appointmentId: string) => {
        navigate(`/appointment/${appointmentId}`);
    };

    const checkExpertAvailability = async (
        expertId: string,
        dateTime: Date
    ) => {
        const startOfHour = new Date(dateTime);
        startOfHour.setMinutes(0, 0, 0);

        const endOfHour = new Date(startOfHour);
        endOfHour.setHours(endOfHour.getHours() + 1);

        const conflictingAppointments = query(
            collection(db, "appointments"),
            where("expert_id", "==", expertId),
            where("start_time", ">=", Timestamp.fromDate(startOfHour)),
            where("start_time", "<", Timestamp.fromDate(endOfHour)),
            where("status", "in", ["Pending", "Ongoing"])
        );

        const snapshot = await getDocs(conflictingAppointments);
        return snapshot.empty;
    };

    const handleCreateAppointment = async () => {
        if (!selectedExpert || !selectedDate || !selectedTime) return;

        setCreating(true);
        try {
            const [hours, minutes] = selectedTime.split(":").map(Number);
            const appointmentDate = new Date(selectedDate);
            appointmentDate.setHours(hours, minutes, 0, 0);

            const isAvailable = await checkExpertAvailability(
                selectedExpert,
                appointmentDate
            );

            if (!isAvailable) {
                toast.error(
                    "This time slot is not available. Please select another time."
                );
                setCreating(false);
                return;
            }

            const appointmentData = {
                expert_id: selectedExpert,
                user_id: currentUserId,
                status: "Pending",
                start_time: Timestamp.fromDate(appointmentDate),
                finished_time: null,
            };

            await addDoc(collection(db, "appointments"), appointmentData);

            setSelectedExpert("");
            setSelectedDate("");
            setSelectedTime("");
            setIsDialogOpen(false);
            toast.success("Appointment created successfully!");
        } catch (error) {
            toast.error("Error creating appointment: " + error);
        } finally {
            setCreating(false);
        }
    };

    const filteredAppointments = appointments.filter((appointment) => {
        const searchLower = searchTerm.toLowerCase();
        const userName = userNames[appointment.user_id]?.toLowerCase() || "";
        const expertName =
            expertNames[appointment.expert_id]?.toLowerCase() || "";
        const appointmentId = appointment.id?.toLowerCase() || "";

        return (
            userName.includes(searchLower) ||
            expertName.includes(searchLower) ||
            appointmentId.includes(searchLower)
        );
    });

    const filteredExperts = experts.filter((expert) =>
        expert.full_name.toLowerCase().includes(expertSearch.toLowerCase())
    );

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="text-center space-y-2">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto"></div>
                    <p className="text-muted-foreground">
                        Loading appointments...
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-6xl mx-auto p-6 space-y-6">
            <div className="space-y-4">
                <h1 className="text-3xl font-bold text-green-700">
                    Appointments
                </h1>

                <div className="flex gap-4">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                        <Input
                            placeholder="SEARCH APPOINTMENT HISTORY"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-10 bg-white"
                        />
                    </div>

                    {userRole === "user" && (
                        <Dialog
                            open={isDialogOpen}
                            onOpenChange={setIsDialogOpen}>
                            <DialogTrigger asChild>
                                <Button className="bg-green-600 hover:bg-green-700">
                                    <Plus className="h-4 w-4 mr-2" />
                                    NEW APPOINTMENT
                                </Button>
                            </DialogTrigger>
                            <DialogContent className="sm:max-w-md">
                                <DialogHeader>
                                    <DialogTitle>
                                        Create New Appointment
                                    </DialogTitle>
                                </DialogHeader>
                                <div className="space-y-4">
                                    <div className="space-y-2">
                                        <Select
                                            value={selectedExpert}
                                            onValueChange={setSelectedExpert}>
                                            <SelectTrigger className="w-full">
                                                <SelectValue placeholder="Choose an expert" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <div className="px-2 py-2">
                                                    <Input
                                                        placeholder="Search experts..."
                                                        value={expertSearch}
                                                        onChange={(e) =>
                                                            setExpertSearch(
                                                                e.target.value
                                                            )
                                                        }
                                                        className="w-full"
                                                    />
                                                </div>
                                                {filteredExperts.map(
                                                    (expert) => (
                                                        <SelectItem
                                                            key={expert.id}
                                                            value={expert.id}>
                                                            {expert.full_name}
                                                            {expert.specialization && (
                                                                <span className="text-sm text-muted-foreground ml-2">
                                                                    –{" "}
                                                                    {
                                                                        expert.specialization
                                                                    }
                                                                </span>
                                                            )}
                                                        </SelectItem>
                                                    )
                                                )}
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="date">
                                            Select Date
                                        </Label>
                                        <Input
                                            type="date"
                                            value={selectedDate}
                                            onChange={(e) =>
                                                setSelectedDate(e.target.value)
                                            }
                                            min={
                                                new Date()
                                                    .toISOString()
                                                    .split("T")[0]
                                            }
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="time">
                                            Select Time (GMT+7)
                                        </Label>
                                        <Select
                                            value={selectedTime}
                                            onValueChange={setSelectedTime}>
                                            <SelectTrigger className="w-full">
                                                <SelectValue placeholder="Choose time slot" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {timeSlots.map((time) => (
                                                    <SelectItem
                                                        key={time}
                                                        value={time}>
                                                        {time} WIB
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    <Button
                                        onClick={handleCreateAppointment}
                                        disabled={
                                            !selectedExpert ||
                                            !selectedDate ||
                                            !selectedTime ||
                                            creating
                                        }
                                        className="w-full bg-green-600 hover:bg-green-700">
                                        {creating
                                            ? "Creating..."
                                            : "Create Appointment"}
                                    </Button>
                                </div>
                            </DialogContent>
                        </Dialog>
                    )}
                </div>
            </div>

            <div className="space-y-4">
                {filteredAppointments.length === 0 ? (
                    <Card>
                        <CardContent className="p-8 text-center">
                            <p className="text-muted-foreground">
                                {userRole === "expert"
                                    ? "No appointments yet, rest while you can."
                                    : "No appointments found."}
                            </p>
                        </CardContent>
                    </Card>
                ) : (
                    filteredAppointments.map((appointment, _) => (
                        <Card key={appointment.id} className="bg-white">
                            <CardContent className="p-6">
                                <div className="flex justify-between items-start">
                                    <div className="space-y-2 flex-1">
                                        <h3 className="text-lg font-semibold text-green-700">
                                            Appointment #{appointment.id}
                                        </h3>

                                        <div className="space-y-1 text-sm">
                                            {userRole === "expert" ? (
                                                <div className="flex items-center gap-2">
                                                    <User className="h-4 w-4 text-gray-500" />
                                                    <span className="text-green-600">
                                                        Patient:
                                                    </span>
                                                    <span>
                                                        {userNames[
                                                            appointment.user_id
                                                        ] || "Unknown User"}
                                                    </span>
                                                </div>
                                            ) : (
                                                <div className="flex items-center gap-2">
                                                    <User className="h-4 w-4 text-gray-500" />
                                                    <span className="text-green-600">
                                                        Expert:
                                                    </span>
                                                    <span>
                                                        {expertNames[
                                                            appointment
                                                                .expert_id
                                                        ] || "Unknown Expert"}
                                                    </span>
                                                </div>
                                            )}

                                            <div className="flex items-center gap-2">
                                                <Calendar className="h-4 w-4 text-gray-500" />
                                                <span className="text-green-600">
                                                    Date & Time:
                                                </span>
                                                <span>
                                                    {appointment.start_time
                                                        .toDate()
                                                        .toLocaleDateString(
                                                            "id-ID",
                                                            {
                                                                day: "2-digit",
                                                                month: "2-digit",
                                                                year: "numeric",
                                                            }
                                                        )}{" "}
                                                    {appointment.start_time
                                                        .toDate()
                                                        .toLocaleTimeString(
                                                            "id-ID",
                                                            {
                                                                hour: "2-digit",
                                                                minute: "2-digit",
                                                            }
                                                        )}{" "}
                                                    WIB
                                                </span>
                                            </div>

                                            <div className="flex items-center gap-2">
                                                <Clock className="h-4 w-4 text-gray-500" />
                                                <span className="text-green-600">
                                                    Status:
                                                </span>
                                                {}
                                                <Badge
                                                    className={getStatusColor(
                                                        appointment.status
                                                    )}>
                                                    {appointment.status}
                                                </Badge>
                                            </div>
                                            {appointment.status ===
                                                "Accepted" && (
                                                <div className="text-xs text-gray-500 italic">
                                                    Your appointment will be
                                                    started by the expert
                                                    nearing the start time,
                                                    please wait patiently.
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    <div className="flex gap-2">
                                        {userRole === "expert" &&
                                            appointment.status ===
                                                "Pending" && (
                                                <>
                                                    <Button
                                                        variant="outline"
                                                        onClick={() =>
                                                            handleDeclineAppointment(
                                                                appointment.id
                                                            )
                                                        }
                                                        className="text-gray-600 border-red-300 hover:bg-red-200">
                                                        DECLINE
                                                    </Button>
                                                    <Button
                                                        onClick={() =>
                                                            handleAcceptAppointment(
                                                                appointment.id
                                                            )
                                                        }
                                                        className="bg-green-600 hover:bg-green-700">
                                                        ACCEPT
                                                    </Button>
                                                </>
                                            )}
                                        {userRole === "expert" &&
                                            appointment.status ===
                                                "Accepted" && (
                                                <>
                                                    <Button
                                                        onClick={() =>
                                                            handleStartAppointment(
                                                                appointment.id
                                                            )
                                                        }
                                                        className="bg-green-600 hover:bg-green-700">
                                                        START & OPEN CHAT
                                                    </Button>
                                                </>
                                            )}
                                        {userRole === "user" &&
                                            appointment.status ===
                                                "Pending" && (
                                                <Button
                                                    variant={"destructive"}
                                                    onClick={() =>
                                                        handleCancelAppointment(
                                                            appointment.id
                                                        )
                                                    }>
                                                    CANCEL
                                                </Button>
                                            )}
                                        {userRole === "user" &&
                                            appointment.status ===
                                                "Ongoing" && (
                                                <Button
                                                    onClick={() =>
                                                        handleChatWithExpert(
                                                            appointment.id
                                                        )
                                                    }
                                                    className="bg-green-600 hover:bg-green-700">
                                                    CHAT WITH EXPERT
                                                </Button>
                                            )}
                                        {appointment.status === "Completed" && (
                                            <Button
                                                className="bg-green-600 hover:bg-green-700"
                                                onClick={() =>
                                                    navigate(
                                                        `/appointment/${appointment.id}`
                                                    )
                                                }>
                                                OPEN CHAT HISTORY
                                            </Button>
                                        )}
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    ))
                )}
            </div>
        </div>
    );
}
