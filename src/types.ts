export interface Generation {
    id: number;
    status: 'pending' | 'completed' | 'failed';
    image?: string;
    prompt: string;
    style: string;
    size: string;
    quality?: string;
    created_at?: string;
}
