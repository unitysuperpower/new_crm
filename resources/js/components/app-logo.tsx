import AppLogoIcon from '@/components/app-logo-icon';

export default function AppLogo() {
    return (
        <>
            <AppLogoIcon className="size-9 rounded-md border bg-white object-cover shadow-sm" />
            <div className="ml-1 grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-semibold">Aurea Education</span>
                <span className="truncate text-[11px] text-sidebar-foreground/55">
                    Inquiry to Pass out Certificate management system
                </span>
            </div>
        </>
    );
}
