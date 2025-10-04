import { MediaItem, MediaType } from "../api/server/types/post";

export const ConvertMediaItemToFile = (media: MediaItem, filename = "file"): File => {
    const byteString = atob(media.data);
    const byteArray = new Uint8Array([...byteString].map(char => char.charCodeAt(0)));

    const blob = new Blob([byteArray], { type: media.type });
    const extension = media.type.split('/').at(-1); // the last part of the media type is the format name

    return new File([blob], `${filename}.${extension}`, { type: media.type });
};

export const ConvertMediaToFileList = (media: MediaItem[]): FileList => {
    const dataTransfer = new DataTransfer();

    media.forEach((item, index) => {
        const file = ConvertMediaItemToFile(item, `file-${index}`);
        dataTransfer.items.add(file);
    });

    return dataTransfer.files;
};

const readFileAsBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();

        reader.onload = () => {
            resolve(reader.result as string); // full base64 data URI
        };

        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
};

export const ConvertFileToMediaItem = async (file: File): Promise<MediaItem> => {
    const fullFileBase64 = await readFileAsBase64(file);
    const [, data] = fullFileBase64.split(',');

    return { type: file.type as MediaType, data };
}

export const ConvertFileListToMedia = (files: FileList): Promise<MediaItem[]> =>
    Promise.all(Array.from(files).map(ConvertFileToMediaItem));