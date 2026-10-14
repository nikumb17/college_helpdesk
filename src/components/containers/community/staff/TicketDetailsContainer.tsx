import React from "react";
import axios from "axios";
import { headers } from "next/headers";
import StaffTicketDetailsPage from "@/components/ui/pages/community/staff/routes/queries/tickets/StaffTicketDetailsPage";

export default async function TicketDetailsContainer({ ticketId }: { ticketId: string }) {
    try {
        const response = await axios.get(
            `${process.env.NEXT_PUBLIC_BASE_URL}/api/v1/helpdesk/staff/tickets/info?ticketId=${encodeURIComponent(ticketId)}`,
            {
                headers: {
                    Cookie: (await headers()).get('cookie'),
                },
                withCredentials: true,
            }
        );

        const ticket = response.data.data.ticket;
        const activities = response.data.data.activities;
        const responses = response.data.data.responses;

        return <StaffTicketDetailsPage
            ticketData={ticket}
            activitiesData={activities}
            responsesData={responses}
        />;
    } catch (error: any) {
        console.error("Ticket details fetch error:", error?.response?.data || error.message);
        return (
            <div>Failed to fetch ticket details.</div>
        );
    }
};