import AssignedQueriesContainer from '@/components/containers/community/staff/AssignedQueriesContainer'
import AssignedQueriesPage from '@/components/ui/pages/community/staff/routes/queries/AssignedQueriesPage'
import React, { Suspense } from 'react'
import { FiLoader } from 'react-icons/fi'

const Page = () => {
    return (
        <Suspense fallback={
            <div className="flex min-h-screen items-center justify-center px-4">
                <div className="text-center">
                    <FiLoader className="mx-auto animate-spin text-primary" size={32} />
                    <p className="mt-4 text-sm font-medium text-text-secondary">
                        Loading your staff queries...
                    </p>
                </div>
            </div>
        }>
            <AssignedQueriesContainer />
        </Suspense>
    )
}

export default Page