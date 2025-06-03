import {
    collection,
    doc,
    addDoc,
    updateDoc,
    deleteDoc,
    getDocs,
    getDoc,
    query,
    orderBy,
    limit,
    startAfter,
    onSnapshot,
    arrayUnion,
    arrayRemove,
    Timestamp,
    type DocumentSnapshot,
} from "firebase/firestore";
import { firestore as db } from "@/lib/firebase";
import supabase from "@/lib/supabase";
import type { Forum, Comment } from "@/types/forum";

export async function createForumPost(data: {
    title: string;
    content: string;
    user_id: string;
    images?: File[];
}): Promise<string> {
    try {
        let imageUrls: string[] = [];

        if (data.images && data.images.length > 0) {
            const uploadPromises = data.images.map(async (file) => {
                const fileName = `${Date.now()}-${file.name}`;
                const { data: uploadData, error } = await supabase.storage
                    .from("forums")
                    .upload(fileName, file);

                if (error) throw error;

                const { data: urlData } = supabase.storage
                    .from("forums")
                    .getPublicUrl(uploadData.path);

                return urlData.publicUrl;
            });

            imageUrls = await Promise.all(uploadPromises);
        }

        const forumData = {
            user_id: data.user_id,
            title: data.title,
            content: data.content,
            image_url: imageUrls,
            timestamp: Timestamp.now(),
            comments: [],
            likes: [],
        };

        const docRef = await addDoc(collection(db, "forums"), forumData);
        return docRef.id;
    } catch (error) {
        throw new Error(`Failed to create forum post: ${error}`);
    }
}

export async function getForumPosts(
    limitCount = 10,
    lastDoc?: DocumentSnapshot
) {
    try {
        let q = query(
            collection(db, "forums"),
            orderBy("timestamp", "desc"),
            limit(limitCount)
        );

        if (lastDoc) {
            q = query(
                collection(db, "forums"),
                orderBy("timestamp", "desc"),
                startAfter(lastDoc),
                limit(limitCount)
            );
        }

        const snapshot = await getDocs(q);
        const posts: Forum[] = [];

        snapshot.forEach((doc) => {
            posts.push({ id: doc.id, ...doc.data() } as Forum);
        });

        return {
            posts,
            lastDoc: snapshot.docs[snapshot.docs.length - 1],
            hasMore: snapshot.docs.length === limitCount,
        };
    } catch (error) {
        throw new Error(`Failed to fetch forum posts: ${error}`);
    }
}

export function subscribeToForumPosts(
    callback: (posts: Forum[]) => void,
    limitCount = 10
) {
    const q = query(
        collection(db, "forums"),
        orderBy("timestamp", "desc"),
        limit(limitCount)
    );

    return onSnapshot(q, (snapshot) => {
        const posts: Forum[] = [];
        snapshot.forEach((doc) => {
            posts.push({ id: doc.id, ...doc.data() } as Forum);
        });
        callback(posts);
    });
}

export async function getForumPost(postId: string): Promise<Forum | null> {
    try {
        const docRef = doc(db, "forums", postId);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
            return { id: docSnap.id, ...docSnap.data() } as Forum;
        }
        return null;
    } catch (error) {
        throw new Error(`Failed to fetch forum post: ${error}`);
    }
}

export function subscribeToForumPost(
    postId: string,
    callback: (post: Forum | null) => void
) {
    const docRef = doc(db, "forums", postId);

    return onSnapshot(docRef, (doc) => {
        if (doc.exists()) {
            callback({ id: doc.id, ...doc.data() } as Forum);
        } else {
            callback(null);
        }
    });
}

export async function updateForumPost(postId: string, data: Partial<Forum>) {
    try {
        const docRef = doc(db, "forums", postId);
        await updateDoc(docRef, data);
    } catch (error) {
        throw new Error(`Failed to update forum post: ${error}`);
    }
}

export async function deleteForumPost(postId: string) {
    try {
        const docRef = doc(db, "forums", postId);
        await deleteDoc(docRef);
    } catch (error) {
        throw new Error(`Failed to delete forum post: ${error}`);
    }
}

