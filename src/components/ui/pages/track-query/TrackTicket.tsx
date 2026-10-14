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
    FiAlertCircle,
    FiPaperclip,
    FiMessageSquare,
    FiActivity,
    FiRefreshCw,
} from "react-icons/fi";
import axios from "axios";
import { toast } from "react-toastify";

import Button from "../../shared/Button";
import InputField from "../../shared/InputField";

interface TrackTicketValues {
    ticketId: string;
}

interface OtpValues {
    otp: string;
}

interface TicketAttachment {
    name?: string;
    url: string;
    mimeType?: string;
    size?: number;
}

interface TrackedTicket {
    ticketId: string;
    subject: string;
    description: string;
    category: string;
    priority: string;
    status: string;
    createdAt?: string;
    updatedAt?: string;
    attachments?: TicketAttachment[];
}

interface TicketResponseItem {
    _id?: string;
    actorType: "STUDENT" | "STAFF";
    message: string;
    visibility: "STUDENT";
    attachments?: TicketAttachment[];
    createdAt?: string;
}

interface TicketActivityItem {
    _id?: string;
    activityType: string;
    actorType: "STUDENT" | "STAFF" | "SYSTEM";
    previousStatus?: string;
    newStatus?: string;
    message?: string;
    createdAt?: string;
}

interface TrackStartData {
    challengeId?: string;
    maskedDestination?: string;
}

