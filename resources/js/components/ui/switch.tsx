import * as React from 'react';

import { cn } from '@/lib/utils';

function Switch({
    className,
    checked = false,
    disabled,
    onCheckedChange,
    ...props
}: Omit<React.ComponentProps<'button'>, 'onChange'> & {
    checked?: boolean;
    onCheckedChange?: (checked: boolean) => void;
}) {
    return (
        <button
            {...props}
            type="button"
            role="switch"
            aria-checked={checked}
            disabled={disabled}
            data-state={checked ? 'checked' : 'unchecked'}
            className={cn(
                'inline-flex h-5 w-9 shrink-0 items-center rounded-full border border-transparent bg-muted shadow-xs transition-colors outline-none focus-visible:ring-2 focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50 data-[state=checked]:bg-emerald-600',
                className,
            )}
            onClick={() => onCheckedChange?.(!checked)}
        >
            <span
                className={cn(
                    'pointer-events-none block size-4 rounded-full bg-background shadow-sm transition-transform',
                    checked ? 'translate-x-4' : 'translate-x-0',
                )}
            />
        </button>
    );
}

export { Switch };
