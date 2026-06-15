import { router } from '@inertiajs/react';
import { useEffect } from 'react';
import { toast } from 'sonner';
import type { FlashToast } from '@/types/ui';

export function useFlashToast(): void {
    useEffect(() => {
        const removeFlashListener = router.on('flash', (event) => {
            const flash = (event as CustomEvent).detail?.flash;
            const data = flash?.toast as FlashToast | undefined;

            if (!data) {
                return;
            }

            toast[data.type](data.message);
        });

        const removeSuccessListener = router.on('success', (event) => {
            const props = event.detail.page.props as {
                flash?: { success?: string | null; error?: string | null };
            };

            if (props.flash?.success) {
                toast.success(props.flash.success);
            }

            if (props.flash?.error) {
                toast.error(props.flash.error);
            }
        });

        const removeErrorListener = router.on('error', (event) => {
            const messages = [
                ...new Set(Object.values(event.detail.errors)),
            ].filter(Boolean);

            if (messages.length === 0) {
                toast.error('Please check the form and try again.');

                return;
            }

            messages.slice(0, 3).forEach((message) => toast.error(message));
        });

        const removeHttpExceptionListener = router.on('httpException', () => {
            toast.error(
                'The server could not complete the request. Try again.',
            );
        });

        const removeNetworkErrorListener = router.on('networkError', () => {
            toast.error(
                'Network connection failed. Check your connection and retry.',
            );
        });

        return () => {
            removeFlashListener();
            removeSuccessListener();
            removeErrorListener();
            removeHttpExceptionListener();
            removeNetworkErrorListener();
        };
    }, []);
}

export function showErrorToast(message: string): void {
    toast.error(message);
}
