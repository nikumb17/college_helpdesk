import { adminRoutes } from "@/components/ui/pages/community/admin/paths";
import ControlBar from "@/components/ui/shared/ControlBar";
import SideBar from "@/components/ui/shared/SideBar";


export default function ManageLayout({ children }: { children: React.ReactNode }) {
    return (
        <div className="flex relative">
            <SideBar
                links={adminRoutes}
            />
            <div className="grow">
                <ControlBar
                    role="ADMIN"
                    name="Admin"
                />
                {children}
            </div>
        </div>
    )
}