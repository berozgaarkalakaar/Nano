export interface Generation {
    id: number;
    status: 'pending' | 'completed' | 'failed';
    image?: string;
    prompt: string;
    style: string;
    size: string;
    quality?: string;
    created_at?: string;
    created_at?: string;
    reference_image_url?: string;
}
