import { Form, Head } from '@inertiajs/react';
import { LockKeyhole, UserRound } from 'lucide-react';
import InputError from '@/components/input-error';
import TextLink from '@/components/text-link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Spinner } from '@/components/ui/spinner';
import { store } from '@/routes/login';
import { request } from '@/routes/password';

type Props = {
    status?: string;
    canResetPassword: boolean;
};

export default function Login({ status, canResetPassword }: Props) {
    return (
        <>
            <Head title="Log in" />

            <Form
                {...store.form()}
                resetOnSuccess={['password']}
                className="flex flex-col gap-5"
            >
                {({ processing, errors }) => (
                    <>
                        <div className="grid gap-5">
                            <div className="grid gap-2">
                                <Label
                                    htmlFor="email"
                                    className="text-base font-medium tracking-wide text-[#1f314f]"
                                >
                                    Email/Username
                                </Label>
                                <div className="relative">
                                    <UserRound className="absolute top-1/2 left-5 size-4 -translate-y-1/2 text-[#3f4a5d]" />
                                    <Input
                                        id="email"
                                        type="email"
                                        name="email"
                                        required
                                        autoFocus
                                        tabIndex={1}
                                        autoComplete="email"
                                        placeholder="name@aurea.edu.pk"
                                        className="h-[54px] rounded-full border-[#cbd4e2] bg-[#e7eefb] pr-5 pl-15 text-base text-black shadow-inner focus-visible:border-[#8ab8fb] focus-visible:ring-[#9fc4ff]"
                                    />
                                </div>
                                <InputError message={errors.email} />
                            </div>

                            <div className="grid gap-2">
                                <Label
                                    htmlFor="password"
                                    className="text-base font-medium tracking-wide text-[#1f314f]"
                                >
                                    Password
                                </Label>
                                <div className="relative">
                                    <LockKeyhole className="absolute top-1/2 left-5 size-4 -translate-y-1/2 text-[#3f4a5d]" />
                                    <Input
                                        id="password"
                                        type="password"
                                        name="password"
                                        required
                                        tabIndex={2}
                                        autoComplete="current-password"
                                        placeholder="Password"
                                        className="h-[48px] rounded-full border-[#cbd4e2] bg-[#e7eefb] pr-5 pl-15 text-base text-black shadow-inner focus-visible:border-[#8ab8fb] focus-visible:ring-[#9fc4ff]"
                                    />
                                </div>
                                <InputError message={errors.password} />
                            </div>

                            <Button
                                type="submit"
                                className="mt-2 h-[48px] w-full rounded-full bg-[#2d3d66] text-lg font-semibold text-white shadow-none hover:bg-[#243457]"
                                tabIndex={3}
                                disabled={processing}
                                data-test="login-button"
                            >
                                {processing && <Spinner />}
                                Continue
                            </Button>

                            {canResetPassword && (
                                <p className="text-base tracking-wide text-[#1f314f]">
                                    I Forgot my Password? click{' '}
                                    <TextLink
                                        href={request()}
                                        className="font-semibold text-[#17284b] no-underline hover:underline"
                                        tabIndex={4}
                                    >
                                        here
                                    </TextLink>
                                </p>
                            )}

                            <div className="border-t border-[#cfd3da] pt-9 text-base tracking-wide text-[#102449]">
                                Aurea Website: www.aurea.edu.pk
                            </div>
                        </div>
                    </>
                )}
            </Form>

            {status && (
                <div className="mb-4 text-center text-sm font-medium text-green-600">
                    {status}
                </div>
            )}
        </>
    );
}

Login.layout = {
    title: 'Login',
    description: 'Login to AUREA EDUCATION PORTAL',
};
