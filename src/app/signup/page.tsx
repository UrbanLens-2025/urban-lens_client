import { SignupForm } from "@/components/auth/SignupForm";
import { Suspense } from "react";
import { ModeSwitcher } from "@/components/shared/ModeSwitcher";

export default function SignupPage() {
    return (
        <div className="bg-gradient-to-br from-background via-muted/50 to-muted dark:from-background dark:via-muted/30 dark:to-muted/50 flex min-h-svh flex-col items-center justify-center gap-6 p-6 md:p-10 relative">
            <div className="absolute top-6 right-6 z-10">
                <ModeSwitcher />
            </div>
            <div className="flex w-full max-w-sm flex-col gap-6">
                <Suspense>
                    <SignupForm />
                </Suspense>
            </div>
        </div>
    );
}