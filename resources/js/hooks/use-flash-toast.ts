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
                errors?: Record<string, string>;
            };

            if (props.flash?.success) toast.success(props.flash.success);
            if (props.flash?.error) toast.error(props.flash.error);

            const validationError = Object.values(props.errors ?? {})[0];
            if (validationError) toast.error(validationError);
        });

        return () => {
            removeFlashListener();
            removeSuccessListener();
        };
    }, []);
}
