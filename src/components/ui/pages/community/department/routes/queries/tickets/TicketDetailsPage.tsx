"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import axios from "axios";
import {
    FiArrowLeft,
    FiActivity,
    FiAlertCircle,
    FiCheckCircle,
    FiClock,
    FiMessageSquare,
    FiRefreshCw,
    FiUser,
    FiUserCheck,
    FiUsers,
    FiLoader,
    FiLock,
    FiPaperclip,
    FiXCircle,
} from "react-icons/fi";

type TicketStatus =
    | "SUBMITTED"
    | "UNDER_REVIEW"
    | "IN_PROGRESS"
    | "WAITING_FOR_STUDENT"
    | "RESOLVED"
    | "CLOSED"
    | "REJECTED";

type TicketPriority = "LOW" | "MEDIUM" | "HIGH";
type Visibility = "STUDENT" | "STAFF";

interface Student {
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

interface StaffMember {
    _id: string;
    name: string;
    email?: string;
    isActive?: boolean;
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
    student?: Student | null;
    studentId?: Student | string | null;
    assignedTo?: StaffMember | null;
    attachments?: {
        name: string;
        url: string;
    }[];
}

interface Activity {
    _id: string;
    activityType: string;
    actorType: "STUDENT" | "STAFF" | "SYSTEM";
    actorName?: string;
    message?: string;
    previousStatus?: TicketStatus;
    newStatus?: TicketStatus;
    visibility: Visibility;
    createdAt: string;
}

interface TicketResponse {
    _id: string;
    message: string;
    visibility: Visibility;
    actorType: "STUDENT" | "STAFF";
    actorId?: string;
    senderName?: string;
    createdAt: string;
}

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

function formatStatus(status: string) {
    return status
        .replaceAll("_", " ")
        .toLowerCase()
        .replace(/\b\w/g, (char) => char.toUpperCase());
}

function formatDate(value?: string) {
    if (!value) return "—";

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) return "—";

    return new Intl.DateTimeFormat("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
    }).format(date);
}

function getStudentName(student?: Student | null) {
    if (!student) return "Student";
    if (student.name) return student.name;

    return (
        [student.firstName, student.lastName].filter(Boolean).join(" ") ||
        "Student"
    );
}

