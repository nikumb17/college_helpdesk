"use client";
import { useState } from "react";
import { Formik, Form, FormikHelpers } from "formik";
import * as Yup from "yup";
import { motion, AnimatePresence } from "framer-motion";
import {
    FiArrowRight,
    FiCalendar,
    FiCheckCircle,
    FiClock,
    FiFileText,
    FiLoader,
    FiSearch,
    FiShield,
    FiXCircle,
} from "react-icons/fi";
import axios from "axios";
import { toast } from "react-toastify";

import Button from "../../shared/Button";
import InputField from "../../shared/InputField";

interface TrackTicketValues {
    ticketId: string;
}

interface TrackedTicket {
    ticketId: string;
    status: string;
    createdAt?: string;
    updatedAt?: string;
}

const ticketSchema = Yup.object({
    ticketId: Yup.string()
        .trim()
        .matches(
            /^TKT-\d{2}-\d{6}$/i,
            "Enter a valid Ticket ID, e.g. TKT-26-000142."
        )
        .required("Please enter your Ticket ID."),
});

const statusConfig: Record<
    string,
    {
        label: string;
        description: string;
        className: string;
        icon: typeof FiClock;
    }
> = {
    open: {
        label: "Open",
        description: "Your query has been received and is awaiting review.",
        className: "border-blue-500/20 bg-blue-500/10 text-blue-600",
        icon: FiClock,
    },
    submitted: {
        label: "Submitted",
        description: "Your query has been received and is awaiting review.",
        className: "border-blue-500/20 bg-blue-500/10 text-blue-600",
        icon: FiClock,
    },
    pending: {
        label: "Pending",
        description: "Your query is awaiting the next action.",
        className: "border-amber-500/20 bg-amber-500/10 text-amber-600",
        icon: FiClock,
    },
    under_review: {
        label: "Under Review",
        description: "Your query is being reviewed by the helpdesk team.",
        className: "border-amber-500/20 bg-amber-500/10 text-amber-600",
        icon: FiClock,
    },
    in_progress: {
        label: "In Progress",
        description: "The helpdesk team is working on your query.",
        className: "border-indigo-500/20 bg-indigo-500/10 text-indigo-600",
        icon: FiLoader,
    },
    waiting_for_student: {
        label: "Waiting for You",
        description:
            "The helpdesk team needs additional information from you.",
        className: "border-amber-500/20 bg-amber-500/10 text-amber-600",
        icon: FiClock,
    },
    resolved: {
        label: "Resolved",
        description: "Your query has been resolved.",
        className: "border-emerald-500/20 bg-emerald-500/10 text-emerald-600",
        icon: FiCheckCircle,
    },
    closed: {
        label: "Closed",
        description: "This ticket has been closed.",
        className: "border-border bg-background text-text-secondary",
        icon: FiCheckCircle,
    },
    rejected: {
        label: "Rejected",
        description: "Your query could not be accepted.",
        className: "border-red-500/20 bg-red-500/10 text-red-600",
        icon: FiXCircle,
    },
};

const formatDate = (date?: string) => {
    if (!date) return "Not available";

    const parsedDate = new Date(date);

    if (Number.isNaN(parsedDate.getTime())) {
        return "Not available";
    }

    return new Intl.DateTimeFormat("en-IN", {
        dateStyle: "medium",
        timeStyle: "short",
    }).format(parsedDate);
};

const getErrorMessage = (
    error: unknown,
    fallback: string
): string => {
    if (axios.isAxiosError(error)) {
        return error.response?.data?.message ?? fallback;
    }

    if (error instanceof Error) {
        return error.message;
    }

    return fallback;
};

