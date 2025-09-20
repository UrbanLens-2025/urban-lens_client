"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { getUser } from "@/api/auth";
import { useQuery } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";

export default function ProfilePage() {
    const router = useRouter();
    const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;

    const { data, isLoading, isError } = useQuery({
        queryKey: ["user"],
        queryFn: getUser,
        enabled: !!token,
    });

    useEffect(() => {
        if (!token) {
            router.replace("/login");
        }
    }, [token, router]);

    if (!token) {
        return (
            <div className="flex justify-center items-center h-screen">
                <Loader2 className="animate-spin w-8 h-8" />
            </div>
        );
    }

    if (isLoading) {
        return (
            <div className="flex justify-center items-center h-screen">
                <Loader2 className="animate-spin w-8 h-8" />
            </div>
        );
    }

    if (isError || !data?.data) {
        return (
            <div className="flex flex-col items-center justify-center h-screen">
                <p className="text-red-500">Failed to load profile.</p>
                <button
                    onClick={() => router.replace("/login")}
                    className="text-blue-500 underline mt-2"
                >
                    Go to Login
                </button>
            </div>
        );
    }

    const user = data.data;

    return (
        <div className="max-w-xl mx-auto mt-10 p-6 border rounded-lg shadow-md">
            <h1 className="text-2xl font-bold mb-4">Profile</h1>
            <div className="space-y-2">
                <p>
                    <strong>First Name:</strong> {user.firstName}
                </p>
                <p>
                    <strong>Last Name:</strong> {user.lastName}
                </p>
                <p>
                    <strong>Email:</strong> {user.email}
                </p>
                <p>
                    <strong>Phone Number:</strong> {user.phoneNumber}
                </p>
                <p>
                    <strong>Role:</strong> {user.role}
                </p>
            </div>
        </div>
    );
}
