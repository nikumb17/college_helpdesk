"use client"
import React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { motion } from "framer-motion"

const buttonHover = {
    scale: 1.05,
    transition: { type: "spring", stiffness: 300 },
} as const

const buttonTap = {
    scale: 0.95,
} as const;

type NavLinkProps = {
    name: string;
    path: string;
};

const NavLink = ({ name, path }: NavLinkProps) => {
    const pathname = usePathname();

    if (path == "/") {
        return (
            <motion.div whileHover={buttonHover} whileTap={buttonTap} className='capitalize'>
                <Link
                    prefetch
                    href={path}
                    className={`p-2 transition-all duration-300 ${pathname.endsWith("/") ? "underline underline-offset-8 text-primary font-semibold" : "hover:text-text-primary"}`}
                >
                    {name || "Unknown"}
                </Link>
            </motion.div>
        )
    }

    else {
        return (
            <motion.div whileHover={buttonHover} whileTap={buttonTap} className='capitalize'>
                <Link
                    prefetch
                    href={path}
                    className={`p-2 transition-all duration-300 ${pathname.match(path) ? "underline underline-offset-8 text-primary font-semibold" : "hover:text-text-primary"}`}
                >
                    {name || "Unknown"}
                </Link>
            </motion.div>
        )
    }
}

export default NavLink;