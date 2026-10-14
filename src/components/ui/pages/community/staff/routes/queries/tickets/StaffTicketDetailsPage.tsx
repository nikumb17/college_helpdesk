"use client";
import { useCallback, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";
import {
    FiArrowLeft,
    FiAlertCircle,
    FiCheckCircle,
    FiClock,
    FiMessageSquare,
    FiPaperclip,
    FiRefreshCw,
    FiSend,
    FiUser,
    FiUserCheck,
    FiActivity,
    FiXCircle,
    FiLoader,
    FiLock,
    FiCheck,
} from "react-icons/fi";
import Button from "@/components/ui/shared/Button";
import { toast } from "react-toastify";

type TicketStatus =
    | "SUBMITTED"
    | "UNDER_REVIEW"
    | "IN_PROGRESS"
    | "WAITING_FOR_STUDENT"
    | "RESOLVED"
    | "CLOSED"
    | "REJECTED";

type TicketPriority = "LOW" | "MEDIUM" | "HIGH";

type ActivityVisibility = "STUDENT" | "STAFF";

interface TicketStudent {
    _id?: string;
    name?: string;
    firstName?: string;
    lastName?: string;
    enrollmentNumber?: string;
    email?: string;
    contactNo?: string;
    department?: string;
    year?: string | number;
    institution?: string;
}

interface TicketAssignee {
    _id: string;
    name: string;
    email?: string;
}

interface Ticket {
    _id: string;
    ticketId: string;
    subject: string;
    description: string;
    category: string;
    priority: TicketPriority;
    status: TicketStatus;
    createdAt: string;
    updatedAt?: string;
    studentId?: TicketStudent | string | null;
    student?: TicketStudent | null;
    assignedTo?: TicketAssignee | null;
    resolution?: string;
    attachments?: Array<{
        name: string;
        url: string;
    }>;
}

interface TicketActivity {
    _id: string;
    activityType: string;
    actorType: "STUDENT" | "STAFF" | "SYSTEM";
    actorId?: string;
    actorName?: string;
    message?: string;
    previousStatus?: TicketStatus;
    newStatus?: TicketStatus;
    visibility: ActivityVisibility;
    createdAt: string;
}

interface TicketResponse {
    _id: string;
    message: string;
    visibility: ActivityVisibility;
    createdAt: string;
    senderName?: string;
    actorType?: "STUDENT" | "STAFF" | "SYSTEM";
}

const STATUS_OPTIONS: TicketStatus[] = [
    "SUBMITTED",
    "UNDER_REVIEW",
    "IN_PROGRESS",
    "WAITING_FOR_STUDENT",
    "RESOLVED",
    "CLOSED",
    "REJECTED",
];

const STATUS_STYLES: Record<TicketStatus, string> = {
    SUBMITTED: "bg-blue-50 text-blue-700 ring-blue-200",
    UNDER_REVIEW: "bg-violet-50 text-violet-700 ring-violet-200",
    IN_PROGRESS: "bg-amber-50 text-amber-700 ring-amber-200",
    WAITING_FOR_STUDENT: "bg-orange-50 text-orange-700 ring-orange-200",
    RESOLVED: "bg-emerald-50 text-emerald-700 ring-emerald-200",
    CLOSED: "bg-slate-100 text-slate-600 ring-slate-200",
    REJECTED: "bg-red-50 text-red-700 ring-red-200",
};

const PRIORITY_STYLES: Record<TicketPriority, string> = {
    LOW: "bg-slate-100 text-slate-600",
    MEDIUM: "bg-amber-50 text-amber-700",
    HIGH: "bg-red-50 text-red-700",
};

const STATUS_TRANSITIONS: Partial<Record<TicketStatus, TicketStatus[]>> = {
    SUBMITTED: ["UNDER_REVIEW"],
    UNDER_REVIEW: ["IN_PROGRESS", "REJECTED"],
    IN_PROGRESS: ["WAITING_FOR_STUDENT", "RESOLVED"],
    WAITING_FOR_STUDENT: ["IN_PROGRESS"],
    RESOLVED: ["CLOSED"],
};

const formatStatus = (status: string) =>
    status.replaceAll("_", " ").toLowerCase().replace(/\b\w/g, (char) =>
        char.toUpperCase()
    );

const formatDate = (date?: string) => {
    if (!date) return "—";

    const parsed = new Date(date);

    if (Number.isNaN(parsed.getTime())) return "—";

    return new Intl.DateTimeFormat("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
    }).format(parsed);
};

