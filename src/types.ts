export interface Generation {
    id: number;
    status: 'pending' | 'completed' | 'failed';
    image?: string;
    prompt: string;
    style: string;
    size: string;
    quality?: string;
    bedName?: string;
    engine?: string;
    timestamp?: number;
    created_at?: string;
    reference_image_url?: string;
}
