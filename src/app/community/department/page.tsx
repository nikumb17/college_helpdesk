import QueriesConatainer from '@/components/containers/community/department/QueriesContainer'
import React, { Suspense } from 'react'
import { FiLoader } from 'react-icons/fi'

const Page = () => {
    return (
        <Suspense fallback={
            <div className="flex min-h-screen items-center justify-center px-4">
                <div className="text-center">
                    <FiLoader className="mx-auto animate-spin text-primary" size={32} />
                    <p className="mt-4 text-sm font-medium text-text-secondary">
                        Loading your department queries...
                    </p>
                </div>
            </div>
        }>
            <QueriesConatainer />
        </Suspense>
    )
}

export default Page