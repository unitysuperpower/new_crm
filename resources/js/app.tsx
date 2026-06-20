import { createInertiaApp, router } from '@inertiajs/react';
import { useEffect  } from 'react';
import type {ComponentType} from 'react';
import { GlobalLoadingOverlay } from '@/components/global-loading-overlay';
import { Toaster } from '@/components/ui/sonner';
import { TooltipProvider } from '@/components/ui/tooltip';
import { initializeTheme } from '@/hooks/use-appearance';
import AppLayout from '@/layouts/app-layout';
import AuthLayout from '@/layouts/auth-layout';
import SettingsLayout from '@/layouts/settings/layout';

const appName = import.meta.env.VITE_APP_NAME || 'Laravel';
const pages = import.meta.glob('./pages/**/*.tsx');
const localTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
const timezoneCookieChanged = persistBrowserTimezone(localTimezone);

function persistBrowserTimezone(timezone: string): boolean {
    if (!timezone) {
        return false;
    }

    const storedTimezone = document.cookie
        .split('; ')
        .find((cookie) => cookie.startsWith('client_timezone='))
        ?.split('=')[1];

    if (storedTimezone === encodeURIComponent(timezone)) {
        return false;
    }

    document.cookie = `client_timezone=${encodeURIComponent(timezone)}; path=/; max-age=31536000; samesite=lax`;

    return true;
}

function BrowserTimezoneSync() {
    useEffect(() => {
        if (timezoneCookieChanged) {
            router.reload({ preserveScroll: true, preserveState: true });
        }
    }, []);

    return null;
}

createInertiaApp({
    resolve: async (name) => {
        const page = pages[`./pages/${name}.tsx`];

        if (!page) {
            throw new Error(`Page not found: ${name}`);
        }

        return ((await page()) as { default: ComponentType }).default;
    },
    title: (title) => (title ? `${title} - ${appName}` : appName),
    layout: (name) => {
        switch (true) {
            case name === 'welcome':
                return null;
            case name.startsWith('auth/'):
                return AuthLayout;
            case name.startsWith('settings/'):
            case name.startsWith('users/'):
                return [AppLayout, SettingsLayout];
            default:
                return AppLayout;
        }
    },
    strictMode: true,
    withApp(app) {
        return (
            <TooltipProvider delayDuration={0}>
                {app}
                <BrowserTimezoneSync />
                <GlobalLoadingOverlay />
                <Toaster />
            </TooltipProvider>
        );
    },
    progress: {
        color: '#4B5563',
    },
    defaults: {
        visitOptions: (_href, options) => ({
            headers: {
                ...options.headers,
                ...(localTimezone ? { 'X-Timezone': localTimezone } : {}),
            },
        }),
    },
});

// This will set light / dark mode on load...
initializeTheme();
