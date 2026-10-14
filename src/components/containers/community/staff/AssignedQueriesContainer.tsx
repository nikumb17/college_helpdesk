import React from "react";
import axios from "axios";
import { headers } from "next/headers";
import AssignedQueriesPage from "@/components/ui/pages/community/staff/routes/queries/AssignedQueriesPage";

export default async function AssignedQueriesContainer() {
    try {
        const response = await axios.get(
            `${process.env.NEXT_PUBLIC_BASE_URL}/api/v1/helpdesk/staff/tickets`,
            {
                headers: {
                    Cookie: (await headers()).get('cookie'),
                },
                withCredentials: true,
            }
        );

        const tickets = response.data.payload.tickets;

        return <AssignedQueriesPage
            ticketsData={tickets}
        />;
    } catch (error: any) {
        console.error("Staff queries fetch error:", error?.response?.data || error.message);
        return (
            <div>Failed to fetch staff queries.</div>
        );
    }
};