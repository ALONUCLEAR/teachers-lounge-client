import axios, { HttpStatusCode } from "axios";
import { Post } from "../types/post";
import { environment } from "src/environments/environment";

const postsUrl = `${environment.serverUrl}/posts`;

export const getPostsBySubjects = async (requestingUserId: string, subjectIds: string[]): Promise<Post[]> => {
    const response = await axios.get(`${postsUrl}/by-subjects`, {
        headers: { userId: requestingUserId },
        params: { subjectIds }
    });

    if (response.status >= HttpStatusCode.MultipleChoices) {
        throw new Error(`Request to get posts by subjects [${subjectIds.join(', ')}] failed, returned with status ${response.status}`);
    }

    return response.data;
}

export const getPostById = async (requestingUserId: string, postId: string): Promise<Post | undefined> => {
       const response = await axios.get(`${postsUrl}/${postId}`, {
        headers: { userId: requestingUserId },
    });

    if (response.status >= HttpStatusCode.MultipleChoices) {
        throw new Error(`Request to get post ${postId} failed, returned with status ${response.status}`);
    }

    return response.data;
}

export const tryUpsertPost = async (requestingUserId: string, post: Post, selectedFiles: FileList | null , importantParticipants?: string[]): Promise<boolean> => {
    try {
        const formData = new FormData();

        post.media = undefined;
        formData.append('postJson', JSON.stringify(post));

        if (selectedFiles) {
             Array.from(selectedFiles).forEach(file => {
                formData.append('mediaFiles', file);
            });
        }

        const response = await axios.post(postsUrl, formData, {
            headers: { userId: requestingUserId },
            params: { importantParticipants },
        });

        if (response.status >= HttpStatusCode.MultipleChoices) {
            throw new Error(`Request to upsert post ${post.title} failed, returned with status ${response.status}`);
        }

        return true;
    } catch (error) {
        console.error(error);

        return false;
    }
}

export const tryDeletePost = async (requestingUserId: string, postId: string): Promise<boolean> => {
    try {
        const response = await axios.delete(`${postsUrl}/${postId}`, { headers: { userId: requestingUserId } });

        if (response.status >= HttpStatusCode.MultipleChoices) {
            throw new Error(`Request to delete post failed, returned with status ${response.status}`);
        }

        return response.data;
    } catch (error) {
        console.error(error);

        return false;
    }
}