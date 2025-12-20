"use client";

import { useEffect } from "react";
import { LoginForm } from "@/components/auth/LoginForm";
import { ModeSwitcher } from "@/components/shared/ModeSwitcher";

export default function LoginPage() {
    useEffect(() => {
        // Clear token from localStorage when login page is rendered
        localStorage.removeItem("token");
    }, []);

    return (
        <div className="bg-gradient-to-br from-background via-muted/50 to-muted flex min-h-svh flex-col items-center justify-center gap-6 p-6 md:p-10 relative">
            <div className="absolute top-6 right-6 z-10">
                <ModeSwitcher />
            </div>
            <div className="flex w-full max-w-sm flex-col gap-6">
                <LoginForm />
            </div>
        </div>
    );
}