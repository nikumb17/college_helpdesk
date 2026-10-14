import { FaChartPie } from "react-icons/fa";
import { GrCertificate } from "react-icons/gr";
import { HiMiniBellAlert } from "react-icons/hi2";
import { IoPeople } from "react-icons/io5";
import { MdEventNote } from "react-icons/md";

export const adminRoutes = [
    {
        name: "Home",
        path: "/community/admin",
        label: <IoPeople size={22} />,
    },
    {
        name: "departments",
        path: "/community/admin/departments",
        label: <MdEventNote size={22} />,
    },
    // {
    //     name: "announcements",
    //     path: "/community/department/announcements",
    //     label: <HiMiniBellAlert size={22} />,
    // },
    // {
    //     name: "analytics",
    //     path: "/community/department/analytics",
    //     label: <FaChartPie size={22} />,
    // },
];