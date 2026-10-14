"use client"
import { motion } from "framer-motion";
import Link from "next/link";
import {
    FiArrowLeft,
    FiArrowRight,
    FiKey,
    FiPlusCircle,
    FiShield,
    FiHelpCircle,
} from "react-icons/fi";


import Button from "../../shared/Button";

const options = [
    {
        title: "Recover my ID",
        description:
            "Already have a Helpdesk Pass ID but forgot it? Verify your identity using your student details and recover your existing ID.",
        icon: FiKey,
        href: "/raise-query/helpdesk-pass/recover",
        action: "Recover Helpdesk Pass ID",
        label: "EXISTING STUDENT",
    },
    {
        title: "Generate a new ID",
        description:
            "Never received a Helpdesk Pass ID? Verify your college details and get your reusable Helpdesk Pass ID issued.",
        icon: FiPlusCircle,
        href: "/raise-query/helpdesk-pass/generate",
        action: "Get a Helpdesk Pass ID",
        label: "FIRST-TIME USER",
    },
];

const HelpdeskIdPage = () => {
    return (
        <main className="relative flex min-h-screen items-center justify-center overflow-hidden px-4 py-12">
            <motion.section
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.35 }}
                aria-labelledby="helpdesk-id-title"
                className="relative w-full max-w-2xl rounded-3xl border border-border bg-surface p-6 shadow-xl sm:p-9"
            >
                {/* Back navigation */}
                <Link
                    href="/raise-query"
                    className="mb-8 inline-flex items-center gap-2 text-sm font-semibold text-text-secondary transition hover:text-primary"
                >
                    <FiArrowLeft size={17} />
                    Back to verification
                </Link>

                {/* Header */}
                <div className="mb-8 text-center">
                    <motion.div
                        initial={{ scale: 0.8 }}
                        animate={{ scale: 1 }}
                        transition={{
                            type: "spring",
                            stiffness: 220,
                            damping: 15,
                        }}
                        className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 text-primary"
                    >
                        <FiShield size={32} />
                    </motion.div>

                    <p className="mb-2 text-xs font-bold uppercase tracking-[0.2em] text-primary">
                        College Helpdesk
                    </p>

                    <h1
                        id="helpdesk-id-title"
                        className="text-2xl font-bold tracking-tight text-text-primary sm:text-3xl"
                    >
                        Your Helpdesk Pass ID
                    </h1>

                    <p className="mx-auto mt-3 max-w-lg text-sm leading-6 text-text-secondary sm:text-base">
                        Your Helpdesk Pass ID lets you raise multiple queries
                        without creating a separate account. Choose the
                        option that best describes your situation.
                    </p>
                </div>

                {/* Options */}
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    {options.map((option, index) => {
                        const Icon = option.icon;

                        return (
                            <motion.article
                                key={option.href}
                                initial={{ opacity: 0, y: 16 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{
                                    duration: 0.3,
                                    delay: index * 0.1,
                                }}
                                whileHover={{ y: -4 }}
                                className="flex h-full flex-col rounded-2xl border border-border bg-background/10 p-5 transition-colors hover:border-primary/50 hover:bg-primary/3 sm:p-6"
                            >
                                <div className="mb-5 flex items-start justify-between gap-3">
                                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
                                        <Icon size={24} />
                                    </div>

                                    <span className="rounded-full bg-background/30 px-3 py-1.5 text-[10px] font-bold tracking-wider text-text-secondary">
                                        {option.label}
                                    </span>
                                </div>

                                <h2 className="text-lg font-bold text-text-primary">
                                    {option.title}
                                </h2>

                                <p className="mt-2 flex-1 text-sm leading-6 text-text-secondary">
                                    {option.description}
                                </p>

                                <div className="mt-6 w-full [&>div]:w-full">
                                    <Button
                                        href={option.href}
                                        variant={
                                            index === 0
                                                ? "primary"
                                                : "outline"
                                        }
                                        size="lg"
                                        className="w-full"
                                    >
                                        <div className="flex items-center justify-center gap-2">
                                            {option.action}
                                            <FiArrowRight size={17} />
                                        </div>
                                    </Button>
                                </div>
                            </motion.article>
                        );
                    })}
                </div>

                {/* Help note */}
                <div className="mt-6 flex items-start gap-3 rounded-2xl border border-border bg-background/30 p-4">
                    <FiHelpCircle
                        size={20}
                        className="mt-0.5 shrink-0 text-primary"
                    />

                    <div>
                        <p className="text-sm font-semibold text-text-primary">
                            Not sure which option to choose?
                        </p>

                        <p className="mt-1 text-xs leading-5 text-text-secondary">
                            If you have ever received a Helpdesk Pass ID,
                            choose Recover my ID. Choose Generate a new
                            ID only if you have never been issued one.
                            The system will check for an existing ID
                            before creating a new record.
                        </p>
                    </div>
                </div>

                {/* Footer */}
                <p className="mt-6 text-center text-xs leading-5 text-text-secondary">
                    Your identity will be verified before your Helpdesk
                    ID is recovered or issued.
                </p>
            </motion.section>
        </main>
    );
};

export default HelpdeskIdPage;