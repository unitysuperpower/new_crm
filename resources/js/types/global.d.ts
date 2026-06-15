import type { Auth } from '@/types/auth';

declare module 'react' {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    interface InputHTMLAttributes<T> {
        passwordrules?: string;
    }
}

declare module '@inertiajs/core' {
    export interface InertiaConfig {
        sharedPageProps: {
            name: string;
            auth: Auth;
            campusVisibility: Array<{
                id: number;
                name: string;
                is_active: boolean;
            }>;
            sidebarOpen: boolean;
            [key: string]: unknown;
        };
    }
}
