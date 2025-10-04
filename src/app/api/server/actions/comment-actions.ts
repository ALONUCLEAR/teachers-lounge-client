import axios, { HttpStatusCode } from "axios";
import { Comment, Post } from "../types/post";
import { environment } from "src/environments/environment";

const commentsUrl = `${environment.serverUrl}/comments`;

export const getCommentById = async (requestingUserId: string, commentId: string, depth = 1): Promise<Comment | undefined> => {
       const response = await axios.get(`${commentsUrl}/${commentId}?depth=${depth}`, {
        headers: { userId: requestingUserId },
    });

    if (response.status >= HttpStatusCode.MultipleChoices) {
        throw new Error(`Request to get comment ${commentId} failed, returned with status ${response.status}`);
    }

    return response.data;
}

export const tryUpsertComment = async (requestingUserId: string, comment: Comment, selectedFiles: FileList | null): Promise<boolean> => {
    try {
        const formData = new FormData();
        comment.media = undefined;
        formData.append('commentJson', JSON.stringify(comment));

        if (selectedFiles) {
             Array.from(selectedFiles).forEach(file => {
                formData.append('mediaFiles', file);
            });
        }

        const response = await axios.post(commentsUrl, formData, {
            headers: { userId: requestingUserId },
        });

        if (response.status >= HttpStatusCode.MultipleChoices) {
            throw new Error(`Request to upsert comment ${comment.body} failed, returned with status ${response.status}`);
        }

        return true;
    } catch (error) {
        console.error(error);

        return false;
    }
}

export const tryDeleteComment = async (requestingUserId: string, commentId: string): Promise<boolean> => {
    try {
        const response = await axios.delete(`${commentsUrl}/${commentId}`, { headers: { userId: requestingUserId } });

        if (response.status >= HttpStatusCode.MultipleChoices) {
            throw new Error(`Request to delete comment failed, returned with status ${response.status}`);
        }

        return response.data;
    } catch (error) {
        console.error(error);

        return false;
    }
}