const getStudentName = (student?: TicketStudent | null) => {
    if (!student) return "Student";

    if (student.name) return student.name;

    return (
        [student.firstName, student.lastName].filter(Boolean).join(" ") ||
        "Student"
    );
};

export default function StaffTicketDetailsPage({ ticketData, activitiesData, responsesData }: { ticketData: Ticket; activitiesData: TicketActivity[]; responsesData: TicketResponse[] }) {
    const router = useRouter();

    const [ticket, setTicket] = useState<Ticket | null>(ticketData);
    const [activities, setActivities] = useState<TicketActivity[]>(activitiesData);
    const [responses, setResponses] = useState<TicketResponse[]>(responsesData);

    const [loading, setLoading] = useState(false);
    const [refreshing, setRefreshing] = useState(false);
    const [submitting, setSubmitting] = useState(false);

    const [reply, setReply] = useState("");
    const [visibility, setVisibility] =
        useState<ActivityVisibility>("STUDENT");

    const [nextStatus, setNextStatus] = useState<TicketStatus | "">("");
    const [statusReason, setStatusReason] = useState("");

    const [error, setError] = useState("");
    const [notice, setNotice] = useState("");

    const fetchTicket = useCallback(
        async (isRefresh = false) => {
            try {
                if (isRefresh) {
                    setRefreshing(true);
                } else {
                    setLoading(true);
                }

                const response = await axios.get(
                    `/api/v1/helpdesk/staff/tickets/info?ticketId=${encodeURIComponent(ticket?.ticketId || "")}`
                );
                const data = response.data?.data;

                const fetchedTicket: Ticket | undefined =
                    data?.ticket ?? data;

                if (!fetchedTicket?._id) {
                    throw new Error("Ticket details were not returned.");
                }

                setTicket(fetchedTicket);
                setActivities(data?.activities ?? []);
                setResponses(data?.responses ?? []);
                setNextStatus("");

            } catch (err) {
                console.error("Failed to fetch ticket:", err);

                toast.error(
                    axios.isAxiosError(err)
                        ? err.response?.data?.message ??
                        "Unable to load ticket details."
                        : err instanceof Error
                            ? err.message
                            : "Unable to load ticket details."
                );
            } finally {
                setLoading(false);
                setRefreshing(false);
            }
        },
        []
    );

    const updateStatus = async () => {
        if (!ticket || !nextStatus) return;

        const allowedTransitions =
            STATUS_TRANSITIONS[ticket.status] ?? [];

        if (!allowedTransitions.includes(nextStatus)) {
            setError("This status transition is not allowed.");
            return;
        }

        if (
            nextStatus === "REJECTED" &&
            !statusReason.trim()
        ) {
            setError("Please provide a reason before rejecting this ticket.");
            return;
        }

        if (
            !window.confirm(
                `Change ticket status to ${formatStatus(nextStatus)}?`
            )
        ) {
            return;
        }

        try {
            setSubmitting(true);

            await axios.post(`/api/v1/helpdesk/staff/tickets/info/status?ticketId=${encodeURIComponent(ticket?.ticketId || "")}`,
                JSON.stringify({
                    status: nextStatus,
                    reason: statusReason.trim() || undefined,
                }),
                {
                    headers: {
                        "Content-Type": "application/json",
                    },
                },
            );

            toast.success("Ticket status updated successfully.");
            setStatusReason("");
            setNextStatus("");

            await fetchTicket(true);
        } catch (err) {
            toast.error(
                axios.isAxiosError(err)
                    ? err.response?.data?.message ??
                    "Unable to update ticket status."
                    : "Unable to update ticket status."
            );
        } finally {
            setSubmitting(false);
        }
    };

    const addResponse = async () => {
        if (!ticket || !reply.trim()) return;

        try {
            setSubmitting(true);

            await axios.post(`/api/v1/helpdesk/staff/tickets/info/response/create?ticketId=${encodeURIComponent(ticket?.ticketId || "")}`,
                JSON.stringify({
                    message: reply.trim(),
                    visibility,
                }),
                {
                    headers: {
                        "Content-Type": "application/json",
                    },
                },
            );

            setReply("");
            toast.success(
                visibility === "STAFF"
                    ? "Internal note added successfully."
                    : "Reply sent successfully."
            );

            await fetchTicket(true);
        } catch (err) {
            toast.error(
                axios.isAxiosError(err)
                    ? err.response?.data?.message ??
                    "Unable to submit your response."
                    : "Unable to submit your response."
            );
        } finally {
            setSubmitting(false);
        }
    };

    const resolveTicket = async () => {
        if (!ticket) return;

        if (
            !window.confirm(
                "Mark this ticket as resolved? Make sure the resolution is documented."
            )
        ) {
            return;
        }

        try {
            setSubmitting(true);

            await axios.post(`/api/v1/helpdesk/staff/tickets/info/resolve?ticketId=${encodeURIComponent(ticket?.ticketId || "")}`,
                JSON.stringify({
                    resolution: statusReason.trim() || undefined,
                }),
                {
                    headers: {
                        "Content-Type": "application/json",
                    },
                },
            );

            setStatusReason("");
            toast.success("Ticket marked as resolved.");
            await fetchTicket(true);
        } catch (err) {
            toast.error(
                axios.isAxiosError(err)
                    ? err.response?.data?.message ??
                    "Unable to resolve ticket."
                    : "Unable to resolve ticket."
            );
        } finally {
            setSubmitting(false);
        }
    };

    const closeTicket = async () => {
        if (!ticket || ticket.status !== "RESOLVED") return;

        if (!window.confirm("Are you sure you want to close this ticket?")) {
            return;
        }

        try {
            setSubmitting(true);
            setError("");
            setNotice("");

            await axios.post(`/api/v1/helpdesk/staff/tickets/info/close?ticketId=${encodeURIComponent(ticket?.ticketId || "")}`, {});

            setNotice("Ticket closed successfully.");
            await fetchTicket(true);
        } catch (err) {
            setError(
                axios.isAxiosError(err)
                    ? err.response?.data?.message ??
                    "Unable to close ticket."
                    : "Unable to close ticket."
            );
        } finally {
            setSubmitting(false);
        }
    };

    const student = useMemo(() => {
        if (ticket?.student) return ticket.student;

        if (
            ticket?.studentId &&
            typeof ticket.studentId === "object"
        ) {
            return ticket.studentId;
        }

        return null;
    }, [ticket]);

    const studentName = getStudentName(student);

    const visibleActivities = useMemo(
        () =>
            activities.filter(
                (activity) =>
                    activity.visibility === "STAFF" ||
                    activity.visibility === "STUDENT"
            ),
        [activities]
    );

    if (loading) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
                <div className="flex items-center gap-3 text-sm text-slate-500">
                    <FiLoader className="animate-spin text-xl" />
                    Loading ticket details...
                </div>
            </div>
        );
    }

    if (!ticket) {
        return (
            <main className="min-h-screen bg-slate-50 px-4 py-12">
                <div className="mx-auto max-w-xl rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">
                    <FiAlertCircle className="mx-auto mb-4 text-4xl text-red-500" />

                    <h1 className="text-xl font-semibold text-slate-900">
                        Unable to load ticket
                    </h1>

                    <p className="mt-2 text-sm text-slate-500">
                        {error || "This ticket could not be found."}
                    </p>

                    <div className="mt-6 flex justify-center gap-3">
                        <button
                            onClick={() => router.back()}
                            className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
                        >
                            Go back
                        </button>

                        <Button
                            type="button"
                            onClick={() => void fetchTicket()}
                        >
                            Try again
                        </Button>
                    </div>
                </div>
            </main>
        );
    }

    const allowedTransitions = STATUS_TRANSITIONS[ticket.status] ?? [];

    const isTerminal =
        ticket.status === "RESOLVED" ||
        ticket.status === "CLOSED" ||
        ticket.status === "REJECTED";

    const canRespond = !isTerminal;

    return (
        <main className="min-h-screen bg-slate-50">
            <div className="mx-auto w-full space-y-6 px-4 py-6 sm:px-6 lg:px-8">
                {/* Header */}
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <button
                            onClick={() => router.push("/community/staff/tickets")}
                            className="mb-4 inline-flex items-center gap-2 text-sm font-medium text-slate-500 transition hover:text-blue-600"
                        >
                            <FiArrowLeft />
                            Back to My Tickets
                        </button>

                        <div className="flex flex-wrap items-center gap-3">
                            <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
                                Ticket Details
                            </h1>

                            <span className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 font-mono text-sm font-semibold text-slate-700">
                                {ticket.ticketId}
                            </span>
                        </div>

                        <p className="mt-2 text-sm text-slate-500">
                            Review the issue, communicate with the student,
                            and manage its resolution.
                        </p>
                    </div>

                    <button
                        onClick={() => void fetchTicket(true)}
                        disabled={refreshing || submitting}
                        className="inline-flex items-center justify-center gap-2 self-start rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:opacity-50 sm:self-auto"
                    >
                        <FiRefreshCw
                            className={refreshing ? "animate-spin" : ""}
                        />
                        Refresh
                    </button>
                </div>

                {/* Feedback */}
                {error && (
                    <div
                        role="alert"
                        className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700"
                    >
                        <FiAlertCircle className="mt-0.5 shrink-0 text-lg" />
                        <p>{error}</p>
                        <button
                            onClick={() => setError("")}
                            className="ml-auto text-red-500 hover:text-red-800"
                            aria-label="Dismiss error"
                        >
                            <FiXCircle />
                        </button>
                    </div>
                )}

                {notice && (
                    <div
                        role="status"
                        className="flex items-center gap-3 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-700"
                    >
                        <FiCheckCircle className="shrink-0 text-lg" />
                        <p>{notice}</p>
                        <button
                            onClick={() => setNotice("")}
                            className="ml-auto"
                            aria-label="Dismiss notification"
                        >
                            <FiXCircle />
                        </button>
                    </div>
                )}

                {/* Summary cards */}
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
                    <SummaryCard
                        label="Current Status"
                        value={formatStatus(ticket.status)}
                        icon={<FiActivity />}
                    >
                        <span
                            className={`mt-2 inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-inset ${STATUS_STYLES[ticket.status]}`}
                        >
                            {formatStatus(ticket.status)}
                        </span>
                    </SummaryCard>

                    <SummaryCard
                        label="Priority"
                        value={ticket.priority}
                        icon={<FiAlertCircle />}
                    >
                        <span
                            className={`mt-2 inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${PRIORITY_STYLES[ticket.priority]}`}
                        >
                            {ticket.priority}
                        </span>
                    </SummaryCard>

                    <SummaryCard
                        label="Created On"
                        value={formatDate(ticket.createdAt)}
                        icon={<FiClock />}
                    />

                    <SummaryCard
                        label="Assigned To"
                        value={ticket.assignedTo?.name ?? "Unassigned"}
                        icon={<FiUserCheck />}
                    >
                        {ticket.assignedTo?.email && (
                            <p className="mt-1 truncate text-xs text-slate-500">
                                {ticket.assignedTo.email}
                            </p>
                        )}
                    </SummaryCard>
                </div>

                {/* Main layout */}
                <div className="grid grid-cols-1 items-start gap-6 xl:grid-cols-3">
                    <div className="space-y-6 xl:col-span-2">
                        {/* Ticket description */}
                        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                            <div className="border-b border-slate-100 p-5 sm:p-6">
                                <div className="flex flex-wrap items-center gap-2">
                                    <span className="rounded-md bg-blue-50 px-2.5 py-1 text-xs font-semibold text-blue-700">
                                        {ticket.category}
                                    </span>

                                    <span className="text-xs text-slate-400">
                                        Updated {formatDate(ticket.updatedAt)}
                                    </span>
                                </div>

                                <h2 className="mt-4 text-xl font-bold text-slate-900 sm:text-2xl">
                                    {ticket.subject}
                                </h2>

                                <div className="mt-5 whitespace-pre-wrap wrap-break-word text-sm leading-7 text-slate-600">
                                    {ticket.description ||
                                        "No description was provided."}
                                </div>
                            </div>

                            {ticket.attachments &&
                                ticket.attachments.length > 0 && (
                                    <div className="p-5 sm:p-6">
                                        <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-900">
                                            <FiPaperclip />
                                            Attachments
                                        </h3>

                                        <div className="flex flex-wrap gap-3">
                                            {ticket.attachments.map(
                                                (attachment, index) => (
                                                    <a
                                                        key={`${attachment.url}-${index}`}
                                                        href={attachment.url}
                                                        target="_blank"
                                                        rel="noreferrer"
                                                        className="inline-flex max-w-full items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm text-blue-700 hover:bg-blue-50"
                                                    >
                                                        <FiPaperclip className="shrink-0" />
                                                        <span className="truncate">
                                                            {attachment.name}
                                                        </span>
                                                    </a>
                                                )
                                            )}
                                        </div>
                                    </div>
                                )}
                        </section>

                        {/* Response composer */}
                        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
                            <div className="mb-5 flex items-center gap-3">
                                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                                    <FiMessageSquare className="text-lg" />
                                </div>

                                <div>
                                    <h2 className="font-semibold text-slate-900">
                                        Conversation
                                    </h2>
                                    <p className="text-sm text-slate-500">
                                        Communicate with the student or add an
                                        internal note.
                                    </p>
                                </div>
                            </div>

                            {/* Visibility selector */}
                            <div className="mb-4 flex flex-wrap gap-2">
                                <button
                                    type="button"
                                    onClick={() => setVisibility("STUDENT")}
                                    disabled={!canRespond || submitting}
                                    className={`rounded-lg px-3 py-2 text-sm font-medium transition ${visibility === "STUDENT"
                                        ? "bg-blue-600 text-white"
                                        : "border border-slate-200 text-slate-600 hover:bg-slate-50"
                                        } disabled:cursor-not-allowed disabled:opacity-50`}
                                >
                                    Reply to Student
                                </button>

                                <button
                                    type="button"
                                    onClick={() => setVisibility("STAFF")}
                                    disabled={!canRespond || submitting}
                                    className={`inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition ${visibility === "STAFF"
                                        ? "bg-amber-500 text-white"
                                        : "border border-slate-200 text-slate-600 hover:bg-slate-50"
                                        } disabled:cursor-not-allowed disabled:opacity-50`}
                                >
                                    <FiLock />
                                    Internal Note
                                </button>
                            </div>

                            {visibility === "STAFF" && (
                                <div className="mb-4 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
                                    This note is intended for staff only.
                                    Verify that your backend enforces this
                                    visibility restriction.
                                </div>
                            )}

                            <textarea
                                value={reply}
                                onChange={(event) => setReply(event.target.value)}
                                disabled={!canRespond || submitting}
                                rows={5}
                                maxLength={5000}
                                placeholder={
                                    visibility === "STAFF"
                                        ? "Write an internal note for other staff members..."
                                        : "Write your response to the student..."
                                }
                                className="w-full resize-y rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm leading-6 text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-500/10 disabled:cursor-not-allowed disabled:opacity-60"
                            />

                            <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                                <span className="text-xs text-slate-400">
                                    {reply.length}/5000 characters
                                </span>

                                <button
                                    onClick={() => void addResponse()}
                                    disabled={
                                        !canRespond ||
                                        !reply.trim() ||
                                        submitting
                                    }
                                    className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                                >
                                    {submitting ? (
                                        <FiLoader className="animate-spin" />
                                    ) : (
                                        <FiSend />
                                    )}
                                    {visibility === "STAFF"
                                        ? "Add Internal Note"
                                        : "Send Reply"}
                                </button>
                            </div>

                            {!canRespond && (
                                <p className="mt-3 text-sm text-slate-500">
                                    This ticket is in a terminal state.
                                    Responses are disabled.
                                </p>
                            )}
                        </section>

                        {/* Conversation history */}
                        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
                            <h2 className="mb-5 flex items-center gap-2 font-semibold text-slate-900">
                                <FiMessageSquare className="text-blue-600" />
                                Replies & Notes
                            </h2>

                            {responses.length === 0 ? (
                                <EmptyState message="No replies are available yet." />
                            ) : (
                                <div className="space-y-4">
                                    {responses.map((item) => (
                                        <div
                                            key={item._id}
                                            className={`rounded-xl border p-4 ${item.visibility === "STAFF"
                                                ? "border-amber-200 bg-amber-50/60"
                                                : "border-slate-200 bg-slate-50"
                                                }`}
                                        >
                                            <div className="flex flex-wrap items-start justify-between gap-3">
                                                <div className="flex items-center gap-2">
                                                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-white text-slate-600 ring-1 ring-slate-200">
                                                        <FiUser />
                                                    </div>

                                                    <div>
                                                        <p className="text-sm font-semibold text-slate-900">
                                                            {item.senderName ??
                                                                (item.actorType ===
                                                                    "STUDENT"
                                                                    ? studentName
                                                                    : "Staff")}
                                                        </p>
                                                        <p className="text-xs text-slate-500">
                                                            {formatDate(
                                                                item.createdAt
                                                            )}
                                                        </p>
                                                    </div>
                                                </div>

                                                <span
                                                    className={`rounded-full px-2.5 py-1 text-xs font-semibold ${item.visibility ===
                                                        "STAFF"
                                                        ? "bg-amber-100 text-amber-800"
                                                        : "bg-blue-100 text-blue-700"
                                                        }`}
                                                >
                                                    {item.visibility === "STAFF"
                                                        ? "Internal note"
                                                        : "Student visible"}
                                                </span>
                                            </div>

                                            <p className="mt-4 whitespace-pre-wrap wrap-break-word text-sm leading-6 text-slate-700">
                                                {item.message}
                                            </p>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </section>

                        {/* Activity timeline */}
                        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
                            <h2 className="mb-6 flex items-center gap-2 font-semibold text-slate-900">
                                <FiActivity className="text-blue-600" />
                                Activity History
                            </h2>

                            {visibleActivities.length === 0 ? (
                                <EmptyState message="No activity history was returned by the server." />
                            ) : (
                                <div className="relative space-y-6 before:absolute before:bottom-2 before:left-3.75 before:top-2 before:w-px before:bg-slate-200">
                                    {visibleActivities.map((activity) => (
                                        <div
                                            key={activity._id}
                                            className="relative flex gap-4"
                                        >
                                            <div className="relative z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-slate-200 bg-white text-blue-600">
                                                {activity.activityType.includes(
                                                    "STATUS"
                                                ) ? (
                                                    <FiRefreshCw />
                                                ) : activity.activityType.includes(
                                                    "ASSIGN"
                                                ) ? (
                                                    <FiUserCheck />
                                                ) : activity.activityType.includes(
                                                    "CLOSE"
                                                ) ? (
                                                    <FiCheckCircle />
                                                ) : (
                                                    <FiActivity />
                                                )}
                                            </div>

                                            <div className="min-w-0 flex-1 pb-1">
                                                <div className="flex flex-wrap items-center justify-between gap-2">
                                                    <p className="text-sm font-semibold text-slate-900">
                                                        {formatStatus(
                                                            activity.activityType
                                                        )}
                                                    </p>

                                                    <time className="text-xs text-slate-400">
                                                        {formatDate(
                                                            activity.createdAt
                                                        )}
                                                    </time>
                                                </div>

                                                {activity.message && (
                                                    <p className="mt-1 whitespace-pre-wrap wrap-break-word text-sm leading-6 text-slate-600">
                                                        {activity.message}
                                                    </p>
                                                )}

                                                {activity.previousStatus &&
                                                    activity.newStatus && (
                                                        <p className="mt-2 text-xs text-slate-500">
                                                            {formatStatus(
                                                                activity.previousStatus
                                                            )}{" "}
                                                            <span aria-hidden="true">
                                                                →
                                                            </span>{" "}
                                                            {formatStatus(
                                                                activity.newStatus
                                                            )}
                                                        </p>
                                                    )}

                                                <p className="mt-1 text-xs text-slate-400">
                                                    {activity.actorName ??
                                                        activity.actorType}
                                                </p>

                                                {activity.visibility ===
                                                    "STAFF" && (
                                                        <span className="mt-2 inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-1 text-xs text-amber-700">
                                                            <FiLock />
                                                            Staff only
                                                        </span>
                                                    )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </section>
                    </div>

                    {/* Right sidebar */}
                    <aside className="space-y-6">
                        {/* Student details */}
                        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                            <h2 className="mb-5 flex items-center gap-2 font-semibold text-slate-900">
                                <FiUser className="text-blue-600" />
                                Student Information
                            </h2>

                            <div className="mb-5 flex items-center gap-3">
                                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-blue-50 text-lg font-bold text-blue-700">
                                    {studentName.charAt(0).toUpperCase()}
                                </div>

                                <div className="min-w-0">
                                    <p className="truncate font-semibold text-slate-900">
                                        {studentName}
                                    </p>
                                    <p className="text-xs text-slate-500">
                                        Student
                                    </p>
                                </div>
                            </div>

                            <DetailRow
                                label="Enrollment No."
                                value={student?.enrollmentNumber}
                            />

                            <DetailRow
                                label="Email"
                                value={student?.email}
                            />

                            <DetailRow
                                label="Contact"
                                value={student?.contactNo}
                            />

                            <DetailRow
                                label="Department"
                                value={student?.department}
                            />

                            <DetailRow
                                label="Year"
                                value={
                                    student?.year !== undefined
                                        ? String(student.year)
                                        : undefined
                                }
                            />

                            <DetailRow
                                label="Institution"
                                value={student?.institution}
                            />
                        </section>

                        {/* Status management */}
                        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                            <h2 className="mb-4 font-semibold text-slate-900">
                                Manage Ticket
                            </h2>

                            <label
                                htmlFor="ticket-status"
                                className="mb-2 block text-sm font-medium text-slate-700"
                            >
                                Change status
                            </label>

                            <select
                                id="ticket-status"
                                value={nextStatus}
                                onChange={(event) =>
                                    setNextStatus(
                                        event.target.value as
                                        | TicketStatus
                                        | ""
                                    )
                                }
                                disabled={
                                    submitting ||
                                    allowedTransitions.length === 0
                                }
                                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 disabled:bg-slate-100"
                            >
                                <option value="">
                                    Select next status
                                </option>

                                {allowedTransitions.map((status) => (
                                    <option key={status} value={status}>
                                        {formatStatus(status)}
                                    </option>
                                ))}
                            </select>

                            {nextStatus === "REJECTED" && (
                                <textarea
                                    value={statusReason}
                                    onChange={(event) =>
                                        setStatusReason(event.target.value)
                                    }
                                    rows={3}
                                    placeholder="Explain why this ticket is being rejected..."
                                    className="mt-3 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
                                />
                            )}

                            <button
                                onClick={() => void updateStatus()}
                                disabled={
                                    !nextStatus ||
                                    submitting ||
                                    (nextStatus === "REJECTED" &&
                                        !statusReason.trim())
                                }
                                className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                                {submitting ? (
                                    <FiLoader className="animate-spin" />
                                ) : (
                                    <FiRefreshCw />
                                )}
                                Update Status
                            </button>

                            <div className="my-5 border-t border-slate-100" />

                            <label
                                htmlFor="resolution"
                                className="mb-2 block text-sm font-medium text-slate-700"
                            >
                                Resolution details
                            </label>

                            <textarea
                                id="resolution"
                                value={statusReason}
                                onChange={(event) =>
                                    setStatusReason(event.target.value)
                                }
                                rows={4}
                                disabled={
                                    submitting ||
                                    ticket.status !== "IN_PROGRESS"
                                }
                                placeholder="Document the solution provided..."
                                className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 disabled:bg-slate-100"
                            />

                            <button
                                onClick={() => void resolveTicket()}
                                disabled={
                                    submitting ||
                                    ticket.status !== "IN_PROGRESS"
                                }
                                className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                                <FiCheck />
                                Mark as Resolved
                            </button>

                            <button
                                onClick={() => void closeTicket()}
                                disabled={
                                    submitting ||
                                    ticket.status !== "RESOLVED"
                                }
                                className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                                <FiCheckCircle />
                                Close Ticket
                            </button>

                            {ticket.status === "RESOLVED" && (
                                <p className="mt-3 text-xs leading-5 text-slate-500">
                                    Review the resolution before finalizing
                                    the ticket closure.
                                </p>
                            )}

                            {isTerminal && (
                                <p className="mt-3 text-xs leading-5 text-slate-500">
                                    This ticket is in a terminal state.
                                    Further changes require an authorized
                                    reopening workflow.
                                </p>
                            )}
                        </section>

                        {/* Ticket metadata */}
                        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                            <h2 className="mb-4 font-semibold text-slate-900">
                                Ticket Information
                            </h2>

                            <DetailRow
                                label="Ticket ID"
                                value={ticket.ticketId}
                            />

                            <DetailRow
                                label="Category"
                                value={ticket.category}
                            />

                            <DetailRow
                                label="Created"
                                value={formatDate(ticket.createdAt)}
                            />

                            <DetailRow
                                label="Last Updated"
                                value={formatDate(ticket.updatedAt)}
                            />

                            <DetailRow
                                label="Priority"
                                value={ticket.priority}
                            />

                            <DetailRow
                                label="Status"
                                value={formatStatus(ticket.status)}
                            />
                        </section>
                    </aside>
                </div>
            </div>
        </main>
    );
}

function SummaryCard({
    label,
    value,
    icon,
    children,
}: {
    label: string;
    value: string;
    icon: React.ReactNode;
    children?: React.ReactNode;
}) {
    return (
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                    <p className="text-sm text-slate-500">{label}</p>
                    <p className="mt-2 wrap-break-word text-lg font-bold text-slate-900">
                        {value}
                    </p>
                </div>

                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-lg text-blue-600">
                    {icon}
                </div>
            </div>

            {children}
        </div>
    );
}

function DetailRow({
    label,
    value,
}: {
    label: string;
    value?: string;
}) {
    return (
        <div className="flex flex-col gap-1 border-b border-slate-100 py-3 last:border-0">
            <span className="text-xs font-medium text-slate-500">
                {label}
            </span>
            <span className="wrap-break-word text-sm font-medium text-slate-800">
                {value || "Not provided"}
            </span>
        </div>
    );
}

function EmptyState({ message }: { message: string }) {
    return (
        <div className="rounded-xl border border-dashed border-slate-200 px-4 py-8 text-center">
            <FiMessageSquare className="mx-auto mb-3 text-2xl text-slate-300" />
            <p className="text-sm text-slate-500">{message}</p>
        </div>
    );
}