export default function TicketDetailsPage() {
    const params = useParams<{ ticketId: string }>();
    const router = useRouter();

    const ticketId = decodeURIComponent(params.ticketId);

    const [ticket, setTicket] = useState<Ticket | null>(null);
    const [staff, setStaff] = useState<StaffMember[]>([]);
    const [activities, setActivities] = useState<Activity[]>([]);
    const [responses, setResponses] = useState<TicketResponse[]>([]);

    const [selectedStaff, setSelectedStaff] = useState("");
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [assigning, setAssigning] = useState(false);

    const [error, setError] = useState("");
    const [notice, setNotice] = useState("");

    const encodedTicketId = encodeURIComponent(ticketId);

    const ticketUrl = useMemo(
        () => `/api/v1/helpdesk/department/tickets/${encodedTicketId}`,
        [encodedTicketId]
    );

    const assignmentUrl = `${ticketUrl}/assignment`;

    const fetchData = useCallback(
        async (refresh = false) => {
            try {
                if (refresh) setRefreshing(true);
                else setLoading(true);

                setError("");

                const [ticketResult, staffResult] = await Promise.all([
                    axios.get(ticketUrl),
                    axios.get("/api/v1/helpdesk/department/staff"),
                ]);

                const ticketData = ticketResult.data?.data;
                const fetchedTicket: Ticket | undefined =
                    ticketData?.ticket ?? ticketData;

                if (!fetchedTicket?._id) {
                    throw new Error("Ticket details were not returned.");
                }

                const staffData = staffResult.data?.data;
                const staffList: StaffMember[] = staffData?.staff ?? [];

                setTicket(fetchedTicket);
                setStaff(staffList);
                setActivities(ticketData?.activities ?? []);
                setResponses(ticketData?.responses ?? []);

                setSelectedStaff(fetchedTicket.assignedTo?._id ?? "");
            } catch (err) {
                console.error("Department ticket details error:", err);

                setError(
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
        [ticketUrl]
    );

    useEffect(() => {
        void fetchData();
    }, [fetchData]);

    const assignTicket = async () => {
        if (!ticket || !selectedStaff || assigning) return;

        if (selectedStaff === ticket.assignedTo?._id) {
            setNotice("This ticket is already assigned to that staff member.");
            setError("");
            return;
        }

        const targetStaff = staff.find(
            (member) => member._id === selectedStaff
        );

        if (!targetStaff) {
            setError("Select a valid staff member from your department.");
            return;
        }

        const action = ticket.assignedTo ? "reassign" : "assign";

        if (
            !window.confirm(
                `Are you sure you want to ${action} this ticket to ${targetStaff.name}?`
            )
        ) {
            return;
        }

        try {
            setAssigning(true);
            setError("");
            setNotice("");

            await axios.patch(assignmentUrl, {
                assignedTo: selectedStaff,
            });

            setNotice(
                `Ticket ${ticket.assignedTo ? "reassigned" : "assigned"} successfully.`
            );

            await fetchData(true);
        } catch (err) {
            setError(
                axios.isAxiosError(err)
                    ? err.response?.data?.message ??
                    "Unable to update ticket assignment."
                    : "Unable to update ticket assignment."
            );
        } finally {
            setAssigning(false);
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

    if (loading) {
        return (
            <main className="flex min-h-screen items-center justify-center bg-slate-50">
                <div className="flex items-center gap-3 text-sm text-slate-500">
                    <FiLoader className="animate-spin text-xl" />
                    Loading ticket details...
                </div>
            </main>
        );
    }

    if (!ticket) {
        return (
            <main className="min-h-screen bg-slate-50 px-4 py-12">
                <div className="mx-auto max-w-lg rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">
                    <FiAlertCircle className="mx-auto mb-4 text-4xl text-red-500" />

                    <h1 className="text-xl font-bold text-slate-900">
                        Unable to load ticket
                    </h1>

                    <p className="mt-2 text-sm text-slate-500">
                        {error || "The requested ticket could not be found."}
                    </p>

                    <div className="mt-6 flex justify-center gap-3">
                        <button
                            onClick={() => router.back()}
                            className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
                        >
                            Go back
                        </button>

                        <button
                            onClick={() => void fetchData()}
                            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
                        >
                            Try again
                        </button>
                    </div>
                </div>
            </main>
        );
    }

    const isTerminal =
        ticket.status === "CLOSED" || ticket.status === "REJECTED";

    return (
        <main className="min-h-screen bg-slate-50">
            <div className="mx-auto max-w-7xl space-y-6 px-4 py-6 sm:px-6 lg:px-8">
                {/* Header */}
                <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <button
                            onClick={() =>
                                router.push("/community/department/queries")
                            }
                            className="mb-4 inline-flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-blue-600"
                        >
                            <FiArrowLeft />
                            Back to Department Tickets
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
                            Review the student's issue and manage department
                            assignment.
                        </p>
                    </div>

                    <button
                        onClick={() => void fetchData(true)}
                        disabled={refreshing || assigning}
                        className="inline-flex items-center justify-center gap-2 self-start rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50 disabled:opacity-50 sm:self-auto"
                    >
                        <FiRefreshCw
                            className={refreshing ? "animate-spin" : ""}
                        />
                        Refresh
                    </button>
                </header>

                {/* Feedback */}
                {error && (
                    <Feedback
                        type="error"
                        message={error}
                        onDismiss={() => setError("")}
                    />
                )}

                {notice && (
                    <Feedback
                        type="success"
                        message={notice}
                        onDismiss={() => setNotice("")}
                    />
                )}

                {/* Summary */}
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
                    <SummaryCard
                        label="Ticket Status"
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
                        label="Assigned Staff"
                        value={ticket.assignedTo?.name ?? "Unassigned"}
                        icon={<FiUserCheck />}
                    >
                        <p className="mt-1 truncate text-xs text-slate-500">
                            {ticket.assignedTo?.email ?? "No assignee"}
                        </p>
                    </SummaryCard>
                </div>

                <div className="grid grid-cols-1 items-start gap-6 xl:grid-cols-3">
                    {/* Main content */}
                    <div className="space-y-6 xl:col-span-2">
                        {/* Ticket description */}
                        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                            <div className="border-b border-slate-100 p-5 sm:p-6">
                                <div className="flex flex-wrap items-center gap-2">
                                    <span className="rounded-md bg-blue-50 px-2.5 py-1 text-xs font-semibold text-blue-700">
                                        {ticket.category}
                                    </span>

                                    <span className="text-xs text-slate-400">
                                        Last updated {formatDate(ticket.updatedAt)}
                                    </span>
                                </div>

                                <h2 className="mt-4 text-xl font-bold text-slate-900 sm:text-2xl">
                                    {ticket.subject}
                                </h2>

                                <p className="mt-5 whitespace-pre-wrap break-words text-sm leading-7 text-slate-600">
                                    {ticket.description ||
                                        "No description was provided."}
                                </p>
                            </div>

                            {!!ticket.attachments?.length && (
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

                        {/* Conversation */}
                        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
                            <div className="mb-5 flex items-center gap-3">
                                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                                    <FiMessageSquare className="text-lg" />
                                </div>

                                <div>
                                    <h2 className="font-semibold text-slate-900">
                                        Conversation & Notes
                                    </h2>
                                    <p className="text-sm text-slate-500">
                                        Messages associated with this ticket.
                                    </p>
                                </div>
                            </div>

                            {responses.length === 0 ? (
                                <EmptyState message="No responses have been recorded." />
                            ) : (
                                <div className="space-y-4">
                                    {responses.map((response) => (
                                        <div
                                            key={response._id}
                                            className={`rounded-xl border p-4 ${response.visibility === "STAFF"
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
                                                            {response.senderName ??
                                                                (response.actorType ===
                                                                    "STUDENT"
                                                                    ? studentName
                                                                    : "Staff member")}
                                                        </p>

                                                        <p className="text-xs text-slate-500">
                                                            {formatDate(
                                                                response.createdAt
                                                            )}
                                                        </p>
                                                    </div>
                                                </div>

                                                <span
                                                    className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold ${response.visibility ===
                                                            "STAFF"
                                                            ? "bg-amber-100 text-amber-800"
                                                            : "bg-blue-100 text-blue-700"
                                                        }`}
                                                >
                                                    {response.visibility ===
                                                        "STAFF" ? (
                                                        <FiLock />
                                                    ) : (
                                                        <FiMessageSquare />
                                                    )}
                                                    {response.visibility ===
                                                        "STAFF"
                                                        ? "Internal note"
                                                        : "Student visible"}
                                                </span>
                                            </div>

                                            <p className="mt-4 whitespace-pre-wrap break-words text-sm leading-6 text-slate-700">
                                                {response.message}
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

                            {activities.length === 0 ? (
                                <EmptyState message="No activity history is available." />
                            ) : (
                                <div className="relative space-y-6 before:absolute before:bottom-2 before:left-[15px] before:top-2 before:w-px before:bg-slate-200">
                                    {activities.map((activity) => (
                                        <div
                                            key={activity._id}
                                            className="relative flex gap-4"
                                        >
                                            <div className="relative z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-slate-200 bg-white text-blue-600">
                                                {activity.activityType.includes(
                                                    "ASSIGN"
                                                ) ? (
                                                    <FiUserCheck />
                                                ) : activity.activityType.includes(
                                                    "STATUS"
                                                ) ? (
                                                    <FiRefreshCw />
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
                                                    <p className="mt-1 whitespace-pre-wrap break-words text-sm leading-6 text-slate-600">
                                                        {activity.message}
                                                    </p>
                                                )}

                                                {activity.previousStatus &&
                                                    activity.newStatus && (
                                                        <p className="mt-2 text-xs text-slate-500">
                                                            {formatStatus(
                                                                activity.previousStatus
                                                            )}{" "}
                                                            →{" "}
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

                    {/* Sidebar */}
                    <aside className="space-y-6">
                        {/* Assignment management */}
                        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                            <div className="mb-5 flex items-center gap-3">
                                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
                                    <FiUsers className="text-lg" />
                                </div>

                                <div>
                                    <h2 className="font-semibold text-slate-900">
                                        Staff Assignment
                                    </h2>
                                    <p className="text-sm text-slate-500">
                                        Manage ticket ownership.
                                    </p>
                                </div>
                            </div>

                            <div className="rounded-xl bg-slate-50 p-4">
                                <p className="text-xs font-medium text-slate-500">
                                    Currently assigned to
                                </p>

                                <p className="mt-1 font-semibold text-slate-900">
                                    {ticket.assignedTo?.name ?? "Unassigned"}
                                </p>

                                <p className="mt-1 break-all text-xs text-slate-500">
                                    {ticket.assignedTo?.email ??
                                        "This ticket has no assigned staff member."}
                                </p>
                            </div>

                            {isTerminal ? (
                                <p className="mt-4 text-sm leading-6 text-slate-500">
                                    This ticket is closed or rejected.
                                    Assignment changes are disabled here.
                                </p>
                            ) : (
                                <>
                                    <label
                                        htmlFor="staff-member"
                                        className="mb-2 mt-5 block text-sm font-medium text-slate-700"
                                    >
                                        Assign to staff member
                                    </label>

                                    <select
                                        id="staff-member"
                                        value={selectedStaff}
                                        onChange={(event) =>
                                            setSelectedStaff(event.target.value)
                                        }
                                        disabled={assigning || refreshing}
                                        className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 disabled:bg-slate-100"
                                    >
                                        <option value="">
                                            Select staff member
                                        </option>

                                        {staff
                                            .filter(
                                                (member) =>
                                                    member.isActive !== false
                                            )
                                            .map((member) => (
                                                <option
                                                    key={member._id}
                                                    value={member._id}
                                                >
                                                    {member.name}
                                                    {member.email
                                                        ? ` — ${member.email}`
                                                        : ""}
                                                </option>
                                            ))}
                                    </select>

                                    {staff.length === 0 && (
                                        <p className="mt-2 text-xs leading-5 text-amber-700">
                                            No staff members were returned for
                                            this department.
                                        </p>
                                    )}

                                    <button
                                        onClick={() =>
                                            void assignTicket()
                                        }
                                        disabled={
                                            !selectedStaff ||
                                            selectedStaff ===
                                            ticket.assignedTo?._id ||
                                            assigning ||
                                            refreshing
                                        }
                                        className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                                    >
                                        {assigning ? (
                                            <FiLoader className="animate-spin" />
                                        ) : (
                                            <FiUserCheck />
                                        )}
                                        {assigning
                                            ? "Updating assignment..."
                                            : ticket.assignedTo
                                                ? "Reassign Ticket"
                                                : "Assign Ticket"}
                                    </button>
                                </>
                            )}

                            <p className="mt-4 text-xs leading-5 text-slate-500">
                                Only active staff returned by your department
                                staff API are available for assignment.
                            </p>
                        </section>

                        {/* Student information */}
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
                                    <p className="break-words font-semibold text-slate-900">
                                        {studentName}
                                    </p>
                                    <p className="text-xs text-slate-500">
                                        Ticket requester
                                    </p>
                                </div>
                            </div>

                            <DetailRow
                                label="Enrollment Number"
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
                                label="Priority"
                                value={ticket.priority}
                            />

                            <DetailRow
                                label="Status"
                                value={formatStatus(ticket.status)}
                            />

                            <DetailRow
                                label="Created"
                                value={formatDate(ticket.createdAt)}
                            />

                            <DetailRow
                                label="Last Updated"
                                value={formatDate(ticket.updatedAt)}
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
                    <p className="mt-2 break-words text-lg font-bold text-slate-900">
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

            <span className="break-words text-sm font-medium text-slate-800">
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

function Feedback({
    type,
    message,
    onDismiss,
}: {
    type: "error" | "success";
    message: string;
    onDismiss: () => void;
}) {
    const isError = type === "error";

    return (
        <div
            role={isError ? "alert" : "status"}
            className={`flex items-start gap-3 rounded-xl border p-4 text-sm ${isError
                    ? "border-red-200 bg-red-50 text-red-700"
                    : "border-emerald-200 bg-emerald-50 text-emerald-700"
                }`}
        >
            {isError ? (
                <FiAlertCircle className="mt-0.5 shrink-0 text-lg" />
            ) : (
                <FiCheckCircle className="mt-0.5 shrink-0 text-lg" />
            )}

            <p className="flex-1">{message}</p>

            <button
                onClick={onDismiss}
                className="shrink-0"
                aria-label="Dismiss notification"
            >
                <FiXCircle />
            </button>
        </div>
    );
}