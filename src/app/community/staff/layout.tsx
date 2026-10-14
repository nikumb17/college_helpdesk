import { staffRoutes } from "@/components/ui/pages/community/staff/paths";
import ControlBar from "@/components/ui/shared/ControlBar";
import SideBar from "@/components/ui/shared/SideBar";


export default function ManageLayout({ children }: { children: React.ReactNode }) {
    return (
        <div className="flex relative">
            <SideBar
                links={staffRoutes}
            />
            <div className="grow">
                <ControlBar
                    role="STAFF"
                    name="Staff"
                />
                {children}
            </div>
        </div>
    )
}