'use client'
import React from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'

import { RiMenu2Fill } from "react-icons/ri"
// import { useDispatch, useSelector } from 'react-redux'
// import { invert } from '@/lib/features/hamburger/hamburgerSlice'

interface SideBarProps {
    links: {
        name: string;
        path: string;
        label: React.ReactNode;
    }[];
}

const SideBar = ({ links = [] }: SideBarProps) => {
    const pathname = usePathname();
    // const dispatch = useDispatch();
    // const hamburger = useSelector(
    //     (state: { hamburger: { active: boolean } }) => state.hamburger.active
    // );

    const hamburger = false; // Placeholder for hamburger state since Redux is commented out

    return (
        <div className='sticky top-0 h-screen bg-surface border border-border shadow-md'>
            <div className={`flex items-center ${hamburger ? "p-4" : "px-8 py-5"}`}>
                <div
                    className="flex items-center gap-2"
                >
                    {hamburger ? (
                        <RiMenu2Fill size={28} className='cursor-pointer' />
                    ) : (
                        <>
                            {/* <Image
                                src="/images/logo.png"
                                alt="logo"
                                width={35}
                                height={35}
                                priority
                                className="drop-shadow-2xl h-auto w-auto"
                            /> */}
                            <span className="text-text-primary text-xl font-bold text-nowrap">
                                Help <span className="text-accent">Desk</span>
                            </span>
                        </>
                    )}
                </div>
            </div>
            <ul className='flex flex-col space-y-3 p-4'>
                {links.map(link => {
                    if (link.name === "dashboard" || link.name === "profile") {
                        return (
                            <li key={link.name}>
                                <Link href={link.path} className={`flex items-center gap-2 text-sm ${hamburger ? "p-2" : "px-5 py-2"} rounded-lg hover:border border-border hover:shadow-sm hover:translate-x-2 transition-all duration-500 group ${pathname.endsWith(link.path) ? 'bg-linear-to-br from-primary/60 to-secondary text-white translate-x-2 shadow-md border font-semibold' : 'text-text-secondary'}`}>
                                    <div className={`transition-all duration-500 ${pathname.endsWith(link.path) ? "text-white font-semibold" : "group-hover:text-text-primary group-hover:rotate-360 text-text-secondary"}`}>
                                        {link.label}
                                    </div>
                                    {!hamburger && (
                                        <span className='capitalize'>{link.name}</span>
                                    )}
                                </Link>
                            </li>
                        )
                    } else {
                        return (
                            <li key={link.name}>
                                <Link href={link.path} className={`flex items-center gap-2 text-sm ${hamburger ? "p-2" : "px-5 py-2"} rounded-lg hover:border border-border hover:shadow-sm hover:translate-x-2 transition-all duration-500 group ${pathname.includes(link.path) ? 'bg-linear-to-br from-primary/60 to-secondary text-white translate-x-2 shadow-md border font-semibold' : 'text-text-secondary'}`}>
                                    <div className={`transition-all duration-500 ${pathname.endsWith(link.path) ? "text-white font-semibold" : "group-hover:text-text-primary group-hover:rotate-360 text-text-secondary"}`}>
                                        {link.label}
                                    </div>
                                    {!hamburger && (
                                        <span className='capitalize'>{link.name}</span>
                                    )}
                                </Link>
                            </li>
                        )
                    }
                })}
            </ul>
        </div>
    )
}

export default SideBar