import { useState } from "react";
import { collection, addDoc, Timestamp } from "firebase/firestore";
import { firestore } from "@/lib/firebase";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";

export default function ContactPage() {
    const [formData, setFormData] = useState({
        name: "",
        email: "",
        subject: "",
        message: "",
    });

    const [loading, setLoading] = useState(false);

    function handleChange(
        e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
    ) {
        setFormData({
            ...formData,
            [e.target.id]: e.target.value,
        });
    }

    async function handleSubmitClick(e: React.FormEvent) {
        e.preventDefault();

        if (
            formData.name === "" ||
            formData.email === "" ||
            formData.subject === "" ||
            formData.message === ""
        ) {
            toast.error("All fields are required.");
            return;
        }

        setLoading(true);

        try {
            await addDoc(collection(firestore, "inquiries"), {
                ...formData,
                timestamp: Timestamp.now(),
            });

            toast.success("Message submitted successfully!");
            setFormData({ name: "", email: "", subject: "", message: "" });
        } catch (err) {
            toast.error("Something went wrong. Please try again.");
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="min-h-screen bg-white">
            <div className="max-w-6xl mx-auto px-4 py-12">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
                    <div className="bg-white/20 backdrop-blur-sm rounded-lg p-8">
                        <h1 className="text-4xl font-bold text-green-800 mb-6">
                            CONTACT
                            <br />
                            JIWATEAM
                        </h1>
                        <p className="text-green-700 leading-relaxed">
                            Have questions or need support?
                            <br />
                            Get in touch with us and we're here to help.
                        </p>
                    </div>

                    <div className="bg-white/30 backdrop-blur-sm rounded-lg p-8">
                        <form
                            onSubmit={handleSubmitClick}
                            className="space-y-6">
                            <div>
                                <Label
                                    htmlFor="name"
                                    className="text-green-800 font-medium">
                                    Name
                                </Label>
                                <Input
                                    id="name"
                                    type="text"
                                    value={formData.name}
                                    onChange={handleChange}
                                    className="mt-2 bg-white/70 border-green-200 focus:border-green-400"
                                    placeholder="Your full name"
                                />
                            </div>

                            <div>
                                <Label
                                    htmlFor="email"
                                    className="text-green-800 font-medium">
                                    Email
                                </Label>
                                <Input
                                    id="email"
                                    type="email"
                                    value={formData.email}
                                    onChange={handleChange}
                                    className="mt-2 bg-white/70 border-green-200 focus:border-green-400"
                                    placeholder="your.email@example.com"
                                />
                            </div>

                            <div>
                                <Label
                                    htmlFor="subject"
                                    className="text-green-800 font-medium">
                                    Subject
                                </Label>
                                <Input
                                    id="subject"
                                    type="text"
                                    value={formData.subject}
                                    onChange={handleChange}
                                    className="mt-2 bg-white/70 border-green-200 focus:border-green-400"
                                    placeholder="What is this about?"
                                />
                            </div>

                            <div>
                                <Label
                                    htmlFor="message"
                                    className="text-green-800 font-medium">
                                    Message
                                </Label>
                                <Textarea
                                    id="message"
                                    rows={6}
                                    value={formData.message}
                                    onChange={handleChange}
                                    className="mt-2 bg-white/70 border-green-200 focus:border-green-400 resize-none"
                                    placeholder="Tell us more about your inquiry..."
                                />
                            </div>

                            <Button
                                type="submit"
                                className="w-full bg-green-600 hover:bg-green-700 text-white font-medium py-3"
                                disabled={loading}>
                                {loading ? "Submitting..." : "Submit"}
                            </Button>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
}
