"use client";

import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
    Heart,
    MessageCircle,
    Reply,
    MoreVertical,
    Edit,
    Trash2,
    ChevronDown,
    ChevronRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { getCurrUserRole, getCurrUserId } from "@/handlers/auth";
import {
    subscribeToForumPost,
    toggleLike,
    addComment,
    updateComment,
    deleteComment,
    deleteForumPost,
    getUsersData,
} from "@/handlers/forum";
import type { Forum, Comment } from "@/types/forum";
import { toast } from "sonner";
import { Lens } from "@/components/magicui/lens";

export default function ForumDetailPage() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [post, setPost] = useState<Forum | null>(null);
    const [loading, setLoading] = useState(true);
    const [userRole, setUserRole] = useState<string>("");
    const [currentUserId, setCurrentUserId] = useState<string>("");
    const [usersData, setUsersData] = useState<Record<string, any>>({});
    const [newComment, setNewComment] = useState("");
    const [replyingTo, setReplyingTo] = useState<string | null>(null);
    const [replyContent, setReplyContent] = useState("");
    const [editingComment, setEditingComment] = useState<string | null>(null);
    const [editContent, setEditContent] = useState("");
    const [expandedComments, setExpandedComments] = useState<Set<string>>(
        new Set()
    );
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        if (!id) return;

        async function initializeData() {
            try {
                const [role, userId] = await Promise.all([
                    getCurrUserRole(),
                    getCurrUserId(),
                ]);
                setUserRole(role);
                setCurrentUserId(userId);

                const unsubscribe = subscribeToForumPost(
                    id ?? "",
                    async (postData) => {
                        if (postData) {
                            setPost(postData);

                            const userIds = new Set([postData.user_id]);
                            const addUserIds = (comments: Comment[]) => {
                                comments.forEach((comment) => {
                                    userIds.add(comment.user_id);
                                    if (comment.comments.length > 0) {
                                        addUserIds(comment.comments);
                                    }
                                });
                            };
                            addUserIds(postData.comments);

                            const userData = await getUsersData(
                                Array.from(userIds)
                            );
                            setUsersData(userData);
                        } else {
                            navigate("/forum");
                            toast.error("Post not found");
                        }
                        setLoading(false);
                    }
                );

                return unsubscribe;
            } catch (error) {
                toast.error("Error loading post: " + (error as Error).message);
                setLoading(false);
            }
        }

        initializeData();
    }, [id, navigate]);

    const handleLike = async () => {
        if (!currentUserId || !post) {
            toast.error("You must be logged in to like posts");
            return;
        }

        try {
            await toggleLike(post.id, currentUserId);
        } catch (error) {
            toast.error("Error toggling like: " + (error as Error).message);
        }
    };

    const handleAddComment = async () => {
        if (!currentUserId || !post || !newComment.trim()) return;

        setSubmitting(true);
        try {
            await addComment(post.id, {
                user_id: currentUserId,
                content: newComment.trim(),
            });
            setNewComment("");
            toast.success("Comment added!");
        } catch (error) {
            toast.error("Error adding comment: " + (error as Error).message);
        } finally {
            setSubmitting(false);
        }
    };

    const handleReply = async (parentCommentId: string) => {
        if (!currentUserId || !post || !replyContent.trim()) return;

        setSubmitting(true);
        try {
            await addComment(post.id, {
                user_id: currentUserId,
                content: replyContent.trim(),
                parentCommentId,
            });
            setReplyingTo(null);
            setReplyContent("");
            toast.success("Reply added!");
        } catch (error) {
            toast.error("Error adding reply: " + (error as Error).message);
        } finally {
            setSubmitting(false);
        }
    };

    const handleEditComment = async (commentId: string) => {
        if (!post || !editContent.trim()) return;

        setSubmitting(true);
        try {
            await updateComment(post.id, commentId, editContent.trim());
            setEditingComment(null);
            setEditContent("");
            toast.success("Comment updated!");
        } catch (error) {
            toast.error("Error updating comment: " + (error as Error).message);
        } finally {
            setSubmitting(false);
        }
    };

    const handleDeleteComment = async (commentId: string) => {
        if (!post) return;

        try {
            await deleteComment(post.id, commentId);
            toast.success("Comment deleted!");
        } catch (error) {
            toast.error("Error deleting comment: " + (error as Error).message);
        }
    };

    const handleDeletePost = async () => {
        if (!post) return;

        try {
            await deleteForumPost(post.id);
            navigate("/forum");
            toast.success("Post deleted!");
        } catch (error) {
            toast.error("Error deleting post: " + (error as Error).message);
        }
    };

    const canEditPost = () => {
        return post && (userRole === "admin" || currentUserId === post.user_id);
    };

    const canEditComment = (comment: Comment) => {
        return userRole === "admin" || currentUserId === comment.user_id;
    };

    const toggleCommentExpansion = (commentId: string) => {
        setExpandedComments((prev) => {
            const newSet = new Set(prev);
            if (newSet.has(commentId)) {
                newSet.delete(commentId);
            } else {
                newSet.add(commentId);
            }
            return newSet;
        });
    };

    const formatTimeAgo = (timestamp: any) => {
        const now = new Date();
        const commentTime = timestamp.toDate();
        const diffInMinutes = Math.floor(
            (now.getTime() - commentTime.getTime()) / (1000 * 60)
        );

        if (diffInMinutes < 1) return "Just now";
        if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
        if (diffInMinutes < 1440)
            return `${Math.floor(diffInMinutes / 60)}h ago`;
        return `${Math.floor(diffInMinutes / 1440)}d ago`;
    };

    const renderComment = (comment: Comment, depth = 0) => {
        const isExpanded = expandedComments.has(comment.id);
        const hasReplies = comment.comments.length > 0;
        const maxDepth = 5;

        return (
            <div
                key={comment.id}
                className={`${
                    depth > 0 ? "ml-6 border-l-2 border-gray-200 pl-4" : ""
                }`}>
                <div className="space-y-3">
                    <div className="flex justify-between items-start">
                        <div className="flex items-center gap-3">
                            <Avatar className="h-8 w-8">
                                <AvatarImage
                                    src={
                                        usersData[comment.user_id]
                                            ?.avatar || "/placeholder.svg"
                                    }
                                />
                                <AvatarFallback>
                                    {usersData[
                                        comment.user_id
                                    ]?.full_name?.charAt(0) || "U"}
                                </AvatarFallback>
                            </Avatar>
                            <div>
                                <p className="font-medium text-sm">
                                    {usersData[comment.user_id]?.full_name ||
                                        "Unknown User"}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                    {formatTimeAgo(comment.timestamp)}
                                </p>
                            </div>
                        </div>

                        {canEditComment(comment) && (
                            <DropdownMenu>
                                <DropdownMenuTrigger>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        className="h-6 w-6 p-0">
                                        <MoreVertical className="h-3 w-3" />
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                    <DropdownMenuItem
                                        onClick={() => {
                                            setEditingComment(comment.id);
                                            setEditContent(comment.content);
                                        }}>
                                        <Edit className="h-3 w-3 mr-2" />
                                        Edit
                                    </DropdownMenuItem>
                                    <DropdownMenuItem
                                        onClick={() =>
                                            handleDeleteComment(comment.id)
                                        }
                                        className="text-destructive">
                                        <Trash2 className="h-3 w-3 mr-2" />
                                        Delete
                                    </DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        )}
                    </div>

                    {editingComment === comment.id ? (
                        <div className="space-y-2">
                            <Textarea
                                value={editContent}
                                onChange={(e) => setEditContent(e.target.value)}
                                className="min-h-[80px]"
                            />
                            <div className="flex gap-2">
                                <Button
                                    size="sm"
                                    onClick={() =>
                                        handleEditComment(comment.id)
                                    }
                                    disabled={submitting || !editContent.trim()}
                                    className="bg-green-600 hover:bg-green-700">
                                    {submitting ? "Saving..." : "Save"}
                                </Button>
                                <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => {
                                        setEditingComment(null);
                                        setEditContent("");
                                    }}>
                                    Cancel
                                </Button>
                            </div>
                        </div>
                    ) : (
                        <p className="text-gray-700">{comment.content}</p>
                    )}

                    <div className="flex items-center gap-4">
                        {depth < maxDepth && currentUserId && (
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                    setReplyingTo(
                                        replyingTo === comment.id
                                            ? null
                                            : comment.id
                                    );
                                    setReplyContent("");
                                }}
                                className="text-xs text-gray-600 hover:text-green-600 p-0 h-auto">
                                <Reply className="h-3 w-3 mr-1" />
                                Reply
                            </Button>
                        )}

                        {hasReplies && (
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() =>
                                    toggleCommentExpansion(comment.id)
                                }
                                className="text-xs text-gray-600 hover:text-green-600 p-0 h-auto">
                                {isExpanded ? (
                                    <ChevronDown className="h-3 w-3 mr-1" />
                                ) : (
                                    <ChevronRight className="h-3 w-3 mr-1" />
                                )}
                                {comment.comments.length}{" "}
                                {comment.comments.length === 1
                                    ? "reply"
                                    : "replies"}
                            </Button>
                        )}
                    </div>

                    {replyingTo === comment.id && (
                        <div className="space-y-2 ml-6">
                            <Textarea
                                placeholder="Write a reply..."
                                value={replyContent}
                                onChange={(e) =>
                                    setReplyContent(e.target.value)
                                }
                                className="min-h-[80px]"
                            />
                            <div className="flex gap-2">
                                <Button
                                    size="sm"
                                    onClick={() => handleReply(comment.id)}
                                    disabled={
                                        submitting || !replyContent.trim()
                                    }
                                    className="bg-green-600 hover:bg-green-700">
                                    {submitting ? "Replying..." : "Reply"}
                                </Button>
                                <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => {
                                        setReplyingTo(null);
                                        setReplyContent("");
                                    }}>
                                    Cancel
                                </Button>
                            </div>
                        </div>
                    )}
                </div>

                {hasReplies && isExpanded && (
                    <div className="mt-4 space-y-4">
                        {comment.comments.map((reply) =>
                            renderComment(reply, depth + 1)
                        )}
                    </div>
                )}

                {depth === 0 && <Separator className="my-4" />}
            </div>
        );
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="text-center space-y-2">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto"></div>
                    <p className="text-muted-foreground">Loading post...</p>
                </div>
            </div>
        );
    }

    if (!post) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <p className="text-muted-foreground">Post not found</p>
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto p-6 space-y-6">
            <Card className="bg-white">
                <CardHeader className="pb-3">
                    <div className="flex justify-between items-start">
                        <div className="flex items-center gap-3">
                            <Avatar className="h-12 w-12">
                                <AvatarImage
                                    src={
                                        usersData[post.user_id]?.avatar ||
                                        "/placeholder.svg"
                                    }
                                />
                                <AvatarFallback>
                                    {usersData[post.user_id]?.full_name?.charAt(
                                        0
                                    ) || "U"}
                                </AvatarFallback>
                            </Avatar>
                            <div>
                                <p className="font-medium">
                                    {usersData[post.user_id]?.full_name ||
                                        "Unknown User"}
                                </p>
                                <p className="text-sm text-muted-foreground">
                                    {formatTimeAgo(post.timestamp)}
                                </p>
                            </div>
                        </div>

                        {canEditPost() && (
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
                                    <DropdownMenuItem>
                                        <Edit className="h-4 w-4 mr-2" />
                                        Edit Post
                                    </DropdownMenuItem>
                                    <DropdownMenuItem
                                        onClick={handleDeletePost}
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
                    <h1 className="text-2xl font-bold text-green-700">
                        {post.title}
                    </h1>
                    <p className="text-gray-700 whitespace-pre-wrap">
                        {post.content}
                    </p>

                    {post.image_url && post.image_url.length > 0 && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {post.image_url.map((url, index) => (
                                <Lens zoomFactor={1.6} key={index}>
                                    <img
                                        key={index}
                                        src={url || "/placeholder.svg"}
                                        alt={`Post image ${index + 1}`}
                                        className="w-full h-64 object-cover rounded-md border-2 p-0.5"
                                    />
                                </Lens>
                            ))}
                        </div>
                    )}

                    <div className="flex items-center gap-4 pt-4">
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={handleLike}
                            className={`gap-2 ${
                                post.likes.includes(currentUserId)
                                    ? "text-red-600 hover:text-red-700"
                                    : "text-gray-600 hover:text-red-600"
                            }`}>
                            <Heart
                                className={`h-4 w-4 ${
                                    post.likes.includes(currentUserId)
                                        ? "fill-current"
                                        : ""
                                }`}
                            />
                            {post.likes.length}
                        </Button>

                        <div className="flex items-center gap-2 text-gray-600">
                            <MessageCircle className="h-4 w-4" />
                            {post.comments.length}
                        </div>
                    </div>
                </CardContent>
            </Card>

            <Card className="bg-white">
                <CardHeader>
                    <h2 className="text-xl font-semibold">
                        Comments ({post.comments.length})
                    </h2>
                </CardHeader>
                <CardContent className="space-y-6">
                    {currentUserId ? (
                        <div className="space-y-3">
                            <Textarea
                                placeholder="Write a comment..."
                                value={newComment}
                                onChange={(e) => setNewComment(e.target.value)}
                                className="min-h-[100px]"
                            />
                            <Button
                                onClick={handleAddComment}
                                disabled={submitting || !newComment.trim()}
                                className="bg-green-600 hover:bg-green-700">
                                {submitting ? "Posting..." : "Post Comment"}
                            </Button>
                        </div>
                    ) : (
                        <p className="text-muted-foreground text-center py-4">
                            Please log in to view and post comments.
                        </p>
                    )}

                    {currentUserId && (
                        <>
                            <Separator />

                            <div className="space-y-4">
                                {post.comments.length === 0 ? (
                                    <p className="text-muted-foreground text-center py-8">
                                        No comments yet. Be the first to
                                        comment!
                                    </p>
                                ) : (
                                    post.comments.map((comment) =>
                                        renderComment(comment)
                                    )
                                )}
                            </div>
                        </>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
