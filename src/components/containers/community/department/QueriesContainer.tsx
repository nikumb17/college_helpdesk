import React from "react";
import axios from "axios";
import { headers } from "next/headers";
import DepartmentQueriesPage from "@/components/ui/pages/community/department/routes/queries/QueriesPage";

export default async function QueriesConatainer() {
    try {
        const response1 = await axios.get(
            `${process.env.NEXT_PUBLIC_BASE_URL}/api/v1/helpdesk/department/tickets`,
            {
                headers: {
                    Cookie: (await headers()).get('cookie'),
                },
                withCredentials: true,
            }
        );
        const response2 = await axios.get(
            `${process.env.NEXT_PUBLIC_BASE_URL}/api/v1/helpdesk/department/staff`,
            {
                headers: {
                    Cookie: (await headers()).get('cookie'),
                },
                withCredentials: true,
            }
        );

        const tickets = response1.data.payload.tickets;
        const staff = response2.data.staff;

        return <DepartmentQueriesPage
            ticketsData={tickets}
            staffData={staff}
        />;
    } catch (error: any) {
        console.error("Department queries fetch error:", error?.response?.data || error.message);
        return (
            <div>Failed to fetch department queries.</div>
        );
    }
};