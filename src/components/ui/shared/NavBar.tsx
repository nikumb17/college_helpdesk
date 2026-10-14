"use client"
import React, { useState } from "react"
import Image from "next/image"
import Link from "next/link"
import NavLink from "./NavLink"

import { RiMenu2Fill } from "react-icons/ri"
import { usePathname } from "next/navigation"
import { motion } from "framer-motion"
import NavDrawer from "./NavDrawer"

const links = [
    { name: "home", path: "/#home" },
    { name: "track", path: "/#track-query" },
    { name: "contact", path: "/#contact" },
]

const navContainer = {
    hidden: { y: -40, opacity: 0 },
    visible: {
        y: 0,
        opacity: 1,
        transition: {
            duration: 0.6,
            ease: "easeOut",
            staggerChildren: 0.08,
        },
    },
} as const;

const navItem = {
    hidden: { opacity: 0, y: -10 },
    visible: { opacity: 1, y: 0 },
} as const;

const buttonTap = {
    scale: 0.90,
} as const;

const navLinksContainer = {
    hidden: {},
    visible: {
        transition: {
            staggerChildren: 0.1,
            staggerDirection: -1, // 👈 RIGHT → LEFT order
            delayChildren: 0.3,   // after navbar enters
        },
    },
} as const;

const navLinkItem = {
    hidden: {
        opacity: 0,
        x: 24, // comes from right
    },
    visible: {
        opacity: 1,
        x: 0,
        transition: {
            duration: 0.45,
            ease: "easeOut",
        },
    },
} as const;

const NavBar = () => {
    const pathname = usePathname();
    const [showPanel, setShowPanel] = useState<boolean>(false);

    if (pathname.includes("/community")) return null
    return (
        <>
            <div className="backdrop-blur-md">
                <motion.div
                    variants={navContainer}
                    initial="hidden"
                    animate="visible"
                    className="max-w-7xl mx-auto bg-transparent p-1.5 lg:p-3 w-full flex items-center"
                >
                    <div className="px-2 py-1 grow lg:hidden">
                        <motion.div
                            whileTap={{ scale: 0.85 }}
                            whileHover={{ scale: 1.1 }}
                            className="w-fit cursor-pointer"
                            onClick={() => setShowPanel(!showPanel)}
                        >
                            <RiMenu2Fill size={25} className="text-text-primary" />
                        </motion.div>
                    </div>
                    <div className="px-2 py-1 grow hidden lg:flex items-center">
                        <Link href="/">
                            <motion.div
                                whileHover={{ scale: 1.05 }}
                                transition={{ type: "spring", stiffness: 250 }}
                                className="flex items-center gap-2"
                            >
                                {/* <Image
                                    src="/globe.svg"
                                    alt="logo"
                                    width={10}
                                    height={10}
                                    priority
                                    className="drop-shadow-2xl h-auto w-auto"
                                /> */}
                                <span className="text-text-primary text-xl font-bold text-nowrap">
                                    Help <span className="text-accent">Desk</span>
                                </span>
                            </motion.div>
                        </Link>
                        <div className="grow flex justify-center">
                            <motion.div
                                variants={navLinksContainer}
                                initial="hidden"
                                animate="visible"
                                className="flex lg:gap-5 items-center"
                            >
                                {links.map(link => (
                                    <motion.div
                                        key={link.name}
                                        variants={navLinkItem}
                                    >
                                        <NavLink name={link.name} path={link.path} />
                                    </motion.div>
                                ))}
                            </motion.div>

                        </div>
                    </div>
                    <div className="px-2 py-1 space-x-2 flex items-center">
                        <motion.div whileTap={buttonTap}>
                            <Link
                                href="/raise-query"
                                className="start text-text-primary shadow-xl border border-border px-8 py-2 transform scale-90 hover:scale-100 transition-transform duration-300"
                            >
                                <span>Raise Query</span>
                                <div className="liquid bg-secondary"></div>
                            </Link>
                        </motion.div>
                    </div>
                </motion.div>
            </div>
            <NavDrawer visible={showPanel} setVisible={setShowPanel} links={links} />
            {/* Framer motion + css bug exists that why drawer has to be outside the navbar motion tree */}
        </>
    )
}

export default NavBar;