import type { AuthLayoutProps } from '@/types';

export default function AuthSplitLayout({
    children,
    title,
    description,
}: AuthLayoutProps) {
    return (
        <div className="min-h-screen bg-[#f5f6f8] text-[#1b2c4a]">
            <main className="flex min-h-screen items-center justify-center px-4 py-8 sm:px-6">
                <section className="grid w-full max-w-[1200px] overflow-hidden rounded-[2.3rem] bg-white shadow-[0_24px_45px_rgb(15_23_42/0.16)] lg:min-h-[616px] lg:grid-cols-[1.12fr_0.88fr]">
                    <div className="flex items-center justify-center bg-[#2d3d66] px-8 py-12 sm:px-12 lg:px-11">
                        <div className="flex aspect-square w-full max-w-[500px] items-center justify-center overflow-hidden rounded-full bg-[#151515] ring-[13px] ring-[#d7ad4d]">
                            <img
                                src="/logo.jpeg"
                                alt="Aurea Education logo"
                                className="h-full w-full object-cover"
                            />
                        </div>
                    </div>

                    <div className="flex items-center px-7 py-10 sm:px-12 lg:px-16">
                        <div className="mx-auto w-full max-w-[475px]">
                            <div className="mb-7 space-y-2">
                                <h1 className="text-2xl font-semibold text-[#303847]">
                                    {title}
                                </h1>
                                <p className="text-base tracking-wide text-[#1f314f]">
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
