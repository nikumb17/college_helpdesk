import { departmentRoutes } from "@/components/ui/pages/community/department/paths";
import ControlBar from "@/components/ui/shared/ControlBar";
import SideBar from "@/components/ui/shared/SideBar";


export default function ManageLayout({ children }: { children: React.ReactNode }) {
    return (
        <div className="flex relative">
            <SideBar
                links={departmentRoutes}
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