const ShortTrackTicket = () => {
    const [ticket, setTicket] = useState<TrackedTicket | null>(null);

    // Step 1: Submit Ticket ID and request an OTP.
    const handleTrackTicket = async (
        values: TrackTicketValues,
        helpers: FormikHelpers<TrackTicketValues>
    ) => {
        setTicket(null);
        try {
            // The confirm endpoint must set the HTTP-only
            // helpdesk_session cookie after successful verification.
            const response = await axios.post("/api/v1/helpdesk/tickets/track/short", {
                ticketId: values.ticketId,
            });

            const trackedTicket = response.data.ticket;

            if (!trackedTicket) {
                throw new Error(
                    "Ticket details were not returned by the server."
                );
            }

            setTicket(trackedTicket);

            toast.success("Ticket verified successfully.");
        } catch (error) {
            toast.error(
                getErrorMessage(
                    error,
                    "Unable to send OTP. Please check your Ticket ID and try again."
                )
            );
        } finally {
            helpers.setSubmitting(false);
        }
    };

    const normalizedStatus = ticket?.status
        .trim()
        .toLowerCase()
        .replace(/[\s-]+/g, "_");

    const status = normalizedStatus
        ? statusConfig[normalizedStatus] ?? {
            label: ticket?.status ?? "Unknown",
            description:
                "Please contact the helpdesk for more information.",
            className:
                "border-border bg-background text-text-secondary",
            icon: FiClock,
        }
        : null;

    const StatusIcon = status?.icon;

    return (
        <section
            id="track-ticket"
            className="px-4 py-16 sm:px-6 lg:py-24"
        >
            <div className="mx-auto max-w-6xl">
                <div className="grid items-start gap-10 lg:grid-cols-[1fr_1fr] lg:gap-16">
                    {/* Introduction */}
                    <motion.div
                        initial={{ opacity: 0, y: 16 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.4 }}
                    >
                        <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                            <FiSearch size={27} />
                        </div>

                        <p className="text-sm font-semibold uppercase tracking-widest text-primary">
                            Ticket Tracking
                        </p>

                        <h2 className="mt-3 text-3xl font-bold tracking-tight text-text-primary sm:text-4xl">
                            Know where your query stands.
                        </h2>

                        <p className="mt-4 max-w-lg text-base leading-7 text-text-secondary">
                            Already submitted a query? Enter your Ticket ID
                            and verify your identity to check its current
                            status and when it was last updated.
                        </p>

                        <div className="mt-8 space-y-4">
                            <div className="flex items-start gap-3">
                                <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-secondary/10 text-secondary">
                                    <FiShield size={17} />
                                </span>

                                <div>
                                    <p className="text-sm font-semibold text-text-primary">
                                        Secure ticket tracking
                                    </p>
                                    <p className="mt-1 text-sm leading-6 text-text-secondary">
                                        Verify the OTP sent to your registered
                                        contact before viewing your ticket
                                        details.
                                    </p>
                                </div>
                            </div>

                            <div className="flex items-start gap-3">
                                <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                                    <FiFileText size={17} />
                                </span>

                                <div>
                                    <p className="text-sm font-semibold text-text-primary">
                                        Keep your Ticket ID handy
                                    </p>
                                    <p className="mt-1 text-sm leading-6 text-text-secondary">
                                        Your Ticket ID is generated when your
                                        query is successfully submitted.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </motion.div>

                    {/* Tracking card */}
                    <motion.div
                        initial={{ opacity: 0, y: 16 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.4, delay: 0.1 }}
                        className="rounded-3xl border border-border bg-surface p-6 shadow-sm sm:p-8"
                    >
                        <div className="mb-6">
                            <h3 className="text-xl font-bold text-text-primary">
                                Track your ticket
                            </h3>

                            <p className="mt-2 text-sm leading-6 text-text-secondary">
                                Enter your Ticket ID to get started.
                            </p>
                        </div>

                        <Formik<TrackTicketValues>
                            initialValues={{ ticketId: "" }}
                            validationSchema={ticketSchema}
                            onSubmit={handleTrackTicket}
                        >
                            {({
                                errors,
                                touched,
                                isSubmitting,
                            }) => (
                                <Form className="space-y-5">
                                    <InputField
                                        name="ticketId"
                                        label="Ticket ID"
                                        placeholder="TKT-26-000142"
                                        icon={<FiFileText size={17} />}
                                        touched={touched.ticketId}
                                        error={errors.ticketId}
                                    />

                                    <Button
                                        type="submit"
                                        size="lg"
                                        className="w-full"
                                        loading={isSubmitting}
                                        loadingText="Sending OTP..."
                                    >
                                        Get Status
                                        <FiArrowRight className="ml-2 inline" />
                                    </Button>
                                </Form>
                            )}
                        </Formik>

                        {/* Ticket status: shown only after OTP verification */}
                        <AnimatePresence mode="wait">
                            {ticket && status && StatusIcon && (
                                <motion.div
                                    key={ticket.ticketId}
                                    initial={{ opacity: 0, y: 12 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -8 }}
                                    transition={{ duration: 0.25 }}
                                    className="mt-7 border-t border-border pt-7"
                                >
                                    <div className="flex flex-wrap items-start justify-between gap-3">
                                        <div>
                                            <p className="text-xs font-semibold uppercase tracking-widest text-text-secondary">
                                                Ticket ID
                                            </p>

                                            <p className="mt-2 break-all font-mono text-lg font-bold text-text-primary">
                                                {ticket.ticketId}
                                            </p>
                                        </div>

                                        <span
                                            className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-semibold ${status.className}`}
                                        >
                                            <StatusIcon size={14} />
                                            {status.label}
                                        </span>
                                    </div>

                                    <div className="mt-5 rounded-2xl border border-border bg-background/50 p-4">
                                        <p className="text-sm font-semibold text-text-primary">
                                            Current status
                                        </p>

                                        <p className="mt-2 text-sm leading-6 text-text-secondary">
                                            {status.description}
                                        </p>
                                    </div>

                                    <div className="mt-5 grid gap-4 sm:grid-cols-2">
                                        <div className="flex items-start gap-3">
                                            <FiCalendar
                                                className="mt-0.5 shrink-0 text-text-secondary"
                                                size={17}
                                            />

                                            <div>
                                                <p className="text-xs text-text-secondary">
                                                    Submitted on
                                                </p>

                                                <p className="mt-1 text-sm font-medium text-text-primary">
                                                    {formatDate(ticket.createdAt)}
                                                </p>
                                            </div>
                                        </div>

                                        <div className="flex items-start gap-3">
                                            <FiClock
                                                className="mt-0.5 shrink-0 text-text-secondary"
                                                size={17}
                                            />

                                            <div>
                                                <p className="text-xs text-text-secondary">
                                                    Last updated
                                                </p>

                                                <p className="mt-1 text-sm font-medium text-text-primary">
                                                    {formatDate(ticket.updatedAt)}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="mt-5">
                                        <Button
                                            href={`/track/${ticket.ticketId}`}
                                            size="lg"
                                            className="w-full"
                                        >
                                            View Details
                                            <FiArrowRight className="ml-2 inline" />
                                        </Button>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        <p className="mt-6 text-center text-xs leading-5 text-text-secondary">
                            Having trouble finding your ticket? Contact your
                            college helpdesk for assistance.
                        </p>
                    </motion.div>
                </div>
            </div>
        </section>
    );
};

export default ShortTrackTicket;