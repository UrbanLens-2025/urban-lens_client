"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
    Form,
    FormField,
    FormItem,
    FormLabel,
    FormControl,
    FormMessage,
} from "@/components/ui/form";
import { verifyOtp } from "@/api/auth";

const otpSchema = z.object({
    otpCode: z.string().min(4, "OTP must be 4 digits"),
});

export default function VerifyOtpPage() {
    const [isLoading, setIsLoading] = useState(false);
    const [email, setEmail] = useState("");
    const [confirmCode, setConfirmCode] = useState("");
    const [isReady, setIsReady] = useState(false);

    const router = useRouter();

    const form = useForm<z.infer<typeof otpSchema>>({
        resolver: zodResolver(otpSchema),
        defaultValues: { otpCode: "" },
    });

    useEffect(() => {
        const storedEmail = localStorage.getItem("signupEmail");
        const storedCode = localStorage.getItem("confirmCode");

        if (localStorage.getItem("token")) {
            router.replace("/profile");
        } else {
            if (!storedEmail || !storedCode) {
                router.replace("/signup");
            } else {
                setEmail(storedEmail);
                setConfirmCode(storedCode);
                setIsReady(true);
            }
        }
    }, [router]);

    async function onSubmit(values: z.infer<typeof otpSchema>) {
        try {
            setIsLoading(true);
            const res = await verifyOtp({
                email,
                confirmCode,
                otpCode: values.otpCode,
            });

            if (res.success) {
                toast.success("Account verified! You can now log in.");
                localStorage.removeItem("signupEmail");
                localStorage.removeItem("confirmCode");
                router.push("/login");
            } else {
                toast.error(res.message);
            }
        } catch (err) {
            toast.error((err as Error).message);
        } finally {
            setIsLoading(false);
        }
    }

    if (!isReady) {
        return (
            <div className="flex justify-center items-center h-screen">
                <Loader2 className="animate-spin w-8 h-8" />
            </div>
        );
    }

    return (
        <div className="max-w-md mx-auto mt-20 p-6 border rounded-lg shadow">
            <h1 className="text-2xl font-bold mb-4 text-center">Verify OTP</h1>
            <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                    <FormField
                        control={form.control}
                        name="otpCode"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Enter OTP</FormLabel>
                                <FormControl>
                                    <Input placeholder="4-digit code" maxLength={4} {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                    <Button type="submit" className="w-full" disabled={isLoading}>
                        {isLoading ? <Loader2 className="size-4 animate-spin" /> : "Verify"}
                    </Button>
                </form>
            </Form>
        </div>
    );
}
