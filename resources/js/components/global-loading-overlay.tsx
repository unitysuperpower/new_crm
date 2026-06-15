import { router } from '@inertiajs/react';
import { LoaderCircle } from 'lucide-react';
import { useEffect, useState } from 'react';

const loadingStartEvent = 'aurea:loading-start';
const loadingFinishEvent = 'aurea:loading-finish';

type LoadingMessage = {
    title: string;
    description: string;
};

type LoadingEvent = CustomEvent<Partial<LoadingMessage>>;

const defaultMessage: LoadingMessage = {
    title: 'Updating your workspace',
    description: 'Please wait while the system completes your request.',
};

export function beginGlobalLoading(
    title = defaultMessage.title,
    description = defaultMessage.description,
) {
    window.dispatchEvent(
        new CustomEvent(loadingStartEvent, {
            detail: { title, description },
        }),
    );

    let finished = false;

    return () => {
        if (finished) {
            return;
        }

        finished = true;
        window.dispatchEvent(new CustomEvent(loadingFinishEvent));
    };
}

export function GlobalLoadingOverlay() {
    const [activeRequests, setActiveRequests] = useState(0);
    const [message, setMessage] = useState(defaultMessage);

    useEffect(() => {
        const start = (nextMessage: Partial<LoadingMessage> = {}) => {
            setMessage({ ...defaultMessage, ...nextMessage });
            setActiveRequests((current) => current + 1);
        };
        const finish = () => {
            setActiveRequests((current) => Math.max(0, current - 1));
        };
        const handleCustomStart = (event: Event) => {
            start((event as LoadingEvent).detail);
        };

        const removeStartListener = router.on('start', (event) => {
            start(
                getRequestMessage(
                    event.detail.visit.url,
                    event.detail.visit.method,
                ),
            );
        });
        const removeFinishListener = router.on('finish', finish);

        window.addEventListener(loadingStartEvent, handleCustomStart);
        window.addEventListener(loadingFinishEvent, finish);

        return () => {
            removeStartListener();
            removeFinishListener();
            window.removeEventListener(loadingStartEvent, handleCustomStart);
            window.removeEventListener(loadingFinishEvent, finish);
        };
    }, []);

    if (activeRequests === 0) {
        return null;
    }

    return (
        <div
            className="fixed inset-0 z-[100] flex items-center justify-center bg-background/75 p-4 backdrop-blur-sm"
            role="status"
            aria-live="polite"
            aria-label={message.title}
        >
            <div className="flex w-full max-w-sm flex-col items-center gap-3 rounded-lg border bg-card px-6 py-5 text-card-foreground shadow-xl">
                <LoaderCircle className="size-8 animate-spin text-primary" />
                <div className="text-center">
                    <p className="text-sm font-semibold">{message.title}</p>
                    <p className="mt-1 text-xs text-muted-foreground">
                        {message.description}
                    </p>
                </div>
            </div>
        </div>
    );
}

function getRequestMessage(url: URL, method: string): LoadingMessage {
    const path = url.pathname;
    const requestMethod = method.toLowerCase();

    if (path === '/login' && requestMethod === 'post') {
        return {
            title: 'You are logging in',
            description:
                'The system is checking your credentials. Please wait.',
        };
    }

    if (path === '/logout') {
        return {
            title: 'Signing you out',
            description: 'Your secure session is being closed.',
        };
    }

    if (path === '/inquiries/import') {
        return {
            title: 'CSV inquiries are uploading',
            description:
                'Please wait while duplicates are checked and new inquiries are saved.',
        };
    }

    if (path === '/inquiries/assign') {
        return {
            title: 'Assigning inquiries',
            description:
                'The selected inquiries are being assigned to the user.',
        };
    }

    if (/^\/inquiries\/\d+\/activity$/.test(path)) {
        return {
            title: 'Updating inquiry',
            description:
                'Inquiry details and discussion history are being saved.',
        };
    }

    if (path === '/inquiries' && requestMethod === 'post') {
        return {
            title: 'Creating inquiry',
            description: 'The new student inquiry is being saved.',
        };
    }

    if (requestMethod === 'delete') {
        return {
            title: 'Removing record',
            description: 'Please wait while the selected record is removed.',
        };
    }

    if (['post', 'put', 'patch'].includes(requestMethod)) {
        return {
            title: 'Saving your changes',
            description:
                'The system is validating and updating the information.',
        };
    }

    return {
        title: 'Loading information',
        description: 'Please wait while the latest information is prepared.',
    };
}
