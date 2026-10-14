import TrackTicket from '@/components/ui/pages/track-query/TrackTicket'
import React from 'react'

export const instant = false

const Page = async ({ params }: { params: Promise<{ id: string }> }) => {
    const id = (await params).id;

    return (
        <TrackTicket
            ticketId={id}
        />
    )
}

export default Page