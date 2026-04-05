export interface ApiErrorShape {
    statusCode: number;
    message: string;
    error?: string;
    details?: unknown;
}
export interface ApiResponse<T> {
    data: T;
    meta: {
        timestamp: string;
    };
}
export interface PaginatedResponse<T> {
    items: T[];
    total: number;
}
//# sourceMappingURL=api.d.ts.map