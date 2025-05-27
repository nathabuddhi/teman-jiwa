"use client";

import type React from "react";

import { useEffect, useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
    collection,
    doc,
    getDoc,
    onSnapshot,
    addDoc,
    updateDoc,
    Timestamp,
    query,
    orderBy,
} from "firebase/firestore";
import { firestore as db } from "@/lib/firebase";
import {
    getCurrUserRole,
    getCurrUserId,
    getCurrUserName,
} from "@/handlers/auth";
import { Plus, Send, ArrowLeft, PhoneOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import supabase from "@/lib/supabase";
import type { Appointment, Chat } from "@/types/appointment";
import { toast } from "sonner";
import { ScrollArea } from "@/components/ui/scroll-area";

export default function ChatPage() {
    const { appointmentId } = useParams();
    const navigate = useNavigate();
    const [appointment, setAppointment] = useState<Appointment | null>(null);
    const [chats, setChats] = useState<Chat[]>([]);
    const [newMessage, setNewMessage] = useState("");
    const [currentUserId, setCurrentUserId] = useState("");
    const [userRole, setUserRole] = useState("");
    const [userName, setUserName] = useState("");
    const [expertName, setExpertName] = useState("");
    const [loading, setLoading] = useState(true);
    const [canSendMessage, setCanSendMessage] = useState(true);
    const [uploading, setUploading] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        async function initializeChat() {
            if (!appointmentId) return;

            try {
                const [role, userId] = await Promise.all([
                    getCurrUserRole(),
                    getCurrUserId(),
                ]);
                setUserRole(role);
                setCurrentUserId(userId);

                const appointmentDoc = await getDoc(
                    doc(db, "appointments", appointmentId)
                );
                if (appointmentDoc.exists()) {
                    const appointmentData = {
                        id: appointmentDoc.id,
                        ...appointmentDoc.data(),
                    } as Appointment;
                    setAppointment(appointmentData);

                    const [userDoc, expertDoc] = await Promise.all([
                        getDoc(doc(db, "users", appointmentData.user_id)),
                        getDoc(doc(db, "experts", appointmentData.expert_id)),
                    ]);

                    if (userDoc.exists()) {
                        setUserName(userDoc.data().full_name || "Unknown User");
                    }
                    if (expertDoc.exists()) {
                        setExpertName(
                            expertDoc.data().full_name || "Unknown Expert"
                        );
                    }

                    checkMessagePermission(appointmentData);
                }

                const chatQuery = query(
                    collection(db, "appointments", appointmentId, "chats"),
                    orderBy("timestamp", "asc")
                );

                const unsubscribe = onSnapshot(chatQuery, (snapshot) => {
                    const chatData: Chat[] = [];
                    snapshot.forEach((doc) => {
                        chatData.push({ id: doc.id, ...doc.data() } as Chat);
                    });
                    setChats(chatData);
                    setLoading(false);
                });

                return unsubscribe;
            } catch (error) {
                toast.error("Error loading chat: " + (error as Error).message);
                setLoading(false);
            }
        }

        initializeChat();
    }, [appointmentId]);

    useEffect(() => {
        scrollToBottom();
    }, [chats]);

    const checkMessagePermission = (appointmentData: Appointment) => {
        if (
            appointmentData.status === "Completed" &&
            appointmentData.finished_time
        ) {
            const now = Timestamp.now();
            const finishedTime = appointmentData.finished_time;
            const fifteenMinutesAfter = new Timestamp(
                finishedTime.seconds + 15 * 60,
                finishedTime.nanoseconds
            );
            setCanSendMessage(now.toMillis() <= fifteenMinutesAfter.toMillis());
        } else {
            setCanSendMessage(appointmentData.status === "Ongoing");
        }
    };

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    const handleSendMessage = async () => {
        if (!newMessage.trim() || !appointment || !canSendMessage) return;

        try {
            const messageData = {
                user_id: currentUserId,
                user_name: await getCurrUserName(),
                content: newMessage.trim(),
                timestamp: Timestamp.now(),
                type: "text",
            };

            await addDoc(
                collection(db, "appointments", appointmentId!, "chats"),
                messageData
            );
            setNewMessage("");
        } catch (error) {
            toast.error("Error sending message: " + (error as Error).message);
        }
    };

    const handleImageUpload = async (
        event: React.ChangeEvent<HTMLInputElement>
    ) => {
        const file = event.target.files?.[0];
        if (!file || !appointment || !canSendMessage) return;

        setUploading(true);
        try {
            const fileExt = file.name.split(".").pop();
            const fileName = `${appointmentId}/${Date.now()}.${fileExt}`;

            const { error } = await supabase.storage
                .from("chats")
                .upload(fileName, file);

            if (error) throw error;

            const {
                data: { publicUrl },
            } = supabase.storage.from("chats").getPublicUrl(fileName);

            const messageData = {
                user_id:
                    userRole === "user" ? currentUserId : appointment.user_id,
                user_name: userRole === "user" ? userName : userName,
                expert_id:
                    userRole === "expert"
                        ? currentUserId
                        : appointment.expert_id,
                expert_name: userRole === "expert" ? expertName : expertName,
                content: publicUrl,
                timestamp: Timestamp.now(),
                type: "image",
            };

            await addDoc(
                collection(db, "appointments", appointmentId!, "chats"),
                messageData
            );
        } catch (error) {
            toast.error("Error uploading image: " + (error as Error).message);
        } finally {
            setUploading(false);
            if (fileInputRef.current) {
                fileInputRef.current.value = "";
            }
        }
    };

    const handleEndAppointment = async () => {
        if (!appointment || userRole !== "expert") return;

        try {
            await updateDoc(doc(db, "appointments", appointmentId!), {
                status: "Completed",
                finished_time: Timestamp.now(),
            });

            const messageData = {
                user_id: appointment.user_id,
                user_name: userName,
                expert_id: appointment.expert_id,
                expert_name: expertName,
                content:
                    "This appointment has been ended by the expert. Thank you for your time! You may still send messages for 15 minutes after this.",
                timestamp: Timestamp.now(),
                type: "system",
            };

            await addDoc(
                collection(db, "appointments", appointmentId!, "chats"),
                messageData
            );

            setAppointment((prev) => ({
                ...prev!,
                status: "Completed",
                finished_time: Timestamp.now(),
            }));
        } catch (error) {
            toast.error(
                "Error ending appointment: " + (error as Error).message
            );
        }
    };

    const isMyMessage = (chat: Chat) => {
        return chat.user_id === currentUserId;
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="text-center space-y-2">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto"></div>
                    <p className="text-muted-foreground">Loading chat...</p>
                </div>
            </div>
        );
    }

    if (!appointment) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[600px]">
                <p className="text-muted-foreground mb-3">
                    Appointment not found
                </p>
                <Button
                    className="bg-green-600 hover:bg-green-700"
                    onClick={() => navigate("/appointments")}>
                    Return to Appointments Page
                </Button>
            </div>
        );
    }

    return (
        <div className="w-full mx-auto h-[calc(100vh-75px)] flex flex-col bg-green-50">
            <Card className="rounded-none border-b">
                <CardHeader className="p-0">
                    <div className="flex items-center justify-between mr-6">
                        <div className="flex items-center gap-x-3">
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => navigate("/appointments")}
                                className="p-2">
                                <ArrowLeft className="h-4 w-4" />
                            </Button>
                            <Avatar>
                                <AvatarFallback className="bg-green-600 text-white">
                                    {userRole === "expert"
                                        ? userName.charAt(0)
                                        : expertName.charAt(0)}
                                </AvatarFallback>
                            </Avatar>
                            <div>
                                <h2 className="font-semibold">
                                    {userRole === "expert"
                                        ? userName
                                        : expertName}
                                </h2>
                                <Badge
                                    className={
                                        appointment.status === "Ongoing"
                                            ? "bg-green-100 text-green-800"
                                            : "bg-gray-100 text-gray-800"
                                    }>
                                    {appointment.status}
                                </Badge>
                            </div>
                        </div>

                        {userRole === "expert" &&
                            appointment.status === "Ongoing" && (
                                <Button
                                    onClick={handleEndAppointment}
                                    variant="destructive"
                                    size="sm">
                                    <PhoneOff className="h-4 w-4 mr-2" />
                                    End Appointment
                                </Button>
                            )}
                    </div>
                </CardHeader>
            </Card>

            <ScrollArea className="h-[515px] p-4 space-y-4 px-20">
                {chats.map((chat) => (
                    <div
                        key={chat.id}
                        className={`flex m-2 ${
                            chat.type === "system"
                                ? "justify-center"
                                : isMyMessage(chat)
                                ? "justify-end"
                                : "justify-start"
                        }`}>
                        <div
                            className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                                chat.type === "system"
                                    ? "bg-gray-200 text-gray-700 text-center text-sm"
                                    : isMyMessage(chat)
                                    ? "bg-green-600 text-white"
                                    : "bg-green-100 text-green-800"
                            }`}>
                            {chat.type === "image" ? (
                                <img
                                    src={chat.content || "/placeholder.svg"}
                                    alt="Shared image"
                                    className="rounded max-w-full h-auto"
                                />
                            ) : (
                                <p className="text-sm">{chat.content}</p>
                            )}
                            <p
                                className={`text-xs mt-1 ${
                                    chat.type === "system"
                                        ? "text-gray-500"
                                        : isMyMessage(chat)
                                        ? "text-green-100"
                                        : "text-green-600"
                                }`}>
                                {chat.timestamp
                                    .toDate()
                                    .toLocaleTimeString("id-ID", {
                                        hour: "2-digit",
                                        minute: "2-digit",
                                    })}
                            </p>
                        </div>
                    </div>
                ))}
                <div ref={messagesEndRef} />
                {chats.length === 0 && (
                    <>
                        <div className="flex align-middle justify-center w-full h-full">
                            No messages yet.
                        </div>
                    </>
                )}
            </ScrollArea>

            <Card className="rounded-none border-t">
                <CardContent className="px-4">
                    {!canSendMessage ? (
                        <div className="text-center py-4">
                            <p className="text-muted-foreground">
                                This appointment has ended. You can no longer
                                send messages.
                            </p>
                        </div>
                    ) : (
                        <div className="flex items-center gap-2">
                            <input
                                type="file"
                                ref={fileInputRef}
                                onChange={handleImageUpload}
                                accept="image/*"
                                className="hidden"
                            />
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => fileInputRef.current?.click()}
                                disabled={uploading}
                                className="p-2">
                                {uploading ? (
                                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-green-600" />
                                ) : (
                                    <Plus className="h-4 w-4" />
                                )}
                            </Button>
                            <Input
                                value={newMessage}
                                onChange={(e) => setNewMessage(e.target.value)}
                                placeholder="Write a message"
                                onKeyDown={(e) =>
                                    e.key === "Enter" && handleSendMessage()
                                }
                                className="flex-1"
                            />
                            <Button
                                onClick={handleSendMessage}
                                disabled={!newMessage.trim()}
                                className="bg-green-600 hover:bg-green-700 p-2">
                                <Send className="h-4 w-4" />
                            </Button>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
