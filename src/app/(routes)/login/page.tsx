import Image from "next/image";

import { LoginForm } from "@/components/LoginForm";

export const Login = () => {
    return (
        <div>
            <div className="flex min-h-screen items-center justify-center p-4">
                <div className="flex w-full max-w-7xl flex-col items-center justify-center gap-8 lg:flex-row">
                    <div className="flex w-full items-center justify-center gap-5">
                        <div className="w-full max-w-3xl">
                            <Image
                                src="/rubranner.png"
                                alt="Computer Science Department Header"
                                width={1200}
                                height={400}
                                className="h-auto w-full rounded-lg shadow-lg"
                                priority
                            />
                        </div>
                        <LoginForm />
                    </div>
                </div>
            </div>
        </div>
    );
};

export default function login() {
    return (
        <>
            <Login />;
        </>
    );
}
