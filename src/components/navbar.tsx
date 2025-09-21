"use client";

import Link from "next/link";
import { useState } from "react";

import { usePathname, useRouter } from "next/navigation";
import type { LucideIcon } from "lucide-react";
import { LogOut, Settings } from "lucide-react";
import {
  Search,
  Home,
  Users,
  Clapperboard,
  Bell,
  MessageCircle,
  LayoutGrid,
  ArrowLeft,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useQueryClient } from "@tanstack/react-query";
import { useUser } from "@/hooks/useUser";
import { ChangePasswordModal } from "./settings/changePasswordModal";

const navItems = [
  { href: "/", icon: Home, label: "Home" },
  { href: "/#", icon: Clapperboard, label: "Watch" },
  { href: "/#", icon: Users, label: "Friends" },
];

const actionItems = [
  { icon: LayoutGrid, label: "Menu" },
  { icon: MessageCircle, label: "Messenger" },
  { icon: Bell, label: "Notifications" },
];

interface NavActionProps {
  Icon: LucideIcon;
  "aria-label": string;
}

function NavAction({ Icon, ...props }: NavActionProps) {
  return (
    <Button
      variant="ghost"
      size="icon"
      className="rounded-full bg-gray-200 hover:bg-gray-300 h-10 w-10"
      {...props}
    >
      <Icon className="h-5 w-5" />
    </Button>
  );
}

interface MainNavItemProps {
  href: string;
  Icon: LucideIcon;
  label: string;
  isActive: boolean;
}

function MainNavItem({ href, Icon, label, isActive }: MainNavItemProps) {
  return (
    <li key={label}>
      <Link href={href} aria-label={label}>
        <div
          className={`px-8 py-3 rounded-lg hover:bg-gray-100 cursor-pointer transition-colors ${
            isActive ? "border-b-4 border-[#dd8d34] rounded-none" : ""
          }`}
        >
          <Icon
            className={`h-7 w-7 ${
              isActive ? "text-[#dd8d34]" : "text-gray-500"
            }`}
            strokeWidth={2.5}
          />
        </div>
      </Link>
    </li>
  );
}

export function Navbar() {
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const { user } = useUser();
  const pathname = usePathname();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isChangePassWordModalOpen, setIsChangePasswordModalOpen] =
    useState(false);

  const queryClient = useQueryClient();
  const router = useRouter();

  const logout = () => {
    localStorage.removeItem("token");
    queryClient.clear();
    router.push("/login");
  };

  if (isSearchOpen) {
    return (
      <header className="fixed top-0 left-0 w-full h-16 bg-white z-50 flex items-center gap-2 p-2 lg:hidden">
        <Button
          variant="ghost"
          size="icon"
          className="rounded-full"
          onClick={() => setIsSearchOpen(false)}
        >
          <ArrowLeft className="h-6 w-6" />
        </Button>
        <div className="relative w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
          <Input
            placeholder="Search on Urban Lens"
            className="pl-10 rounded-full bg-gray-100"
            autoFocus
          />
        </div>
      </header>
    );
  }

  return (
    <header className="fixed top-0 left-0 w-full bg-white shadow-md z-50 px-2 sm:px-4">
      <div className="container mx-auto flex items-center justify-between h-16">
        <div className="flex items-center gap-2">
          <Link href="/">
            <h1 className="text-[#dd8d34]">LOGO</h1>
          </Link>
          <div className="relative hidden lg:flex items-center">
            <Search className="absolute left-3 h-5 w-5 text-gray-400" />
            <Input
              placeholder="Search on Urban Lens"
              className="pl-10 rounded-full bg-gray-100"
            />
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="rounded-full bg-gray-200 lg:hidden h-10 w-10"
            onClick={() => setIsSearchOpen(true)}
          >
            <Search className="h-5 w-5" />
          </Button>
        </div>

        <nav className="hidden md:flex flex-grow justify-center">
          <ul className="flex items-center gap-2">
            {navItems.map((item) => (
              <MainNavItem
                key={item.label}
                href={item.href}
                Icon={item.icon}
                label={item.label}
                isActive={pathname === item.href}
              />
            ))}
          </ul>
        </nav>

        <div className="hidden sm:flex items-center gap-2">
          {actionItems.map((item) => (
            <NavAction
              key={item.label}
              Icon={item.icon}
              aria-label={item.label}
            />
          ))}

          <DropdownMenu
            modal={false}
            open={isMenuOpen}
            onOpenChange={setIsMenuOpen}
          >
            <DropdownMenuTrigger asChild>
              <Avatar className="h-10 w-10 cursor-pointer">
                <AvatarImage src={user?.avatarUrl} alt="User Avatar" />
                <AvatarFallback>
                  {user?.firstName.charAt(0)}
                  {user?.lastName.charAt(0)}
                </AvatarFallback>
              </Avatar>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-80" align="end">
              <DropdownMenuLabel>
                <Link
                  href={`/profile/${user?.id}`}
                  onClick={() => setIsMenuOpen(false)}
                  className="block p-2 rounded-lg hover:bg-gray-100"
                >
                  <div className="flex items-center gap-3">
                    <Avatar>
                      <AvatarImage src={user?.avatarUrl} />
                      <AvatarFallback>
                        {user?.firstName.charAt(0)}
                        {user?.lastName.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-bold text-base">
                        {user?.firstName} {user?.lastName}
                      </p>
                      <p className="text-sm text-gray-500 font-normal">
                        See your profile
                      </p>
                    </div>
                  </div>
                </Link>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="cursor-pointer"
                onClick={() => setIsChangePasswordModalOpen(true)}
              >
                <Settings className="mr-2 h-4 w-4" />
                <span>Settings</span>
              </DropdownMenuItem>
              <DropdownMenuItem className="cursor-pointer" onClick={logout}>
                <LogOut className="mr-2 h-4 w-4" />
                <span>Log Out</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        <ChangePasswordModal
          open={isChangePassWordModalOpen}
          onOpenChange={setIsChangePasswordModalOpen}
        />
      </div>
    </header>
  );
}