export async function toggleLike(postId: string, userId: string) {
    try {
        const docRef = doc(db, "forums", postId);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
            const data = docSnap.data() as Forum;
            const isLiked = data.likes.includes(userId);

            if (isLiked) {
                await updateDoc(docRef, {
                    likes: arrayRemove(userId),
                });
            } else {
                await updateDoc(docRef, {
                    likes: arrayUnion(userId),
                });
            }
        }
    } catch (error) {
        throw new Error(`Failed to toggle like: ${error}`);
    }
}

export async function addComment(
    postId: string,
    comment: {
        user_id: string;
        content: string;
        parentCommentId?: string;
    }
) {
    try {
        const newComment: Comment = {
            id: `comment_${Date.now()}_${Math.random()
                .toString(36)
                .substr(2, 9)}`,
            user_id: comment.user_id,
            content: comment.content,
            timestamp: Timestamp.now(),
            comments: [],
        };

        const docRef = doc(db, "forums", postId);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
            const data = docSnap.data() as Forum;
            let updatedComments = [...data.comments];

            if (comment.parentCommentId) {
                updatedComments = addNestedComment(
                    updatedComments,
                    comment.parentCommentId,
                    newComment
                );
            } else {
                updatedComments.push(newComment);
            }

            await updateDoc(docRef, { comments: updatedComments });
        }
    } catch (error) {
        throw new Error(`Failed to add comment: ${error}`);
    }
}

function addNestedComment(
    comments: Comment[],
    parentId: string,
    newComment: Comment
): Comment[] {
    return comments.map((comment) => {
        if (comment.id === parentId) {
            return {
                ...comment,
                comments: [...comment.comments, newComment],
            };
        } else if (comment.comments.length > 0) {
            return {
                ...comment,
                comments: addNestedComment(
                    comment.comments,
                    parentId,
                    newComment
                ),
            };
        }
        return comment;
    });
}

export async function updateComment(
    postId: string,
    commentId: string,
    content: string
) {
    try {
        const docRef = doc(db, "forums", postId);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
            const data = docSnap.data() as Forum;
            const updatedComments = updateCommentContent(
                data.comments,
                commentId,
                content
            );
            await updateDoc(docRef, { comments: updatedComments });
        }
    } catch (error) {
        throw new Error(`Failed to update comment: ${error}`);
    }
}

function updateCommentContent(
    comments: Comment[],
    commentId: string,
    content: string
): Comment[] {
    return comments.map((comment) => {
        if (comment.id === commentId) {
            return { ...comment, content };
        } else if (comment.comments.length > 0) {
            return {
                ...comment,
                comments: updateCommentContent(
                    comment.comments,
                    commentId,
                    content
                ),
            };
        }
        return comment;
    });
}

export async function deleteComment(postId: string, commentId: string) {
    try {
        const docRef = doc(db, "forums", postId);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
            const data = docSnap.data() as Forum;
            const updatedComments = removeComment(data.comments, commentId);
            await updateDoc(docRef, { comments: updatedComments });
        }
    } catch (error) {
        throw new Error(`Failed to delete comment: ${error}`);
    }
}

function removeComment(comments: Comment[], commentId: string): Comment[] {
    return comments
        .filter((comment) => comment.id !== commentId)
        .map((comment) => ({
            ...comment,
            comments: removeComment(comment.comments, commentId),
        }));
}

export async function getUserData(userId: string) {
    try {
        const docRef = doc(db, "users", userId);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
            return docSnap.data();
        }
        return null;
    } catch (error) {
        throw new Error(`Failed to fetch user data: ${error}`);
    }
}

export async function getUsersData(userIds: string[]) {
    try {
        const usersData: Record<string, any> = {};

        const promises = userIds.map(async (userId) => {
            const userData = await getUserData(userId);
            if (userData) {
                usersData[userId] = userData;
            }
        });

        await Promise.all(promises);
        return usersData;
    } catch (error) {
        throw new Error(`Failed to fetch users data: ${error}`);
    }
}
