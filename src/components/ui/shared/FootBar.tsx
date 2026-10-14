"use client"
import Link from "next/link";
import React from "react";
import { motion } from "framer-motion";

import { FaInstagram } from "react-icons/fa";
import { FaLinkedin } from "react-icons/fa6";
import { FaGithub } from "react-icons/fa";
import { FaDiscord } from "react-icons/fa";
import { usePathname } from "next/navigation";

const footerContainer = {
    hidden: { opacity: 0, y: 40 },
    visible: {
        opacity: 1,
        y: 0,
        transition: {
            duration: 0.6,
            ease: "easeOut",
            staggerChildren: 0.15,
        },
    },
} as const;

const footerColumn = {
    hidden: { opacity: 0, y: 20 },
    visible: {
        opacity: 1,
        y: 0,
        transition: {
            duration: 0.5,
            ease: "easeOut",
        },
    },
} as const;

const linkList = {
    hidden: {},
    visible: {
        transition: {
            staggerChildren: 0.08, // ⬆️⬇️ one by one
            delayChildren: 0.2,
        },
    },
} as const;

const linkItem = {
    hidden: {
        opacity: 0,
        y: -10, // from top
    },
    visible: {
        opacity: 1,
        y: 0,
        transition: {
            duration: 0.35,
            ease: "easeOut",
        },
    },
} as const;

interface LinkItem {
    name: string;
    path: string;
    label?: React.ReactNode;
}

const links: LinkItem[] = [
    { name: "home", path: "/#home" },
    { name: "track", path: "/#track-query" },
    { name: "contact", path: "/#contact" },
];

const serviceLinks: LinkItem[] = [
    { name: "Login", path: "/community/login" },
    // { name: "events", path: "/#events" },
    // { name: "projects", path: "/#projects" },
    // { name: "workshops", path: "/#events" },
];

const helpLinks: LinkItem[] = [
    { name: "FAQs", path: "/#faqs" },
    { name: "contact", path: "/#contact" },
    // { name: "code of conduct", path: "#" },
];

const socialLinks: LinkItem[] = [
    { name: "instagram", path: "#", label: <FaInstagram size={25} /> },
    { name: "linkedin", path: "#", label: <FaLinkedin size={25} /> },
    { name: "github", path: "#", label: <FaGithub size={25} /> },
    // { name: "discord", path: "#", label: <FaDiscord size={25} /> },
];

/*
    IMPORTANT QUESTION: Can non-members participate in the events organised by the club ?

    1. Club Member / Lead Join Page => ( Dev )
    2. Club Member / Lead Login Page -- ( Hold )
*/

const FootBar = () => {
    const pathname = usePathname();

    if (!pathname.includes("/community")) {
        return (
            <motion.div
                variants={footerContainer}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                className="border-t border-border/60"
            >
                <section className="max-w-7xl mx-auto px-6 py-16">
                    <div className="flex items-start justify-between">
                        <div className="md:col-span-2 space-y-6">
                            <h1 className="text-2xl font-bold text-text-primary">
                                Help <span className="text-accent">Desk</span>
                            </h1>
                            {/* <p className="text-text-secondary leading-relaxed text-sm">
                                A student-led IT community focused on innovation, learning, and
                                building real-world technology solutions.
                            </p> */}
                            <motion.div
                                variants={linkList}
                                initial="hidden"
                                animate="visible"
                                className="flex items-center gap-5"
                            >
                                {socialLinks.map(link => (
                                    <motion.div key={link.name} variants={linkItem}>
                                        <Link
                                            href={link.path}
                                            className="hover:text-text-primary transition"
                                        >
                                            {link.label}
                                        </Link>
                                    </motion.div>
                                ))}
                            </motion.div>
                            <p className="text-sm text-text-secondary">
                                Headquarters, College,  <br />
                                Kanpur, India
                            </p>
                        </div>
                        <motion.div variants={footerColumn} className="space-y-6">
                            <h2 className="text-lg font-semibold text-text-primary">Links</h2>
                            <motion.ul
                                variants={linkList}
                                initial="hidden"
                                animate="visible"
                                className="space-y-4"
                            >
                                {links.map(link => (
                                    <motion.li key={link.name} variants={linkItem}>
                                        <Link
                                            href={link.path}
                                            className="capitalize text-text-secondary hover:text-text-primary transition-colors"
                                        >
                                            {link.name}
                                        </Link>
                                    </motion.li>
                                ))}
                            </motion.ul>
                        </motion.div>
                        <motion.div variants={footerColumn} className="space-y-6">
                            <h2 className="text-lg font-semibold text-text-primary">Community</h2>
                            <motion.ul
                                variants={linkList}
                                initial="hidden"
                                animate="visible"
                                className="space-y-4"
                            >
                                {serviceLinks.map(link => (
                                    <motion.li key={link.name} variants={linkItem}>
                                        <Link
                                            href={link.path}
                                            className="capitalize text-text-secondary hover:text-text-primary transition-colors"
                                        >
                                            {link.name}
                                        </Link>
                                    </motion.li>
                                ))}
                            </motion.ul>
                        </motion.div>
                        {/* <motion.div variants={footerColumn} className="space-y-6">
                            <h2 className="text-lg font-semibold text-text-primary">Help</h2>
                            <motion.ul
                                variants={linkList}
                                initial="hidden"
                                animate="visible"
                                className="space-y-4"
                            >
                                {helpLinks.map(link => (
                                    <motion.li key={link.name} variants={linkItem}>
                                        <Link
                                            href={link.path}
                                            className="capitalize text-text-secondary hover:text-text-primary transition-colors"
                                        >
                                            {link.name}
                                        </Link>
                                    </motion.li>
                                ))}
                            </motion.ul>
                        </motion.div> */}
                    </div>
                    <div className="mt-16 pt-6 border-t border-border flex flex-col md:flex-row items-center justify-between gap-4">
                        <span className="text-sm text-text-secondary">
                            © 2026 College. All rights reserved.
                        </span>
                        <span className="text-sm text-text-secondary">
                            Built with passion by the Nyuko Tech
                        </span>
                    </div>
                </section>
            </motion.div>
        );
    }
};

export default FootBar;