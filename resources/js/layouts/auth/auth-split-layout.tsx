import { Link } from '@inertiajs/react';
import { CheckCircle2, GraduationCap, ShieldCheck } from 'lucide-react';
import { home } from '@/routes';
import type { AuthLayoutProps } from '@/types';

export default function AuthSplitLayout({
    children,
    title,
    description,
}: AuthLayoutProps) {
    return (
        <div className="min-h-screen bg-background text-foreground">
            <main className="mx-auto grid min-h-screen w-full max-w-[1440px] lg:grid-cols-[1.08fr_0.92fr]">
                <section className="flex flex-col justify-between gap-12 border-b px-6 py-8 sm:px-10 lg:border-r lg:border-b-0 lg:px-16 lg:py-12 xl:px-20">
                    <div className="space-y-12">
                        <Link href={home()} className="flex items-center gap-3">
                            <div className="flex size-12 items-center justify-center overflow-hidden rounded-md border bg-white shadow-sm">
                                <img
                                    src="/logo.jpeg"
                                    alt="Aurea Education logo"
                                    className="size-full object-contain p-1"
                                />
                            </div>
                            <div>
                                <h1 className="text-lg font-semibold">
                                    Aurea Education
                                </h1>
                                <p className="text-xs font-medium text-muted-foreground">
                                    Inquiry management workspace
                                </p>
                            </div>
                        </Link>

                        <div className="max-w-2xl space-y-5">
                            <div className="inline-flex items-center gap-2 text-sm font-medium text-primary">
                                <GraduationCap className="size-4" />
                                Education operations CRM
                            </div>
                            <h2 className="max-w-xl text-4xl font-semibold text-balance sm:text-5xl lg:text-[3.5rem] lg:leading-[1.08]">
                                One clear workspace for every student inquiry.
                            </h2>
                            <p className="max-w-xl text-base leading-7 text-muted-foreground">
                                Coordinate assignments, follow-ups, campus
                                visibility, programs, and discussion history
                                with controlled employee access.
                            </p>
                        </div>

                        <div className="grid max-w-xl gap-3 sm:grid-cols-2">
                            <Feature text="Assigned inquiry workflows" />
                            <Feature text="Role-based permissions" />
                            <Feature text="CSV review and imports" />
                            <Feature text="Follow-up report exports" />
                        </div>
                    </div>

                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <ShieldCheck className="size-4 text-primary" />
                        Access is managed by your Aurea Education administrator.
                    </div>
                </section>

                <section className="flex items-center bg-muted/35 px-6 py-12 sm:px-10 lg:px-14 xl:px-20">
                    <div className="mx-auto w-full max-w-md">
                        <div className="crm-panel p-6 shadow-lg sm:p-8">
                            <div className="mb-7 space-y-2">
                                <div className="text-sm font-medium text-primary">
                                    Secure sign in
                                </div>
                                <h1 className="text-2xl font-semibold">
                                    {title}
                                </h1>
                                <p className="text-sm leading-6 text-muted-foreground">
                                    {description}
                                </p>
                            </div>

                            {children}
                        </div>
                    </div>
                </section>
            </main>
        </div>
    );
}

function Feature({ text }: { text: string }) {
    return (
        <div className="flex items-center gap-2.5 rounded-md border bg-card px-3 py-3 text-sm font-medium shadow-[0_1px_2px_rgb(0_0_0/0.03)]">
            <CheckCircle2 className="size-4 shrink-0 text-primary" />
            {text}
        </div>
    );
}
