import { Button } from "@/components/ui/button";
import { useLogout } from "@/hooks/useLogout";

export default function LogoutButton() {
    const logout = useLogout();

    return (
        <Button onClick={logout} variant="outline">
            Logout
        </Button>
    );
}
