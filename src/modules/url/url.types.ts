export interface CreateUrlInput {
    originalUrl: string;
    shortCode?: string;
    expiresAt?: Date | null;
}
