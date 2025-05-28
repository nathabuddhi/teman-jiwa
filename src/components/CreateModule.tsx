import { Button } from "@/components/ui/button";
import { z } from "zod";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { firestore as db } from "@/lib/firebase";
import { addDoc, collection } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { ScrollArea } from "@/components/ui/scroll-area";
import supabase from "@/lib/supabase";
import { Label } from "./ui/label";

const createModuleSchema = z.object({
    title: z.string().min(10).max(50),
    description: z.string().min(20).max(200),
    content: z.string().min(100).max(10000),
    quiz: z.array(
        z.object({
            question: z.string().min(1, "Question is required"),
            options: z
                .array(z.string().min(1, "Option cannot be empty"))
                .min(1, "At least one option is required"),
            answer: z.string().min(1, "Answer is required"),
        })
    ),
});

type ModuleFormData = z.infer<typeof createModuleSchema>;

export function CreateModule() {
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [open, setOpen] = useState(false);
    const form = useForm<ModuleFormData>({
        resolver: zodResolver(createModuleSchema),
        defaultValues: {
            title: "",
            description: "",
            content: "",
            quiz: [],
        },
    });

    const { fields, append, remove } = useFieldArray({
        control: form.control,
        name: "quiz",
    });

    useEffect(() => {
        if (!imageFile) {
            setPreviewUrl(null);
            return;
        }
        const url = URL.createObjectURL(imageFile);
        setPreviewUrl(url);

        return () => URL.revokeObjectURL(url);
    }, [imageFile]);

    async function onSubmit(data: ModuleFormData) {
        const auth = getAuth();
        const user = auth.currentUser;
        if (!user) return alert("You must be logged in.");

        try {
            let imageUrl = null;

            if (imageFile) {
                const fileExt = imageFile.name.split(".").pop();
                const fileName = `${user.uid}/${Date.now()}.${fileExt}`;
                const { data: _, error: uploadError } =
                    await supabase.storage
                        .from("modules")
                        .upload(fileName, imageFile);

                if (uploadError) throw uploadError;

                const { data: publicUrlData } = supabase.storage
                    .from("modules")
                    .getPublicUrl(fileName);

                imageUrl = publicUrlData.publicUrl;
            }

            await addDoc(collection(db, "modules"), {
                ...data,
                author_id: user.uid,
                last_modified: new Date(),
                image_url: imageUrl,
            });

            toast.success("Successfully created module!");
            setOpen(false);
            form.reset();
            setImageFile(null);
        } catch (error) {
            console.log(error);
            toast.error("Failed to create module: " + String(error));
        }
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="default">Create New Module</Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[700px] overflow-y-auto max-h-[90vh]">
                <ScrollArea>
                    <DialogHeader>
                        <DialogTitle>Create Module</DialogTitle>
                        <DialogDescription>
                            Create a new module by filling out the form below.
                        </DialogDescription>
                    </DialogHeader>
                    <Form {...form}>
                        <form
                            onSubmit={form.handleSubmit(onSubmit)}
                            className="space-y-6 p-2">
                            <FormField
                                control={form.control}
                                name="title"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Title</FormLabel>
                                        <FormControl>
                                            <Input
                                                placeholder="Module Title"
                                                {...field}
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="description"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Description</FormLabel>
                                        <FormControl>
                                            <Input
                                                placeholder="Brief description"
                                                {...field}
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="content"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Content</FormLabel>
                                        <FormControl>
                                            <textarea
                                                className="w-full p-2 border rounded-md min-h-[120px]"
                                                placeholder="Content of the module"
                                                {...field}
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormItem>
                                <Label htmlFor="picture">Picture</Label>
                                <Input
                                    id="picture"
                                    type="file"
                                    accept="image/*"
                                    onChange={(e) => {
                                        const file =
                                            e.target.files?.[0] ?? null;
                                        setImageFile(file);
                                    }}
                                />
                            </FormItem>

                            {previewUrl && (
                                <div className="w-40 h-40 mt-2 border rounded overflow-hidden">
                                    <img
                                        src={previewUrl}
                                        alt="Preview"
                                        className="object-cover w-full h-full"
                                    />
                                </div>
                            )}

                            <div className="space-y-4">
                                <FormLabel>Quiz</FormLabel>
                                {fields.map((field, index) => (
                                    <div
                                        key={field.id}
                                        className="border p-4 rounded-md space-y-2">
                                        <FormField
                                            control={form.control}
                                            name={`quiz.${index}.question`}
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>
                                                        Question
                                                    </FormLabel>
                                                    <FormControl>
                                                        <Input
                                                            placeholder="Enter question"
                                                            {...field}
                                                        />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />

                                        <FormField
                                            control={form.control}
                                            name={`quiz.${index}.options`}
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>
                                                        Options
                                                        (comma-separated)
                                                    </FormLabel>
                                                    <FormControl>
                                                        <Input
                                                            placeholder="Option1, Option2, Option3"
                                                            value={
                                                                field.value?.join(
                                                                    ", "
                                                                ) || ""
                                                            }
                                                            onChange={(e) =>
                                                                form.setValue(
                                                                    `quiz.${index}.options`,
                                                                    e.target.value
                                                                        .split(
                                                                            ","
                                                                        )
                                                                        .map(
                                                                            (
                                                                                s
                                                                            ) =>
                                                                                s.trim()
                                                                        )
                                                                )
                                                            }
                                                        />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />

                                        <FormField
                                            control={form.control}
                                            name={`quiz.${index}.answer`}
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>
                                                        Correct Answer
                                                    </FormLabel>
                                                    <FormControl>
                                                        <Input
                                                            placeholder="Answer"
                                                            {...field}
                                                        />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />

                                        <Button
                                            type="button"
                                            variant="destructive"
                                            onClick={() => remove(index)}>
                                            Remove Question
                                        </Button>
                                    </div>
                                ))}

                                <Button
                                    type="button"
                                    onClick={() =>
                                        append({
                                            question: "",
                                            options: [],
                                            answer: "",
                                        })
                                    }>
                                    Add Quiz Question
                                </Button>
                            </div>

                            <DialogFooter className="pt-4">
                                <Button type="submit">Save Module</Button>
                            </DialogFooter>
                        </form>
                    </Form>
                </ScrollArea>
            </DialogContent>
        </Dialog>
    );
}
