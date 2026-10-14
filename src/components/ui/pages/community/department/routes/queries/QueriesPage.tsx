"use client";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
    FiAlertCircle,
    FiArrowUpRight,
    FiCalendar,
    FiChevronLeft,
    FiChevronRight,
    FiClock,
    FiFilter,
    FiInbox,
    FiRefreshCw,
    FiSearch,
    FiUserCheck,
    FiUsers,
} from "react-icons/fi";
import axios from "axios";
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

interface DepartmentTicket {
    _id: string;
    ticketId: string;
    subject: string;
    description?: string;
    category: string;
    priority: TicketPriority;
    status: TicketStatus;
    createdAt: string;
    updatedAt?: string;
    student?: {
        name?: string;
        enrollmentNumber?: string;
    };
    assignedTo?: {
        _id: string;
        name: string;
        email?: string;
    } | null;
}

interface DepartmentStaff {
    _id: string;
    name: string;
    email?: string;
    isActive?: boolean;
}

const STATUS_OPTIONS: {
    label: string;
    value: TicketStatus | "ALL";
}[] = [
        { label: "All statuses", value: "ALL" },
        { label: "Submitted", value: "SUBMITTED" },
        { label: "Under review", value: "UNDER_REVIEW" },
        { label: "In progress", value: "IN_PROGRESS" },
        { label: "Waiting for student", value: "WAITING_FOR_STUDENT" },
        { label: "Resolved", value: "RESOLVED" },
        { label: "Closed", value: "CLOSED" },
        { label: "Rejected", value: "REJECTED" },
    ];

const PRIORITY_OPTIONS: {
    label: string;
    value: TicketPriority | "ALL";
}[] = [
        { label: "All priorities", value: "ALL" },
        { label: "High", value: "HIGH" },
        { label: "Medium", value: "MEDIUM" },
        { label: "Low", value: "LOW" },
    ];

const STATUS_STYLES: Record<TicketStatus, string> = {
    SUBMITTED: "bg-blue-50 text-blue-700 ring-blue-600/20",
    UNDER_REVIEW: "bg-violet-50 text-violet-700 ring-violet-600/20",
    IN_PROGRESS: "bg-amber-50 text-amber-700 ring-amber-600/20",
    WAITING_FOR_STUDENT: "bg-orange-50 text-orange-700 ring-orange-600/20",
    RESOLVED: "bg-emerald-50 text-emerald-700 ring-emerald-600/20",
    CLOSED: "bg-gray-100 text-gray-600 ring-gray-500/20",
    REJECTED: "bg-red-50 text-red-700 ring-red-600/20",
};

const PRIORITY_STYLES: Record<TicketPriority, string> = {
    HIGH: "text-red-600",
    MEDIUM: "text-amber-600",
    LOW: "text-emerald-600",
};

function formatLabel(value: string) {
    return value
        .toLowerCase()
        .split("_")
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(" ");
}

function formatDate(value: string) {
    const date = new Date(value);

    if (Number.isNaN(date.getTime())) return "—";

    return new Intl.DateTimeFormat("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
    }).format(date);
}

function getInitials(name?: string) {
    if (!name) return "ST";

    return name
        .trim()
        .split(/\s+/)
        .slice(0, 2)
        .map((part) => part[0])
        .join("")
        .toUpperCase();
}

