import React from "react";
import axios from "axios";
import { headers } from "next/headers";
import QueryDetails, { UnverifiedQueryDetails } from "@/components/ui/pages/raise-query/QueryDetails";

export default async function QueryDetailsConatainer() {
    try {
        const response1 = await axios.get(
            `${process.env.NEXT_PUBLIC_BASE_URL}/api/v1/helpdesk/profile/me`,
            {
                headers: {
                    Cookie: (await headers()).get('cookie'),
                },
                withCredentials: true,
            }
        );
        const response2 = await axios.get(
            `${process.env.NEXT_PUBLIC_BASE_URL}/api/v1/helpdesk/tickets/category/options`,
            {
                headers: {
                    Cookie: (await headers()).get('cookie'),
                },
                withCredentials: true,
            }
        );

        const student = response1.data.student;
        const options = response2.data.options;

        return <QueryDetails
            student={student}
            ticketCategories={options}
        />;
    } catch (error: any) {
        console.error("Verified profile fetch error:", error?.response?.data || error.message);
        return (
            <UnverifiedQueryDetails />
        );
    }
};