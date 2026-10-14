import TicketDetailsContainer from '@/components/containers/community/staff/TicketDetailsContainer';
import React, { Suspense } from 'react'
import { FiLoader } from 'react-icons/fi';

export const instant = false

const Page = async ({ params }: { params: Promise<{ id: string }> }) => {
    const id = (await params).id;
    return (
        <Suspense fallback={
            <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
                <div className="flex items-center gap-3 text-sm text-slate-500">
                    <FiLoader className="animate-spin text-xl" />
                    Loading ticket details...
                </div>
            </div>
        }>
            <TicketDetailsContainer
                ticketId={id}
            />
        </Suspense>
    )
}

export default Page