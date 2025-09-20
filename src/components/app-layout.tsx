"use client";

import { usePathname } from "next/navigation";
import { useUser } from "@/hooks/useUser"; // Sử dụng hook useUser đã được cải tiến
import { Loader2 } from "lucide-react";
import { Navbar } from "./navbar";

export function AppLayout({ children }: { children: React.ReactNode }) {
  // Lấy trạng thái người dùng và đường dẫn URL hiện tại
  const { user, isLoading } = useUser();
  const pathname = usePathname();

  // Danh sách các trang không hiển thị Navbar (ví dụ: trang đăng nhập, đăng ký)
  const isAuthPage = pathname === '/login' || pathname === '/register';

  // 1. Nếu đang ở trang đăng nhập/đăng ký, chỉ hiển thị nội dung trang đó
  if (isAuthPage) {
    return <>{children}</>;
  }

  // 2. Trong khi đang xác thực người dùng, hiển thị một loader toàn trang
  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-screen bg-gray-100">
        <Loader2 className="animate-spin h-8 w-8 text-gray-500" />
      </div>
    );
  }

  // 3. Khi đã có trạng thái người dùng, hiển thị layout chính
  return (
    <>
      {/* Chỉ hiển thị Navbar nếu `user` tồn tại (đã đăng nhập) */}
      {user && <Navbar />}

      {/* Thêm `padding-top` cho nội dung chính chỉ khi Navbar được hiển thị */}
      <main className={`bg-gray-100 min-h-screen ${user ? "pt-16" : ""}`}>
        {children}
      </main>
    </>
  );
}