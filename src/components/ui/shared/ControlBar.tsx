"use client"
import React from 'react'
import { HiMiniBellAlert } from "react-icons/hi2";
import { RiMenu2Fill } from "react-icons/ri"
import Logout from './Logout';
// import { useDispatch, useSelector } from 'react-redux';
// import { invert } from '@/lib/features/hamburger/hamburgerSlice';

interface ControlBarProps {
    role: string;
    name: string;
}

const ControlBar = ({ role, name }: ControlBarProps) => {
    // const dispatch = useDispatch();
    // const hamburger = useSelector(
    //     (state: { hamburger: { active: boolean } }) => state.hamburger.active
    // );

    const hamburger = false; // Placeholder for hamburger state

    return (
        <div className='border border-border bg-surface w-full flex items-center px-6 py-4 shadow-md'>
            <div className='grow flex items-center gap-2    '>
                {!hamburger && (
                    <div className='flex items-center justify-center mr-5'>
                        <RiMenu2Fill size={28} className='cursor-pointer' />
                    </div>
                )}
                <p className='font-semibold text-lg'>{name}</p>
                <div className='bg-primary text-white text-sm font-semibold px-2 py-0.5 rounded-full'>
                    {role}
                </div>
            </div>
            <div className='flex items-center gap-2 lg:gap-5'>
                {/* <div className='hover:text-primary cursor-pointer transition-colors duration-150'>
                    <HiMiniBellAlert size={22} />
                </div> */}
                <div>
                    <Logout />
                </div>
            </div>
        </div>
    )
}

export default ControlBar;