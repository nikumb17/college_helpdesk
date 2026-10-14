"use client"
import React from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { usePathname } from 'next/navigation';
import { AnimatePresence } from 'framer-motion';

import { motion } from "framer-motion";

const backdropVariants = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: {
            when: "beforeChildren",
        },
    },
    exit: {
        opacity: 0,
        transition: {
            when: "afterChildren",
        },
    },
} as const;

const drawerVariants = {
    hidden: { x: "-100vw" },
    visible: {
        x: 0,
        transition: {
            ease: 'easeInOut',
            duration: 0.3,
            when: "beforeChildren",
            staggerChildren: 0.03, // each child 0.1s after previous
        },
    },
    exit: {
        x: "-100vw",
        transition: {
            ease: 'easeInOut',
            duration: 0.1,
            when: "afterChildren",
            staggerChildren: 0.02,
            staggerDirection: -1, // children exit in reverse
        },
    }
} as const;

const linkVariants = {
    hidden: { x: "-100vw" },
    visible: {
        x: 0,
        transition: { type: "spring", stiffness: 100 },
    },
    exit: {
        x: "-100vw",
        transition: {
            duration: 0.2, // 🔧 replace spring with linear time
            ease: "easeInOut"
        },
    },
} as const;

type NavDrawerProps = {
    visible: boolean;
    setVisible: (visible: boolean) => void;
    links: { name: string; path: string }[];
};

const NavDrawer = ({ visible, setVisible, links }: NavDrawerProps) => {
    const pathname = usePathname();
    return (
        <>
            <AnimatePresence>
                {visible && (
                    <motion.div
                        key="drawer"
                        variants={backdropVariants}
                        initial="hidden"
                        animate="visible"
                        exit="exit"
                        onClick={() => setVisible(!visible)}
                        className='fixed inset-0 z-50 bg-black/50 flex items-start justify-start'
                    >
                        <motion.div
                            variants={drawerVariants}
                            className='bg-surface h-screen p-3 shadow-xl'
                        >
                            <div className='space-y-6'>
                                <div className='flex items-center p-3 pb-6 border-b-2 rounded-md'>
                                    <Link href="/">
                                        <motion.div
                                            whileHover={{ scale: 1.05 }}
                                            transition={{ type: "spring", stiffness: 250 }}
                                            className="flex items-center gap-2"
                                        >
                                            {/* <Image
                                                src="/images/logo.png"
                                                alt="logo"
                                                width={35}
                                                height={35}
                                                priority
                                                className="drop-shadow-2xl"
                                            /> */}
                                            <span className="text-text-primary text-xl font-bold">
                                                Help <span className="text-accent">Desk</span>
                                            </span>
                                        </motion.div>
                                    </Link>
                                </div>
                                <ul className='flex flex-col space-y-5 font-semibold px-3 font-primary'>
                                    {links.map((link, index) => {
                                        if (link.name == "home") {
                                            return (
                                                <motion.li
                                                    key={index}
                                                    variants={linkVariants}
                                                    whileHover={{ scale: 1.1 }}
                                                    whileTap={{ scale: 0.9 }}
                                                >
                                                    <Link href={link.path} onClick={() => setVisible(!visible)} className={`transition-all duration-150 font-primary capitalize ${pathname.endsWith(link.path) ? 'text-text-primary underline underline-offset-8' : 'text-text-secondary hover:text-primary'}`}>
                                                        {link.name}
                                                    </Link>
                                                </motion.li>
                                            );
                                        } else {
                                            return (
                                                <motion.li
                                                    key={index}
                                                    variants={linkVariants}
                                                    whileHover={{ scale: 1.1 }}
                                                    whileTap={{ scale: 0.9 }}
                                                >
                                                    <Link href={link.path} onClick={() => setVisible(!visible)} className={`transition-all duration-150 font-primary capitalize ${pathname.includes(link.path) ? 'text-text-primary underline underline-offset-8' : 'text-text-secondary hover:text-primary'}`}>
                                                        {link.name}
                                                    </Link>
                                                </motion.li>
                                            );
                                        }
                                    })}
                                </ul>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    )
}

export default NavDrawer