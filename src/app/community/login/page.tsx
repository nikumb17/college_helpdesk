import Login from '@/components/ui/pages/community/auth/Login'
import React from 'react'

const Page = () => {
    return (
        <section className='min-h-[95vh] content-center'>
            <div className=' w-full md:w-[90%] xl:w-[80%] md:flex items-center mx-auto'>
                <div className='hidden md:block md:w-1/2'>
                    <img src="/posters/login.webp" alt="hero_banner" />
                </div>
                <Login />
            </div>
        </section>
    )
}

export default Page