export default function DepartmentQueriesPage({ ticketsData, staffData }: { ticketsData: DepartmentTicket[]; staffData: DepartmentStaff[] }) {
    const router = useRouter();

    const [tickets, setTickets] = useState<DepartmentTicket[]>(ticketsData);
    const [staff, setStaff] = useState<DepartmentStaff[]>(staffData);
    const [search, setSearch] = useState("");
    const [status, setStatus] = useState<TicketStatus | "ALL">("ALL");
    const [priority, setPriority] = useState<TicketPriority | "ALL">("ALL");
    const [assignmentFilter, setAssignmentFilter] = useState<
        "ALL" | "ASSIGNED" | "UNASSIGNED"
    >("ALL");
    const [page, setPage] = useState(1);
    const [loading, setLoading] = useState(false);
    const [refreshing, setRefreshing] = useState(false);
    const [error, setError] = useState("");
    const [assigningTicketId, setAssigningTicketId] = useState<string | null>(
        null
    );
    const [selectedStaff, setSelectedStaff] = useState<
        Record<string, string>
    >({});

    const pageSize = 8;


    const fetchDepartmentData = useCallback(async (isRefresh = false) => {
        if (isRefresh) {
            setRefreshing(true);
        } else {
            setLoading(true);
        }

        try {
            const [ticketsResponse, staffResponse] = await Promise.all([
                axios.get("/api/v1/helpdesk/department/tickets"),
                axios.get("/api/v1/helpdesk/department/staff"),
            ]);

            const ticketRows =
                ticketsResponse.data?.payload?.tickets ??
                ticketsResponse.data?.tickets;

            const staffRows =
                staffResponse.data?.payload?.staff ??
                staffResponse.data?.staff;

            if (!Array.isArray(ticketRows) || !Array.isArray(staffRows)) {
                throw new Error("Unexpected response received from the server.");
            }

            setTickets(ticketRows);
            setStaff(
                staffRows.filter(
                    (member: DepartmentStaff) => member.isActive !== false
                )
            );
        } catch (err: unknown) {
            if (axios.isAxiosError(err)) {
                toast.error(
                    err.response?.data?.message ??
                    err.message ??
                    "Unable to load department data."
                );
            } else {
                toast.error(
                    err instanceof Error
                        ? err.message
                        : "Something went wrong while loading department data."
                );
            }
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, []);

    const filteredTickets = useMemo(() => {
        const query = search.trim().toLowerCase();

        return tickets.filter((ticket) => {
            const matchesSearch =
                !query ||
                ticket.ticketId?.toLowerCase().includes(query) ||
                ticket.subject?.toLowerCase().includes(query) ||
                ticket.category?.toLowerCase().includes(query) ||
                ticket.student?.name?.toLowerCase().includes(query) ||
                ticket.student?.enrollmentNumber?.toLowerCase().includes(query) ||
                ticket.assignedTo?.name?.toLowerCase().includes(query);

            const matchesStatus =
                status === "ALL" || ticket.status === status;

            const matchesPriority =
                priority === "ALL" || ticket.priority === priority;

            const matchesAssignment =
                assignmentFilter === "ALL" ||
                (assignmentFilter === "ASSIGNED" && Boolean(ticket.assignedTo)) ||
                (assignmentFilter === "UNASSIGNED" && !ticket.assignedTo);

            return (
                matchesSearch &&
                matchesStatus &&
                matchesPriority &&
                matchesAssignment
            );
        });
    }, [tickets, search, status, priority, assignmentFilter]);

    const activeTickets = tickets.filter((ticket) =>
        [
            "SUBMITTED",
            "UNDER_REVIEW",
            "IN_PROGRESS",
            "WAITING_FOR_STUDENT",
        ].includes(ticket.status)
    ).length;

    const unassignedTickets = tickets.filter(
        (ticket) =>
            !ticket.assignedTo &&
            !["RESOLVED", "CLOSED", "REJECTED"].includes(ticket.status)
    ).length;

    const highPriorityTickets = tickets.filter(
        (ticket) =>
            ticket.priority === "HIGH" &&
            !["RESOLVED", "CLOSED", "REJECTED"].includes(ticket.status)
    ).length;

    const resolvedTickets = tickets.filter((ticket) =>
        ["RESOLVED", "CLOSED"].includes(ticket.status)
    ).length;

    const totalPages = Math.max(
        1,
        Math.ceil(filteredTickets.length / pageSize)
    );

    const visibleTickets = filteredTickets.slice(
        (page - 1) * pageSize,
        page * pageSize
    );

    function resetPage() {
        setPage(1);
    }


    async function assignTicket(ticket: DepartmentTicket) {
        const staffId = selectedStaff[ticket.ticketId];

        if (!staffId) {
            toast.error("Select a staff member before assigning the query.");
            return;
        }

        setAssigningTicketId(ticket.ticketId);

        try {
            await axios.post(
                `/api/v1/helpdesk/department/tickets/assignment?ticketId=${encodeURIComponent(ticket.ticketId)}`,
                JSON.stringify({ assignedTo: staffId }),
                {
                    withCredentials: true,
                    headers: { Accept: "application/json" },
                }
            );

            toast.success(
                `${ticket.ticketId} was assigned successfully.`
            );

            await fetchDepartmentData(true);
        } catch (err: unknown) {
            if (axios.isAxiosError(err)) {
                toast.error(
                    err.response?.data?.message ??
                    "Unable to assign this query."
                );
            } else {
                toast.error(
                    err instanceof Error
                        ? err.message
                        : "Assignment failed. Please try again."
                );
            }
        } finally {
            setAssigningTicketId(null);
        }
    }


    function openTicket(ticket: DepartmentTicket) {
        router.push(
            `/department/queries/${encodeURIComponent(ticket.ticketId)}`
        );
    }

    function clearFilters() {
        setSearch("");
        setStatus("ALL");
        setPriority("ALL");
        setAssignmentFilter("ALL");
        setPage(1);
    }

    return (
        <main className="min-h-screen px-4 py-6 text-text-primary sm:px-6 lg:px-8 lg:py-8">
            <div className="mx-auto w-full space-y-7">
                {/* Heading */}
                <section className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
                    <div>
                        <div className="mb-2 flex items-center gap-2 text-sm text-text-secondary">
                            <span>Helpdesk</span>
                            <span>/</span>
                            <span className="text-primary">Department queries</span>
                        </div>

                        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
                            Department Queries
                        </h1>

                        <p className="mt-2 max-w-2xl text-sm leading-6 text-text-secondary sm:text-base">
                            Review your department&apos;s tickets, distribute
                            workload, and monitor resolution progress.
                        </p>
                    </div>

                    <button
                        type="button"
                        onClick={() => void fetchDepartmentData(true)}
                        disabled={loading || refreshing}
                        className="inline-flex min-h-11 items-center justify-center gap-2 self-start rounded-xl border border-border bg-surface px-4 py-2.5 text-sm font-semibold transition hover:bg-background/30 disabled:cursor-not-allowed disabled:opacity-60 sm:self-auto"
                    >
                        <FiRefreshCw
                            className={refreshing ? "animate-spin" : ""}
                        />
                        Refresh
                    </button>
                </section>

                {/* Metrics */}
                <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
                    <SummaryCard
                        title="Total queries"
                        value={tickets.length}
                        description="Tickets in your department"
                        icon={<FiInbox />}
                        iconStyle="bg-blue-50 text-blue-600"
                    />

                    <SummaryCard
                        title="Active queries"
                        value={activeTickets}
                        description="Currently being handled"
                        icon={<FiClock />}
                        iconStyle="bg-amber-50 text-amber-600"
                    />

                    <SummaryCard
                        title="Unassigned"
                        value={unassignedTickets}
                        description="Require staff assignment"
                        icon={<FiUsers />}
                        iconStyle="bg-violet-50 text-violet-600"
                    />

                    <SummaryCard
                        title="High priority"
                        value={highPriorityTickets}
                        description={`${resolvedTickets} resolved or closed`}
                        icon={<FiAlertCircle />}
                        iconStyle="bg-red-50 text-red-600"
                    />
                </section>

                {/* Queries */}
                <section className="overflow-hidden rounded-2xl border border-border bg-surface shadow-sm">
                    <div className="border-b border-border p-5 sm:p-6">
                        <div className="flex flex-col gap-4">
                            <div>
                                <h2 className="text-lg font-semibold">
                                    Department ticket queue
                                </h2>
                                <p className="mt-1 text-sm text-text-secondary">
                                    Review, prioritize, and assign incoming queries.
                                </p>
                            </div>

                            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
                                <div className="relative sm:col-span-2 xl:col-span-1">
                                    <FiSearch className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary" />
                                    <input
                                        type="search"
                                        value={search}
                                        onChange={(event) => {
                                            setSearch(event.target.value);
                                            resetPage();
                                        }}
                                        placeholder="Search ticket or student..."
                                        aria-label="Search department queries"
                                        className="h-11 w-full rounded-xl border border-border bg-background/30 pl-10 pr-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/10"
                                    />
                                </div>

                                <FilterSelect
                                    label="Status"
                                    value={status}
                                    onChange={(value) => {
                                        setStatus(value as TicketStatus | "ALL");
                                        resetPage();
                                    }}
                                    options={STATUS_OPTIONS}
                                />

                                <FilterSelect
                                    label="Priority"
                                    value={priority}
                                    onChange={(value) => {
                                        setPriority(value as TicketPriority | "ALL");
                                        resetPage();
                                    }}
                                    options={PRIORITY_OPTIONS}
                                />

                                <div className="relative">
                                    <FiFilter className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary" />
                                    <select
                                        value={assignmentFilter}
                                        onChange={(event) => {
                                            setAssignmentFilter(
                                                event.target.value as typeof assignmentFilter
                                            );
                                            resetPage();
                                        }}
                                        aria-label="Filter by assignment"
                                        className="h-11 w-full appearance-none rounded-xl border border-border bg-background/30 pl-9 pr-3 text-sm outline-none focus:border-primary"
                                    >
                                        <option value="ALL">All assignments</option>
                                        <option value="ASSIGNED">Assigned</option>
                                        <option value="UNASSIGNED">Unassigned</option>
                                    </select>
                                </div>
                            </div>

                            <div className="text-sm text-text-secondary">
                                {filteredTickets.length} matching quer
                                {filteredTickets.length === 1 ? "y" : "ies"}
                            </div>
                        </div>
                    </div>

                    {error && (
                        <div
                            role="alert"
                            className="m-5 flex flex-col gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 sm:flex-row sm:items-center sm:justify-between"
                        >
                            <p>{error}</p>
                            <button
                                type="button"
                                onClick={() => void fetchDepartmentData()}
                                className="self-start font-semibold underline underline-offset-4"
                            >
                                Try again
                            </button>
                        </div>
                    )}

                    {/* Desktop table */}
                    <div className="hidden overflow-x-auto md:block">
                        <table className="w-full text-left">
                            <thead className="bg-background/30 text-xs uppercase tracking-wider text-text-secondary">
                                <tr>
                                    <th className="px-6 py-4 font-semibold">Query</th>
                                    <th className="px-4 py-4 font-semibold">Student</th>
                                    <th className="px-4 py-4 font-semibold">Priority</th>
                                    <th className="px-4 py-4 font-semibold">Status</th>
                                    <th className="px-4 py-4 font-semibold">Submitted</th>
                                    <th className="px-4 py-4 font-semibold">Assigned staff</th>
                                    {/* <th className="px-6 py-4 text-right font-semibold">Action</th> */}
                                </tr>
                            </thead>

                            <tbody className="divide-y divide-border">
                                {!loading &&
                                    !error &&
                                    visibleTickets.map((ticket) => (
                                        <tr
                                            key={ticket._id}
                                            className="transition hover:bg-background/30/70"
                                        >
                                            <td className="max-w-xs px-6 py-5">
                                                <p className="font-semibold">{ticket.subject}</p>
                                                <p className="mt-1 text-xs font-medium text-primary">
                                                    {ticket.ticketId}
                                                </p>
                                                <p className="mt-2 text-xs text-text-secondary">
                                                    {formatLabel(ticket.category)}
                                                </p>
                                            </td>

                                            <td className="px-4 py-5">
                                                <div className="flex items-center gap-3">
                                                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                                                        {getInitials(ticket.student?.name)}
                                                    </div>
                                                    <div className="min-w-0">
                                                        <p className="max-w-36 truncate text-sm font-medium">
                                                            {ticket.student?.name || "Student"}
                                                        </p>
                                                        <p className="mt-1 text-xs text-text-secondary">
                                                            {ticket.student?.enrollmentNumber || "—"}
                                                        </p>
                                                    </div>
                                                </div>
                                            </td>

                                            <td className="px-4 py-5">
                                                <span className={`whitespace-nowrap text-sm font-semibold ${PRIORITY_STYLES[ticket.priority]}`}>
                                                    ● {formatLabel(ticket.priority)}
                                                </span>
                                            </td>

                                            <td className="px-4 py-5">
                                                <StatusBadge status={ticket.status} />
                                            </td>

                                            <td className="whitespace-nowrap px-4 py-5 text-sm text-text-secondary">
                                                <span className="inline-flex items-center gap-2">
                                                    <FiCalendar />
                                                    {formatDate(ticket.createdAt)}
                                                </span>
                                            </td>

                                            <td className="min-w-56 px-4 py-5">
                                                <div className="flex flex-col gap-2">
                                                    <p className="text-sm">
                                                        {ticket.assignedTo?.name || "Unassigned"}
                                                    </p>
                                                    <div className="flex gap-2">
                                                        <select
                                                            value={
                                                                selectedStaff[ticket.ticketId] ??
                                                                ticket.assignedTo?._id ??
                                                                ""
                                                            }
                                                            onChange={(event) =>
                                                                setSelectedStaff((current) => ({
                                                                    ...current,
                                                                    [ticket.ticketId]: event.target.value,
                                                                }))
                                                            }
                                                            aria-label={`Assign ${ticket.ticketId} to staff`}
                                                            className="h-9 min-w-0 flex-1 rounded-lg border border-border bg-background/30 px-2 text-xs outline-none focus:border-primary"
                                                        >
                                                            <option value="">Select staff</option>
                                                            {staff.map((member) => (
                                                                <option key={member._id} value={member._id}>
                                                                    {member.name}
                                                                </option>
                                                            ))}
                                                        </select>

                                                        <button
                                                            type="button"
                                                            disabled={
                                                                !selectedStaff[ticket.ticketId] ||
                                                                selectedStaff[ticket.ticketId] === ticket.assignedTo?._id ||
                                                                assigningTicketId === ticket.ticketId
                                                            }
                                                            onClick={() => void assignTicket(ticket)}
                                                            className="inline-flex h-9 items-center justify-center gap-1 rounded-lg bg-primary px-2.5 text-xs font-semibold text-white transition hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-40"
                                                        >
                                                            {assigningTicketId === ticket.ticketId
                                                                ? "Saving"
                                                                : "Assign"}
                                                        </button>
                                                    </div>
                                                </div>
                                            </td>

                                            {/* <td className="px-6 py-5 text-right">
                                                <button
                                                    type="button"
                                                    onClick={() => openTicket(ticket)}
                                                    className="inline-flex items-center gap-2 rounded-lg border border-border px-3 py-2 text-sm font-semibold transition hover:border-primary hover:text-primary"
                                                >
                                                    View
                                                    <FiArrowUpRight />
                                                </button>
                                            </td> */}
                                        </tr>
                                    ))}
                            </tbody>
                        </table>
                    </div>

                    {/* Mobile ticket cards */}
                    <div className="space-y-4 p-4 md:hidden">
                        {!loading &&
                            !error &&
                            visibleTickets.map((ticket) => (
                                <article
                                    key={ticket._id}
                                    className="rounded-xl border border-border p-4"
                                >
                                    <div className="flex items-start justify-between gap-3">
                                        <div className="min-w-0">
                                            <h3 className="wrap-break-word font-semibold">{ticket.subject}</h3>
                                            <p className="mt-1 text-xs font-medium text-primary">
                                                {ticket.ticketId}
                                            </p>
                                        </div>

                                        <span className={`shrink-0 text-xs font-semibold ${PRIORITY_STYLES[ticket.priority]}`}>
                                            {formatLabel(ticket.priority)}
                                        </span>
                                    </div>

                                    <div className="mt-3 flex flex-wrap gap-2">
                                        <StatusBadge status={ticket.status} />
                                        <span className="rounded-full bg-background/30 px-2.5 py-1 text-xs text-text-secondary">
                                            {formatLabel(ticket.category)}
                                        </span>
                                    </div>

                                    <div className="mt-4 space-y-1 text-sm">
                                        <p>{ticket.student?.name || "Student"}</p>
                                        <p className="text-xs text-text-secondary">
                                            {ticket.student?.enrollmentNumber || "—"}
                                        </p>
                                        <p className="pt-1 text-xs text-text-secondary">
                                            Assigned to: {ticket.assignedTo?.name || "Nobody yet"}
                                        </p>
                                        <p className="text-xs text-text-secondary">
                                            Submitted {formatDate(ticket.createdAt)}
                                        </p>
                                    </div>

                                    <div className="mt-4 space-y-2 border-t border-border pt-4">
                                        <label
                                            htmlFor={`staff-${ticket.ticketId}`}
                                            className="text-xs font-semibold text-text-secondary"
                                        >
                                            Assign or reassign staff
                                        </label>

                                        <select
                                            id={`staff-${ticket.ticketId}`}
                                            value={
                                                selectedStaff[ticket.ticketId] ??
                                                ticket.assignedTo?._id ??
                                                ""
                                            }
                                            onChange={(event) =>
                                                setSelectedStaff((current) => ({
                                                    ...current,
                                                    [ticket.ticketId]: event.target.value,
                                                }))
                                            }
                                            className="h-11 w-full rounded-xl border border-border bg-background/30 px-3 text-sm outline-none focus:border-primary"
                                        >
                                            <option value="">Select staff</option>
                                            {staff.map((member) => (
                                                <option key={member._id} value={member._id}>
                                                    {member.name}
                                                </option>
                                            ))}
                                        </select>

                                        <button
                                            type="button"
                                            disabled={
                                                !selectedStaff[ticket.ticketId] ||
                                                selectedStaff[ticket.ticketId] === ticket.assignedTo?._id ||
                                                assigningTicketId === ticket.ticketId
                                            }
                                            onClick={() => void assignTicket(ticket)}
                                            className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-xl border border-border text-sm font-semibold transition hover:border-primary hover:text-primary disabled:cursor-not-allowed disabled:opacity-40"
                                        >
                                            <FiUserCheck />
                                            {assigningTicketId === ticket.ticketId
                                                ? "Saving assignment..."
                                                : "Save assignment"}
                                        </button>

                                        <button
                                            type="button"
                                            onClick={() => openTicket(ticket)}
                                            className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 text-sm font-semibold text-white transition hover:bg-primary/90"
                                        >
                                            View query details
                                            <FiArrowUpRight />
                                        </button>
                                    </div>
                                </article>
                            ))}
                    </div>

                    {/* Loading */}
                    {loading && (
                        <div className="space-y-4 p-5">
                            {Array.from({ length: 5 }).map((_, index) => (
                                <div
                                    key={index}
                                    className="h-16 animate-pulse rounded-xl bg-background/30"
                                />
                            ))}
                        </div>
                    )}

                    {/* Empty */}
                    {!loading && !error && filteredTickets.length === 0 && (
                        <div className="px-5 py-16 text-center">
                            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-background/30 text-text-secondary">
                                <FiInbox size={26} />
                            </div>

                            <h3 className="mt-4 font-semibold">
                                {tickets.length === 0
                                    ? "No department queries yet"
                                    : "No matching queries"}
                            </h3>

                            <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-text-secondary">
                                {tickets.length === 0
                                    ? "New tickets routed to your department will appear here."
                                    : "Try changing your search or filters."}
                            </p>

                            {(search ||
                                status !== "ALL" ||
                                priority !== "ALL" ||
                                assignmentFilter !== "ALL") && (
                                    <button
                                        type="button"
                                        onClick={clearFilters}
                                        className="mt-4 text-sm font-semibold text-primary hover:underline"
                                    >
                                        Clear filters
                                    </button>
                                )}
                        </div>
                    )}

                    {/* Pagination */}
                    {!loading && !error && filteredTickets.length > 0 && (
                        <div className="flex flex-col gap-3 border-t border-border px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
                            <p className="text-sm text-text-secondary">
                                Page {page} of {totalPages}
                            </p>

                            <div className="flex items-center gap-2">
                                <button
                                    type="button"
                                    onClick={() =>
                                        setPage((current) => Math.max(1, current - 1))
                                    }
                                    disabled={page === 1}
                                    className="inline-flex h-10 items-center gap-2 rounded-lg border border-border px-3 text-sm font-medium transition hover:bg-background/30 disabled:cursor-not-allowed disabled:opacity-40"
                                >
                                    <FiChevronLeft />
                                    Previous
                                </button>

                                <button
                                    type="button"
                                    onClick={() =>
                                        setPage((current) => Math.min(totalPages, current + 1))
                                    }
                                    disabled={page >= totalPages}
                                    className="inline-flex h-10 items-center gap-2 rounded-lg border border-border px-3 text-sm font-medium transition hover:bg-background/30 disabled:cursor-not-allowed disabled:opacity-40"
                                >
                                    Next
                                    <FiChevronRight />
                                </button>
                            </div>
                        </div>
                    )}
                </section>
            </div>
        </main>
    );
}

function SummaryCard({
    title,
    value,
    description,
    icon,
    iconStyle,
}: {
    title: string;
    value: number;
    description: string;
    icon: React.ReactNode;
    iconStyle: string;
}) {
    return (
        <div className="rounded-2xl border border-border bg-surface p-5 shadow-sm">
            <div className="flex items-start justify-between gap-3">
                <div>
                    <p className="text-sm font-medium text-text-secondary">{title}</p>
                    <p className="mt-3 text-3xl font-bold tracking-tight">{value}</p>
                </div>

                <div className={`flex h-11 w-11 items-center justify-center rounded-xl text-xl ${iconStyle}`}>
                    {icon}
                </div>
            </div>

            <p className="mt-3 text-xs text-text-secondary">{description}</p>
        </div>
    );
}

function StatusBadge({ status }: { status: TicketStatus }) {
    return (
        <span
            className={`inline-flex items-center whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-inset ${STATUS_STYLES[status]}`}
        >
            {formatLabel(status)}
        </span>
    );
}

function FilterSelect({
    label,
    value,
    onChange,
    options,
}: {
    label: string;
    value: string;
    onChange: (value: string) => void;
    options: { label: string; value: string }[];
}) {
    return (
        <select
            value={value}
            onChange={(event) => onChange(event.target.value)}
            aria-label={`Filter by ${label.toLowerCase()}`}
            className="h-11 w-full rounded-xl border border-border bg-background/30 px-3 text-sm outline-none focus:border-primary"
        >
            {options.map((option) => (
                <option key={option.value} value={option.value}>
                    {option.label}
                </option>
            ))}
        </select>
    );
}