interface ApiResponse<T> {
    success?: boolean;
    message?: string;
    data?: T;
    ticket?: TrackedTicket;
    responses?: TicketResponseItem[];
    activities?: TicketActivityItem[];
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

const otpSchema = Yup.object({
    otp: Yup.string()
        .trim()
        .matches(/^\d{6}$/, "Enter the 6-digit OTP.")
        .required("Please enter the OTP."),
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
        icon: FiAlertCircle,
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

const normalizeStatus = (value?: string) =>
    (value ?? "")
        .trim()
        .toLowerCase()
        .replace(/[\s-]+/g, "_");

const formatLabel = (value?: string) => {
    if (!value) return "Not available";

    return value
        .replace(/[_-]+/g, " ")
        .replace(/\b\w/g, (character) => character.toUpperCase());
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

const formatFileSize = (bytes?: number) => {
    if (bytes == null || !Number.isFinite(bytes) || bytes < 0) {
        return null;
    }

    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) {
        return `${(bytes / 1024).toFixed(1)} KB`;
    }

    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
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

const InfoItem = ({
    label,
    value,
}: {
    label: string;
    value: string;
}) => (
    <div className="min-w-0 rounded-xl border border-border bg-background/30 p-4">
        <p className="text-xs font-medium text-text-secondary">{label}</p>
        <p className="mt-1 break-words text-sm font-semibold text-text-primary">
            {value || "Not available"}
        </p>
    </div>
);

const AttachmentList = ({
    attachments,
}: {
    attachments?: TicketAttachment[];
}) => {
    if (!attachments?.length) {
        return (
            <p className="text-sm text-text-secondary">
                No attachments were provided.
            </p>
        );
    }

    return (
        <div className="space-y-3">
            {attachments.map((attachment, index) => (
                <div
                    key={`${attachment.url}-${index}`}
                    className="flex min-w-0 items-center gap-3 rounded-xl border border-border p-3"
                >
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                        <FiPaperclip size={18} />
                    </span>

                    <div className="min-w-0 flex-1">
                        <p className="break-words text-sm font-semibold text-text-primary">
                            {attachment.name || `Attachment ${index + 1}`}
                        </p>

                        <p className="mt-1 text-xs text-text-secondary">
                            {attachment.mimeType || "File"}
                            {attachment.size != null
                                ? ` · ${formatFileSize(attachment.size)}`
                                : ""}
                        </p>
                    </div>

                    <a
                        href={attachment.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="shrink-0 text-sm font-semibold text-primary hover:underline"
                    >
                        Open
                    </a>
                </div>
            ))}
        </div>
    );
};

const TrackTicket = ({ ticketId }: { ticketId: string }) => {
    const [ticket, setTicket] = useState<TrackedTicket | null>(null);
    const [responses, setResponses] = useState<TicketResponseItem[]>([]);
    const [activities, setActivities] = useState<TicketActivityItem[]>([]);

    const [otpStep, setOtpStep] = useState(false);
    const [pendingTicketId, setPendingTicketId] = useState("");
    const [challengeId, setChallengeId] = useState("");
    const [maskedDestination, setMaskedDestination] = useState("");
    const [isResendingOtp, setIsResendingOtp] = useState(false);

    const clearTicketDetails = () => {
        setTicket(null);
        setResponses([]);
        setActivities([]);
    };

    // Step 1: Request OTP using the submitted Ticket ID.
    const handleTrackTicket = async (
        values: TrackTicketValues,
        helpers: FormikHelpers<TrackTicketValues>
    ) => {
        const normalizedTicketId = values.ticketId.trim().toUpperCase();

        clearTicketDetails();
        setOtpStep(false);
        setChallengeId("");
        setMaskedDestination("");

        try {
            const response = await axios.post<
                ApiResponse<TrackStartData>
            >(
                "/api/v1/helpdesk/tickets/track/start",
                { ticketId: normalizedTicketId },
                { withCredentials: true }
            );

            const newChallengeId = response.data.data?.challengeId;

            if (!newChallengeId) {
                throw new Error(
                    "The server did not return an OTP challenge."
                );
            }

            setPendingTicketId(normalizedTicketId);
            setChallengeId(newChallengeId);
            setMaskedDestination(
                response.data.data?.maskedDestination ?? ""
            );
            setOtpStep(true);

            toast.success(
                response.data.message ??
                "OTP sent to your registered contact."
            );
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

    // Step 2: Verify OTP and fetch detailed ticket information.
    const handleVerifyOtp = async (
        values: OtpValues,
        helpers: FormikHelpers<OtpValues>
    ) => {
        try {
            await axios.post(
                "/api/v1/helpdesk/tickets/track/confirm",
                {
                    ticketId: pendingTicketId,
                    challengeId,
                    otp: values.otp.trim(),
                },
                { withCredentials: true }
            );

            const response = await axios.post<
                ApiResponse<never>
            >(
                "/api/v1/helpdesk/tickets/track",
                { ticketId: pendingTicketId },
                { withCredentials: true }
            );

            const trackedTicket = response.data.ticket;

            if (!trackedTicket) {
                throw new Error(
                    "Detailed ticket information was not returned."
                );
            }

            setTicket(trackedTicket);
            setResponses(response.data.responses ?? []);
            setActivities(response.data.activities ?? []);

            setOtpStep(false);
            setChallengeId("");
            setMaskedDestination("");

            toast.success("Ticket verified successfully.");
        } catch (error) {
            toast.error(
                getErrorMessage(
                    error,
                    "OTP verification or ticket retrieval failed. Please try again."
                )
            );
        } finally {
            helpers.setSubmitting(false);
        }
    };

    // Resend OTP using the same Ticket ID.
    const handleResendOtp = async () => {
        if (isResendingOtp || !pendingTicketId) return;

        setIsResendingOtp(true);

        try {
            const response = await axios.post<
                ApiResponse<TrackStartData>
            >(
                "/api/v1/helpdesk/tickets/track/start",
                { ticketId: pendingTicketId },
                { withCredentials: true }
            );

            const newChallengeId = response.data.data?.challengeId;

            if (!newChallengeId) {
                throw new Error(
                    "The server did not return a new OTP challenge."
                );
            }

            setChallengeId(newChallengeId);
            setMaskedDestination(
                response.data.data?.maskedDestination ?? ""
            );

            toast.success(
                response.data.message ?? "A new OTP has been sent."
            );
        } catch (error) {
            toast.error(
                getErrorMessage(
                    error,
                    "Unable to resend OTP. Please try again."
                )
            );
        } finally {
            setIsResendingOtp(false);
        }
    };

    const handleChangeTicketId = () => {
        setOtpStep(false);
        setPendingTicketId("");
        setChallengeId("");
        setMaskedDestination("");
        clearTicketDetails();
    };

    const normalizedStatus = normalizeStatus(ticket?.status);

    const status = normalizedStatus
        ? statusConfig[normalizedStatus] ?? {
            label: formatLabel(ticket?.status),
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
            <div className="mx-auto max-w-5xl">
                <motion.div
                    initial={{ opacity: 0, y: 16 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.4 }}
                    className="rounded-3xl border border-border bg-surface p-5 shadow-sm sm:p-8"
                >
                    {/* Header */}
                    <div className="mb-7 flex items-start gap-4">
                        <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                            <FiSearch size={23} />
                        </span>

                        <div>
                            <p className="text-xs font-semibold uppercase tracking-widest text-primary">
                                Helpdesk
                            </p>

                            <h2 className="mt-1 text-2xl font-bold text-text-primary sm:text-3xl">
                                {ticket
                                    ? "Ticket Details"
                                    : otpStep
                                        ? "Verify Your Identity"
                                        : "Track Your Ticket"}
                            </h2>

                            <p className="mt-2 text-sm leading-6 text-text-secondary">
                                {ticket
                                    ? "Review your query, current status, attachments, responses, and activity history."
                                    : otpStep
                                        ? "Enter the OTP sent to your registered contact to view your ticket."
                                        : "Enter your Ticket ID and verify your identity to securely access your ticket details."}
                            </p>
                        </div>
                    </div>

                    {/* Ticket ID form */}
                    <AnimatePresence mode="wait" initial={false}>
                        {!otpStep && !ticket && (
                            <motion.div
                                key="ticket-id-form"
                                initial={{ opacity: 0, y: 8 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -8 }}
                            >
                                <Formik<TrackTicketValues>
                                    initialValues={{ ticketId }}
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
                                                Continue to Verification
                                                <FiArrowRight className="ml-2 inline" />
                                            </Button>
                                        </Form>
                                    )}
                                </Formik>
                            </motion.div>
                        )}

                        {/* OTP form */}
                        {otpStep && (
                            <motion.div
                                key="otp-form"
                                initial={{ opacity: 0, y: 8 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -8 }}
                                className="space-y-5"
                            >
                                <div className="rounded-2xl border border-primary/20 bg-primary/5 p-4">
                                    <div className="flex items-start gap-3">
                                        <FiShield
                                            size={20}
                                            className="mt-0.5 shrink-0 text-primary"
                                        />

                                        <div className="min-w-0">
                                            <p className="font-semibold text-text-primary">
                                                OTP verification required
                                            </p>

                                            <p className="mt-1 text-sm leading-6 text-text-secondary">
                                                Enter the 6-digit OTP sent
                                                to your registered contact
                                                {maskedDestination
                                                    ? ` (${maskedDestination})`
                                                    : ""}
                                                .
                                            </p>

                                            <p className="mt-2 break-all text-xs text-text-secondary">
                                                Ticket ID:{" "}
                                                <span className="font-mono font-semibold text-text-primary">
                                                    {pendingTicketId}
                                                </span>
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                <Formik<OtpValues>
                                    initialValues={{ otp: "" }}
                                    validationSchema={otpSchema}
                                    onSubmit={handleVerifyOtp}
                                >
                                    {({
                                        errors,
                                        touched,
                                        isSubmitting,
                                    }) => (
                                        <Form className="space-y-5">
                                            <InputField
                                                name="otp"
                                                label="6-digit OTP"
                                                placeholder="Enter your OTP"
                                                icon={<FiShield size={17} />}
                                                touched={touched.otp}
                                                error={errors.otp}
                                            />

                                            <Button
                                                type="submit"
                                                size="lg"
                                                className="w-full"
                                                loading={isSubmitting}
                                                loadingText="Verifying OTP..."
                                            >
                                                Verify OTP & View Ticket
                                                <FiArrowRight className="ml-2 inline" />
                                            </Button>

                                            <div className="flex flex-wrap items-center justify-between gap-3 text-sm">
                                                <button
                                                    type="button"
                                                    onClick={handleResendOtp}
                                                    disabled={isResendingOtp}
                                                    className="font-semibold text-primary hover:underline disabled:opacity-50"
                                                >
                                                    {isResendingOtp
                                                        ? "Sending OTP..."
                                                        : "Resend OTP"}
                                                </button>

                                                <button
                                                    type="button"
                                                    onClick={handleChangeTicketId}
                                                    className="text-text-secondary hover:text-text-primary"
                                                >
                                                    Change Ticket ID
                                                </button>
                                            </div>
                                        </Form>
                                    )}
                                </Formik>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* Detailed ticket result */}
                    <AnimatePresence mode="wait">
                        {ticket && status && StatusIcon && (
                            <motion.div
                                key={ticket.ticketId}
                                initial={{ opacity: 0, y: 12 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -8 }}
                                transition={{ duration: 0.25 }}
                                className="space-y-7"
                            >
                                {/* Ticket heading and status */}
                                <div className="border-t border-border pt-7">
                                    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                                        <div className="min-w-0">
                                            <p className="text-xs font-semibold uppercase tracking-widest text-text-secondary">
                                                Ticket ID
                                            </p>

                                            <p className="mt-2 break-all font-mono text-xl font-bold text-text-primary">
                                                {ticket.ticketId}
                                            </p>

                                            <h3 className="mt-3 break-words text-xl font-bold text-text-primary sm:text-2xl">
                                                {ticket.subject}
                                            </h3>
                                        </div>

                                        <span
                                            className={`inline-flex w-fit shrink-0 items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-semibold ${status.className}`}
                                        >
                                            <StatusIcon size={14} />
                                            {status.label}
                                        </span>
                                    </div>

                                    <div className="mt-5 rounded-2xl border border-border bg-background/30 p-4">
                                        <p className="text-sm font-semibold text-text-primary">
                                            Current status
                                        </p>

                                        <p className="mt-2 text-sm leading-6 text-text-secondary">
                                            {status.description}
                                        </p>
                                    </div>
                                </div>

                                {/* Overview */}
                                <section>
                                    <div className="mb-4 flex items-center gap-2">
                                        <FiFileText
                                            size={18}
                                            className="text-primary"
                                        />
                                        <h3 className="font-bold text-text-primary">
                                            Ticket Overview
                                        </h3>
                                    </div>

                                    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                                        <InfoItem
                                            label="Category"
                                            value={formatLabel(ticket.category)}
                                        />

                                        <InfoItem
                                            label="Priority"
                                            value={formatLabel(ticket.priority)}
                                        />

                                        <InfoItem
                                            label="Status"
                                            value={status.label}
                                        />

                                        <InfoItem
                                            label="Submitted On"
                                            value={formatDate(ticket.createdAt)}
                                        />

                                        <InfoItem
                                            label="Last Updated"
                                            value={formatDate(ticket.updatedAt)}
                                        />

                                        <InfoItem
                                            label="Ticket Reference"
                                            value={ticket.ticketId}
                                        />
                                    </div>
                                </section>

                                {/* Description */}
                                <section>
                                    <div className="mb-4 flex items-center gap-2">
                                        <FiMessageSquare
                                            size={18}
                                            className="text-primary"
                                        />
                                        <h3 className="font-bold text-text-primary">
                                            Query Description
                                        </h3>
                                    </div>

                                    <div className="rounded-2xl border border-border bg-background/30 p-4 sm:p-5">
                                        <p className="whitespace-pre-wrap break-words text-sm leading-7 text-text-secondary">
                                            {ticket.description ||
                                                "No description is available."}
                                        </p>
                                    </div>
                                </section>

                                {/* Ticket attachments */}
                                <section>
                                    <div className="mb-4 flex items-center gap-2">
                                        <FiPaperclip
                                            size={18}
                                            className="text-primary"
                                        />
                                        <h3 className="font-bold text-text-primary">
                                            Submitted Attachments
                                        </h3>
                                    </div>

                                    <AttachmentList
                                        attachments={ticket.attachments}
                                    />
                                </section>

                                {/* Student-visible responses */}
                                <section>
                                    <div className="mb-4 flex items-center gap-2">
                                        <FiMessageSquare
                                            size={18}
                                            className="text-primary"
                                        />
                                        <h3 className="font-bold text-text-primary">
                                            Conversation & Responses
                                        </h3>
                                    </div>

                                    {responses.length === 0 ? (
                                        <div className="rounded-2xl border border-dashed border-border p-5 text-sm text-text-secondary">
                                            No additional responses have been
                                            shared on this ticket yet.
                                        </div>
                                    ) : (
                                        <div className="space-y-4">
                                            {responses.map(
                                                (response, index) => (
                                                    <div
                                                        key={
                                                            response._id ??
                                                            `${response.createdAt}-${index}`
                                                        }
                                                        className="rounded-2xl border border-border p-4 sm:p-5"
                                                    >
                                                        <div className="flex flex-wrap items-center justify-between gap-2">
                                                            <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
                                                                {response.actorType ===
                                                                    "STAFF"
                                                                    ? "Helpdesk Team"
                                                                    : "Your Response"}
                                                            </span>

                                                            <span className="text-xs text-text-secondary">
                                                                {formatDate(
                                                                    response.createdAt
                                                                )}
                                                            </span>
                                                        </div>

                                                        <p className="mt-3 whitespace-pre-wrap break-words text-sm leading-7 text-text-secondary">
                                                            {response.message}
                                                        </p>

                                                        {response.attachments?.length ? (
                                                            <div className="mt-4">
                                                                <AttachmentList
                                                                    attachments={
                                                                        response.attachments
                                                                    }
                                                                />
                                                            </div>
                                                        ) : null}
                                                    </div>
                                                )
                                            )}
                                        </div>
                                    )}
                                </section>

                                {/* Activity history */}
                                <section>
                                    <div className="mb-4 flex items-center gap-2">
                                        <FiActivity
                                            size={18}
                                            className="text-primary"
                                        />
                                        <h3 className="font-bold text-text-primary">
                                            Ticket Activity History
                                        </h3>
                                    </div>

                                    {activities.length === 0 ? (
                                        <div className="rounded-2xl border border-dashed border-border p-5 text-sm text-text-secondary">
                                            No additional activity history is
                                            available.
                                        </div>
                                    ) : (
                                        <div className="relative space-y-0">
                                            {activities.map(
                                                (activity, index) => (
                                                    <div
                                                        key={
                                                            activity._id ??
                                                            `${activity.createdAt}-${index}`
                                                        }
                                                        className="relative flex gap-4 pb-6 last:pb-0"
                                                    >
                                                        <div className="relative flex w-5 shrink-0 justify-center">
                                                            {index <
                                                                activities.length -
                                                                1 && (
                                                                    <span className="absolute top-5 h-full w-px bg-border" />
                                                                )}

                                                            <span className="relative z-10 mt-1 flex h-5 w-5 items-center justify-center rounded-full border border-primary/20 bg-primary/10 text-primary">
                                                                <FiCheckCircle
                                                                    size={11}
                                                                />
                                                            </span>
                                                        </div>

                                                        <div className="min-w-0 flex-1 rounded-xl border border-border p-4">
                                                            <div className="flex flex-wrap items-start justify-between gap-2">
                                                                <p className="text-sm font-semibold text-text-primary">
                                                                    {formatLabel(
                                                                        activity.activityType
                                                                    )}
                                                                </p>

                                                                <span className="text-xs text-text-secondary">
                                                                    {formatDate(
                                                                        activity.createdAt
                                                                    )}
                                                                </span>
                                                            </div>

                                                            {activity.previousStatus ||
                                                                activity.newStatus ? (
                                                                <p className="mt-2 text-sm text-text-secondary">
                                                                    {activity.previousStatus
                                                                        ? formatLabel(
                                                                            activity.previousStatus
                                                                        )
                                                                        : "Started"}
                                                                    {" → "}
                                                                    {formatLabel(
                                                                        activity.newStatus
                                                                    )}
                                                                </p>
                                                            ) : null}

                                                            {activity.message ? (
                                                                <p className="mt-2 whitespace-pre-wrap break-words text-sm leading-6 text-text-secondary">
                                                                    {
                                                                        activity.message
                                                                    }
                                                                </p>
                                                            ) : null}
                                                        </div>
                                                    </div>
                                                )
                                            )}
                                        </div>
                                    )}
                                </section>

                                {/* Actions */}
                                <div className="flex flex-col gap-3 border-t border-border pt-6 sm:flex-row">
                                    <button
                                        type="button"
                                        onClick={() => {
                                            clearTicketDetails();
                                            toast.info(
                                                "You can enter another Ticket ID."
                                            );
                                        }}
                                        className="inline-flex items-center justify-center gap-2 rounded-xl border border-border px-4 py-3 text-sm font-semibold text-text-primary transition hover:bg-background"
                                    >
                                        <FiRefreshCw size={16} />
                                        Track Another Ticket
                                    </button>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    <p className="mt-7 text-center text-xs leading-5 text-text-secondary">
                        For additional assistance, contact your college
                        helpdesk. Internal staff notes are not displayed here.
                    </p>
                </motion.div>
            </div>
        </section>
    );
};

export default TrackTicket;