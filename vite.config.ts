import inertia from '@inertiajs/vite';
import { wayfinder } from '@laravel/vite-plugin-wayfinder';
import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import laravel from 'laravel-vite-plugin';
import { bunny } from 'laravel-vite-plugin/fonts';
import { defineConfig } from 'vite';
import { readdirSync } from 'node:fs';
import { fileURLToPath, URL } from 'node:url';
import { join, relative, sep } from 'node:path';

const pageEntryDirectory = fileURLToPath(new URL('./resources/js/pages', import.meta.url));

function collectPageEntries(directory: string): string[] {
    return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
        const fullPath = join(directory, entry.name);

        if (entry.isDirectory()) {
            return collectPageEntries(fullPath);
        }

        if (!entry.isFile() || !entry.name.endsWith('.tsx')) {
            return [];
        }

        // Laravel's Vite helper needs every page as a build entry because
        // app.blade.php includes the active Inertia page file directly.
        return `resources/js/pages/${relative(pageEntryDirectory, fullPath).split(sep).join('/')}`;
    });
}

export default defineConfig({
    resolve: {
        alias: {
            '@': fileURLToPath(new URL('./resources/js', import.meta.url)),
        },
    },
    plugins: [
        laravel({
            input: [
                'resources/css/app.css',
                'resources/js/app.tsx',
                ...collectPageEntries(pageEntryDirectory),
            ],
            refresh: true,
            fonts: [
                bunny('Instrument Sans', {
                    weights: [400, 500, 600],
                }),
            ],
        }),
        inertia(),
        react({
            babel: {
                plugins: ['babel-plugin-react-compiler'],
            },
        }),
        tailwindcss(),
        wayfinder({
            formVariants: true,
        }),
    ],
});
