"use client";

import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
    Heart,
    MessageCircle,
    Search,
    Plus,
    MoreVertical,
    Edit,
    Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Textarea } from "@/components/ui/textarea";
import { getCurrUserRole, getCurrUserId } from "@/handlers/auth";
import {
    getForumPosts,
    subscribeToForumPosts,
    createForumPost,
    deleteForumPost,
    toggleLike,
    getUsersData,
} from "@/handlers/forum";
import type { Forum } from "@/types/forum";
import { toast } from "sonner";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";

const createPostSchema = z.object({
    title: z.string().min(1, "Title is required").max(200, "Title too long"),
    content: z
        .string()
        .min(1, "Content is required")
        .max(5000, "Content too long"),
    images: z
        .array(z.instanceof(File))
        .max(5, "Maximum 5 images allowed")
        .optional(),
});

type CreatePostForm = z.infer<typeof createPostSchema>;

export default function ForumPage() {
    const [posts, setPosts] = useState<Forum[]>([]);
    const [loading, setLoading] = useState(true);
    const [loadingMore, setLoadingMore] = useState(false);
    const [hasMore, setHasMore] = useState(true);
    const [lastDoc, setLastDoc] = useState<any>(null);
    const [searchTerm, setSearchTerm] = useState("");
    const [userRole, setUserRole] = useState<string>("");
    const [currentUserId, setCurrentUserId] = useState<string>("");
    const [usersData, setUsersData] = useState<Record<string, any>>({});
    const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
    const [creating, setCreating] = useState(false);
    const navigate = useNavigate();

    const form = useForm<CreatePostForm>({
        resolver: zodResolver(createPostSchema),
        defaultValues: {
            title: "",
            content: "",
            images: [],
        },
    });

    useEffect(() => {
        async function initializeData() {
            try {
                const [role, userId] = await Promise.all([
                    getCurrUserRole(),
                    getCurrUserId(),
                ]);
                setUserRole(role);
                setCurrentUserId(userId);

                const result = await getForumPosts(10);
                setPosts(result.posts);
                setLastDoc(result.lastDoc);
                setHasMore(result.hasMore);

                const userIds = [
                    ...new Set(result.posts.map((post) => post.user_id)),
                ];
                const userData = await getUsersData(userIds);
                setUsersData(userData);

                setLoading(false);

                const unsubscribe = subscribeToForumPosts((newPosts) => {
                    setPosts((prevPosts) => {
                        const existingIds = new Set(prevPosts.map((p) => p.id));
                        const uniqueNewPosts = newPosts.filter(
                            (p) => !existingIds.has(p.id)
                        );

                        if (uniqueNewPosts.length > 0) {
                            const newUserIds = [
                                ...new Set(
                                    uniqueNewPosts.map((post) => post.user_id)
                                ),
                            ];
                            getUsersData(newUserIds).then((newUserData) => {
                                setUsersData((prev) => ({
                                    ...prev,
                                    ...newUserData,
                                }));
                            });
                        }

                        return newPosts;
                    });
                });

                return unsubscribe;
            } catch (error) {
                toast.error("Error loading forum: " + (error as Error).message);
                setLoading(false);
            }
        }

        initializeData();
    }, []);

    const loadMorePosts = useCallback(async () => {
        if (!hasMore || loadingMore) return;

        setLoadingMore(true);
        try {
            const result = await getForumPosts(10, lastDoc);
            setPosts((prev) => [...prev, ...result.posts]);
            setLastDoc(result.lastDoc);
            setHasMore(result.hasMore);

            const userIds = [
                ...new Set(result.posts.map((post) => post.user_id)),
            ];
            const userData = await getUsersData(userIds);
            setUsersData((prev) => ({ ...prev, ...userData }));
        } catch (error) {
            toast.error(
                "Error loading more posts: " + (error as Error).message
            );
        } finally {
            setLoadingMore(false);
        }
    }, [hasMore, loadingMore, lastDoc]);

    const handleCreatePost = async (data: CreatePostForm) => {
        if (!currentUserId) {
            toast.error("You must be logged in to create a post");
            return;
        }

        setCreating(true);
        try {
            await createForumPost({
                title: data.title,
                content: data.content,
                user_id: currentUserId,
                images: data.images,
            });

            form.reset();
            setIsCreateDialogOpen(false);
            toast.success("Post created successfully!");
        } catch (error) {
            toast.error("Error creating post: " + (error as Error).message);
        } finally {
            setCreating(false);
        }
    };

    const handleLike = async (postId: string) => {
        if (!currentUserId) {
            toast.error("You must be logged in to like posts");
            return;
        }

        try {
            await toggleLike(postId, currentUserId);
        } catch (error) {
            toast.error("Error toggling like: " + (error as Error).message);
        }
    };

    const handleDeletePost = async (postId: string) => {
        try {
            await deleteForumPost(postId);
            toast.success("Post deleted successfully!");
        } catch (error) {
            toast.error("Error deleting post: " + (error as Error).message);
        }
    };

    const canEditPost = (post: Forum) => {
        return userRole === "admin" || currentUserId === post.user_id;
    };

    const filteredPosts = posts.filter(
        (post) =>
            post.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
            post.content.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const formatTimeAgo = (timestamp: any) => {
        const now = new Date();
        const postTime = timestamp.toDate();
        const diffInMinutes = Math.floor(
            (now.getTime() - postTime.getTime()) / (1000 * 60)
        );

        if (diffInMinutes < 1) return "Just now";
        if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
        if (diffInMinutes < 1440)
            return `${Math.floor(diffInMinutes / 60)}h ago`;
        return `${Math.floor(diffInMinutes / 1440)}d ago`;
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="text-center space-y-2">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto"></div>
                    <p className="text-muted-foreground">Loading forum...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto p-6 space-y-6">
            <div className="space-y-4">
                <h1 className="text-3xl font-bold text-green-700">
                    Community Forum
                </h1>

                <div className="flex gap-4">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                        <Input
                            placeholder="Search posts..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-10 bg-white"
                        />
                    </div>

                    {currentUserId && (
                        <Dialog
                            open={isCreateDialogOpen}
                            onOpenChange={setIsCreateDialogOpen}>
                            <DialogTrigger asChild>
                                <Button className="bg-green-600 hover:bg-green-700">
                                    <Plus className="h-4 w-4 mr-2" />
                                    New Post
                                </Button>
                            </DialogTrigger>
                            <DialogContent className="sm:max-w-2xl">
                                <DialogHeader>
                                    <DialogTitle>Create New Post</DialogTitle>
                                </DialogHeader>
                                <Form {...form}>
                                    <form
                                        onSubmit={form.handleSubmit(
                                            handleCreatePost
                                        )}
                                        className="space-y-4">
                                        <FormField
                                            control={form.control}
                                            name="title"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>Title</FormLabel>
                                                    <FormControl>
                                                        <Input
                                                            placeholder="Enter post title..."
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
                                                    <FormLabel>
                                                        Content
                                                    </FormLabel>
                                                    <FormControl>
                                                        <Textarea
                                                            placeholder="Share your thoughts..."
                                                            className="min-h-[120px]"
                                                            {...field}
                                                        />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />

                                        <FormField
                                            control={form.control}
                                            name="images"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>
                                                        Images (Optional - Max
                                                        5)
                                                    </FormLabel>
                                                    <FormControl>
                                                        <div className="space-y-3">
                                                            <Input
                                                                type="file"
                                                                multiple
                                                                accept="image/*"
                                                                onChange={(
                                                                    e
                                                                ) => {
                                                                    const files =
                                                                        Array.from(
                                                                            e
                                                                                .target
                                                                                .files ||
                                                                                []
                                                                        );
                                                                    const currentImages =
                                                                        field.value ||
                                                                        [];
                                                                    const newImages =
                                                                        [
                                                                            ...currentImages,
                                                                            ...files,
                                                                        ].slice(
                                                                            0,
                                                                            5
                                                                        );
                                                                    field.onChange(
                                                                        newImages
                                                                    );
                                                                }}
                                                            />

                                                            {field.value &&
                                                                field.value
                                                                    .length >
                                                                    0 && (
                                                                    <div className="flex gap-x-5">
                                                                        {field.value.map(
                                                                            (
                                                                                file: File,
                                                                                index: number
                                                                            ) => (
                                                                                <div
                                                                                    key={
                                                                                        index
                                                                                    }
                                                                                    className="relative group">
                                                                                    <img
                                                                                        src={
                                                                                            URL.createObjectURL(
                                                                                                file
                                                                                            ) ||
                                                                                            "/placeholder.svg"
                                                                                        }
                                                                                        alt={`Preview ${
                                                                                            index +
                                                                                            1
                                                                                        }`}
                                                                                        className="max-w-50 max-h-24 object-cover rounded-md border"
                                                                                    />
                                                                                    <Button
                                                                                        type="button"
                                                                                        variant="destructive"
                                                                                        size="sm"
                                                                                        className="absolute -top-2 -right-2 h-6 w-6 rounded-full p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                                                                                        onClick={() => {
                                                                                            const newImages =
                                                                                                (
                                                                                                    field.value ??
                                                                                                    []
                                                                                                ).filter(
                                                                                                    (
                                                                                                        _: File,
                                                                                                        i: number
                                                                                                    ) =>
                                                                                                        i !==
                                                                                                        index
                                                                                                );
                                                                                            field.onChange(
                                                                                                newImages
                                                                                            );
                                                                                        }}>
                                                                                        ×
                                                                                    </Button>
                                                                                    <div className="absolute bottom-1 left-1 bg-black bg-opacity-50 text-white text-xs px-1 rounded">
                                                                                        {file
                                                                                            .name
                                                                                            .length >
                                                                                        15
                                                                                            ? `${file.name.substring(
                                                                                                  0,
                                                                                                  15
                                                                                              )}...`
                                                                                            : file.name}
                                                                                    </div>
                                                                                </div>
                                                                            )
                                                                        )}
                                                                    </div>
                                                                )}

                                                            {field.value &&
                                                                field.value
                                                                    .length >=
                                                                    5 && (
                                                                    <p className="text-sm text-amber-600">
                                                                        Maximum
                                                                        5 images
                                                                        allowed
                                                                    </p>
                                                                )}
                                                        </div>
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />

                                        <Button
                                            type="submit"
                                            disabled={creating}
                                            className="w-full bg-green-600 hover:bg-green-700">
                                            {creating
                                                ? "Creating..."
                                                : "Create Post"}
                                        </Button>
                                    </form>
                                </Form>
                            </DialogContent>
                        </Dialog>
                    )}
                </div>
            </div>

            <div className="space-y-4">
                {filteredPosts.length === 0 ? (
                    <Card>
                        <CardContent className="p-8 text-center">
                            <p className="text-muted-foreground">
                                No posts found.
                            </p>
                        </CardContent>
                    </Card>
                ) : (
                    filteredPosts.map((post) => (
                        <Card
                            key={post.id}
                            className="bg-white hover:shadow-md transition-shadow">
                            <CardHeader className="pb-3">
                                <div className="flex justify-between items-start">
                                    <div className="flex items-center gap-3">
                                        <Avatar className="h-10 w-10">
                                            <AvatarImage
                                                src={
                                                    usersData[post.user_id]
                                                        ?.avatar ||
                                                    "/placeholder.svg"
                                                }
                                            />
                                            <AvatarFallback>
                                                {usersData[
                                                    post.user_id
                                                ]?.full_name?.charAt(0) || "U"}
                                            </AvatarFallback>
                                        </Avatar>
                                        <div>
                                            <p className="font-medium">
                                                {usersData[post.user_id]
                                                    ?.full_name ||
                                                    "Unknown User"}
                                            </p>
                                            <p className="text-sm text-muted-foreground">
                                                {formatTimeAgo(post.timestamp)}
                                            </p>
                                        </div>
                                    </div>

                                    {canEditPost(post) && (
                                        <DropdownMenu>
                                            <DropdownMenuTrigger>
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    className="h-8 w-8 p-0">
                                                    <MoreVertical className="h-4 w-4" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end">
                                                <DropdownMenuItem
                                                    onClick={() =>
                                                        toast.warning(
                                                            "Editting posts aren't readily available yet, stay tuned!"
                                                        )
                                                    }>
                                                    <Edit className="h-4 w-4 mr-2" />
                                                    Edit Post
                                                </DropdownMenuItem>
                                                <DropdownMenuItem
                                                    onClick={() =>
                                                        handleDeletePost(
                                                            post.id
                                                        )
                                                    }
                                                    className="text-destructive">
                                                    <Trash2 className="h-4 w-4 mr-2" />
                                                    Delete Post
                                                </DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    )}
                                </div>
                            </CardHeader>

                            <CardContent className="space-y-4">
                                <div
                                    className="cursor-pointer"
                                    onClick={() =>
                                        navigate(`/forum/${post.id}`)
                                    }>
                                    <h3 className="text-xl font-semibold text-green-700 hover:text-green-800 transition-colors">
                                        {post.title}
                                    </h3>
                                    <p className="text-gray-700 mt-2 line-clamp-3">
                                        {post.content}
                                    </p>
                                </div>

                                {post.image_url &&
                                    post.image_url.length > 0 && (
                                        <div className="grid grid-cols-2 gap-2 mt-4">
                                            {post.image_url
                                                .slice(0, 4)
                                                .map((url, index) => (
                                                    <div
                                                        key={index}
                                                        className="relative border-2 rounded-2xl p-0.5">
                                                        <img
                                                            src={
                                                                url ||
                                                                "/placeholder.svg"
                                                            }
                                                            alt={`Post image ${
                                                                index + 1
                                                            }`}
                                                            className="w-full h-32 object-cover rounded-md cursor-pointer"
                                                            onClick={() =>
                                                                navigate(
                                                                    `/forum/${post.id}`
                                                                )
                                                            }
                                                        />
                                                        {index === 3 &&
                                                            post.image_url
                                                                .length > 4 && (
                                                                <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center rounded-md">
                                                                    <span className="text-white font-medium">
                                                                        +
                                                                        {post
                                                                            .image_url
                                                                            .length -
                                                                            4}{" "}
                                                                        more
                                                                    </span>
                                                                </div>
                                                            )}
                                                    </div>
                                                ))}
                                        </div>
                                    )}

                                <div className="flex items-center gap-4 pt-2">
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => handleLike(post.id)}
                                        className={`gap-2 ${
                                            post.likes.includes(currentUserId)
                                                ? "text-red-600 hover:text-red-700"
                                                : "text-gray-600 hover:text-red-600"
                                        }`}>
                                        <Heart
                                            className={`h-4 w-4 ${
                                                post.likes.includes(
                                                    currentUserId
                                                )
                                                    ? "fill-current"
                                                    : ""
                                            }`}
                                        />
                                        {post.likes.length}
                                    </Button>

                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() =>
                                            navigate(`/forum/${post.id}`)
                                        }
                                        className="gap-2 text-gray-600 hover:text-green-600">
                                        <MessageCircle className="h-4 w-4" />
                                        {post.comments.length}
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    ))
                )}

                {hasMore && (
                    <div className="flex justify-center pt-4">
                        <Button
                            onClick={loadMorePosts}
                            disabled={loadingMore}
                            variant="outline"
                            className="w-full max-w-xs">
                            {loadingMore ? "Loading..." : "Load More Posts"}
                        </Button>
                    </div>
                )}
            </div>
        </div>
    );
}
