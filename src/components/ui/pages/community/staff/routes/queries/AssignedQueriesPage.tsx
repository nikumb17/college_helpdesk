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

interface AssignedTicket {
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
    department?: {
        name?: string;
    };
}

const STATUS_OPTIONS: { label: string; value: TicketStatus | "ALL" }[] = [
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

export default function AssignedQueriesPage({ ticketsData }: { ticketsData: AssignedTicket[] }) {
    const router = useRouter();

    const [tickets, setTickets] = useState<AssignedTicket[]>(ticketsData);
    const [search, setSearch] = useState("");
    const [status, setStatus] = useState<TicketStatus | "ALL">("ALL");
    const [priority, setPriority] = useState<TicketPriority | "ALL">("ALL");
    const [page, setPage] = useState(1);
    const [loading, setLoading] = useState(false);
    const [refreshing, setRefreshing] = useState(false);

    const pageSize = 8;

    const fetchTickets = useCallback(async (isRefresh = false) => {
        if (isRefresh) {
            setRefreshing(true);
        } else {
            setLoading(true);
        }

        try {
            const response = await axios(
                "/api/v1/helpdesk/staff/tickets",
            );

            const result = await response.data;

            // Supports either { tickets: [...] } or { data: { tickets: [...] } }.
            const rows = result?.data?.payload.tickets ?? result?.tickets;

            if (!Array.isArray(rows)) {
                throw new Error("Unexpected ticket response from the server.");
            }

            setTickets(rows);
        } catch (err) {
            toast.error(
                err instanceof Error
                    ? err.message
                    : "Something went wrong while loading queries."
            );
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
                ticket.student?.enrollmentNumber?.toLowerCase().includes(query);

            const matchesStatus =
                status === "ALL" || ticket.status === status;

            const matchesPriority =
                priority === "ALL" || ticket.priority === priority;

            return matchesSearch && matchesStatus && matchesPriority;
        });
    }, [tickets, search, status, priority]);

    const totalPages = Math.max(
        1,
        Math.ceil(filteredTickets.length / pageSize)
    );

    const visibleTickets = filteredTickets.slice(
        (page - 1) * pageSize,
        page * pageSize
    );

    const activeTickets = tickets.filter((ticket) =>
        ["SUBMITTED", "UNDER_REVIEW", "IN_PROGRESS", "WAITING_FOR_STUDENT"].includes(
            ticket.status
        )
    ).length;

    const highPriorityTickets = tickets.filter(
        (ticket) =>
            ticket.priority === "HIGH" &&
            !["RESOLVED", "CLOSED", "REJECTED"].includes(ticket.status)
    ).length;

    const resolvedTickets = tickets.filter((ticket) =>
        ["RESOLVED", "CLOSED"].includes(ticket.status)
    ).length;

    function updateSearch(value: string) {
        setSearch(value);
        setPage(1);
    }

    function updateStatus(value: string) {
        setStatus(value as TicketStatus | "ALL");
        setPage(1);
    }

    function updatePriority(value: string) {
        setPriority(value as TicketPriority | "ALL");
        setPage(1);
    }

    function openTicket(ticket: AssignedTicket) {
        router.push(
            `/community/staff/tickets/${encodeURIComponent(ticket.ticketId)}`
        );
    }

    return (
        <main className="min-h-screen px-4 py-6 text-text-primary sm:px-6 lg:px-8 lg:py-8">
            <div className="mx-auto w-full space-y-7">
                {/* Page heading */}
                <section className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
                    <div>
                        <div className="mb-2 flex items-center gap-2 text-sm text-text-secondary">
                            <span>Helpdesk</span>
                            <span>/</span>
                            <span className="text-primary">Assigned queries</span>
                        </div>

                        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
                            Assigned Queries
                        </h1>

                        <p className="mt-2 max-w-2xl text-sm leading-6 text-text-secondary sm:text-base">
                            Manage your assigned student queries, prioritize
                            pending work, and keep every request moving.
                        </p>
                    </div>

                    <button
                        type="button"
                        onClick={() => void fetchTickets(true)}
                        disabled={loading || refreshing}
                        className="inline-flex min-h-11 items-center justify-center gap-2 self-start rounded-xl border border-border bg-surface px-4 py-2.5 text-sm font-semibold transition hover:bg-background/30 disabled:cursor-not-allowed disabled:opacity-60 sm:self-auto"
                    >
                        <FiRefreshCw
                            className={refreshing ? "animate-spin" : ""}
                        />
                        Refresh
                    </button>
                </section>

                {/* Summary cards */}
                <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
                    <SummaryCard
                        title="Total assigned"
                        value={tickets.length}
                        description="Queries in your queue"
                        icon={<FiInbox />}
                        iconStyle="bg-blue-50 text-blue-600"
                    />

                    <SummaryCard
                        title="Active queries"
                        value={activeTickets}
                        description="Still requiring attention"
                        icon={<FiClock />}
                        iconStyle="bg-amber-50 text-amber-600"
                    />

                    <SummaryCard
                        title="High priority"
                        value={highPriorityTickets}
                        description="Active urgent requests"
                        icon={<FiAlertCircle />}
                        iconStyle="bg-red-50 text-red-600"
                    />

                    <SummaryCard
                        title="Resolved / closed"
                        value={resolvedTickets}
                        description="Completed requests"
                        icon={<FiInbox />}
                        iconStyle="bg-emerald-50 text-emerald-600"
                    />
                </section>

                {/* Ticket list */}
                <section className="overflow-hidden rounded-2xl border border-border bg-surface shadow-sm">
                    <div className="border-b border-border p-5 sm:p-6">
                        <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
                            <div>
                                <h2 className="text-lg font-semibold">
                                    Your ticket queue
                                </h2>
                                <p className="mt-1 text-sm text-text-secondary">
                                    Search and filter the queries assigned to you.
                                </p>
                            </div>

                            <div className="flex flex-col gap-3 sm:flex-row">
                                <div className="relative min-w-0 sm:w-64">
                                    <FiSearch className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary" />

                                    <input
                                        type="search"
                                        value={search}
                                        onChange={(event) =>
                                            updateSearch(event.target.value)
                                        }
                                        placeholder="Search tickets..."
                                        aria-label="Search tickets"
                                        className="h-11 w-full rounded-xl border border-border bg-background/30 pl-10 pr-3 text-sm outline-none transition placeholder:text-text-secondary focus:border-primary focus:ring-2 focus:ring-primary/10"
                                    />
                                </div>

                                <div className="relative">
                                    <FiFilter className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary" />

                                    <select
                                        value={status}
                                        onChange={(event) =>
                                            updateStatus(event.target.value)
                                        }
                                        aria-label="Filter by status"
                                        className="h-11 w-full appearance-none rounded-xl border border-border bg-background/30 pl-9 pr-8 text-sm outline-none focus:border-primary sm:w-48"
                                    >
                                        {STATUS_OPTIONS.map((option) => (
                                            <option
                                                key={option.value}
                                                value={option.value}
                                            >
                                                {option.label}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <select
                                    value={priority}
                                    onChange={(event) =>
                                        updatePriority(event.target.value)
                                    }
                                    aria-label="Filter by priority"
                                    className="h-11 rounded-xl border border-border bg-background/30 px-3 text-sm outline-none focus:border-primary sm:w-40"
                                >
                                    {PRIORITY_OPTIONS.map((option) => (
                                        <option
                                            key={option.value}
                                            value={option.value}
                                        >
                                            {option.label}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        <div className="mt-4 text-sm text-text-secondary">
                            Showing{" "}
                            <span className="font-semibold text-text-primary">
                                {filteredTickets.length === 0
                                    ? 0
                                    : (page - 1) * pageSize + 1}
                                –
                                {Math.min(page * pageSize, filteredTickets.length)}
                            </span>{" "}
                            of{" "}
                            <span className="font-semibold text-text-primary">
                                {filteredTickets.length}
                            </span>{" "}
                            queries
                        </div>
                    </div>

                    {/* Desktop table */}
                    <div className="hidden overflow-x-auto md:block">
                        <table className="w-full text-left">
                            <thead className="bg-background/30 text-xs uppercase tracking-wider text-text-secondary">
                                <tr>
                                    <th className="px-6 py-4 font-semibold">
                                        Query
                                    </th>
                                    <th className="px-4 py-4 font-semibold">
                                        Student
                                    </th>
                                    <th className="px-4 py-4 font-semibold">
                                        Priority
                                    </th>
                                    <th className="px-4 py-4 font-semibold">
                                        Status
                                    </th>
                                    <th className="px-4 py-4 font-semibold">
                                        Submitted
                                    </th>
                                    <th className="px-6 py-4 text-right font-semibold">
                                        Action
                                    </th>
                                </tr>
                            </thead>

                            <tbody className="divide-y divide-border">
                                {!loading &&
                                    visibleTickets.map((ticket) => (
                                        <tr
                                            key={ticket._id}
                                            className="transition hover:bg-background/30/70"
                                        >
                                            <td className="max-w-xs px-6 py-5">
                                                <p className="font-semibold">
                                                    {ticket.subject}
                                                </p>
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
                                                        {getInitials(
                                                            ticket.student?.name
                                                        )}
                                                    </div>
                                                    <div className="min-w-0">
                                                        <p className="max-w-40 truncate text-sm font-medium">
                                                            {ticket.student?.name ||
                                                                "Student"}
                                                        </p>
                                                        <p className="mt-1 text-xs text-text-secondary">
                                                            {ticket.student
                                                                ?.enrollmentNumber ||
                                                                "—"}
                                                        </p>
                                                    </div>
                                                </div>
                                            </td>

                                            <td className="px-4 py-5">
                                                <span
                                                    className={`text-sm font-semibold ${PRIORITY_STYLES[
                                                        ticket.priority
                                                    ] || "text-text-secondary"
                                                        }`}
                                                >
                                                    <span className="mr-2">●</span>
                                                    {formatLabel(
                                                        ticket.priority
                                                    )}
                                                </span>
                                            </td>

                                            <td className="px-4 py-5">
                                                <StatusBadge
                                                    status={ticket.status}
                                                />
                                            </td>

                                            <td className="whitespace-nowrap px-4 py-5 text-sm text-text-secondary">
                                                <span className="inline-flex items-center gap-2">
                                                    <FiCalendar />
                                                    {formatDate(ticket.createdAt)}
                                                </span>
                                            </td>

                                            <td className="px-6 py-5 text-right">
                                                <button
                                                    type="button"
                                                    onClick={() =>
                                                        openTicket(ticket)
                                                    }
                                                    className="inline-flex items-center gap-2 rounded-lg border border-border px-3 py-2 text-sm font-semibold transition hover:border-primary hover:text-primary"
                                                >
                                                    View
                                                    <FiArrowUpRight />
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                            </tbody>
                        </table>
                    </div>

                    {/* Mobile cards */}
                    <div className="space-y-3 p-4 md:hidden">
                        {!loading &&
                            visibleTickets.map((ticket) => (
                                <article
                                    key={ticket._id}
                                    className="rounded-xl border border-border p-4"
                                >
                                    <div className="flex items-start justify-between gap-3">
                                        <div className="min-w-0">
                                            <p className="wrap-break-word font-semibold">
                                                {ticket.subject}
                                            </p>
                                            <p className="mt-1 text-xs font-medium text-primary">
                                                {ticket.ticketId}
                                            </p>
                                        </div>

                                        <span
                                            className={`shrink-0 text-xs font-semibold ${PRIORITY_STYLES[
                                                ticket.priority
                                            ] || "text-text-secondary"
                                                }`}
                                        >
                                            {formatLabel(ticket.priority)}
                                        </span>
                                    </div>

                                    <div className="mt-4 flex flex-wrap items-center gap-2">
                                        <StatusBadge status={ticket.status} />
                                        <span className="rounded-full bg-background/30 px-2.5 py-1 text-xs text-text-secondary">
                                            {formatLabel(ticket.category)}
                                        </span>
                                    </div>

                                    <div className="mt-4 flex items-center justify-between gap-3 border-t border-border pt-3">
                                        <div className="min-w-0">
                                            <p className="truncate text-sm font-medium">
                                                {ticket.student?.name || "Student"}
                                            </p>
                                            <p className="mt-1 text-xs text-text-secondary">
                                                {formatDate(ticket.createdAt)}
                                            </p>
                                        </div>

                                        <button
                                            type="button"
                                            onClick={() => openTicket(ticket)}
                                            className="inline-flex shrink-0 items-center gap-1 rounded-lg bg-primary px-3 py-2 text-sm font-semibold text-white transition hover:bg-primary/90"
                                        >
                                            Open
                                            <FiArrowUpRight />
                                        </button>
                                    </div>
                                </article>
                            ))}
                    </div>

                    {/* Loading state */}
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

                    {/* Empty state */}
                    {!loading &&
                        filteredTickets.length === 0 && (
                            <div className="px-5 py-16 text-center">
                                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-background/30 text-text-secondary">
                                    <FiInbox size={26} />
                                </div>

                                <h3 className="mt-4 font-semibold">
                                    {tickets.length === 0
                                        ? "No assigned queries yet"
                                        : "No matching queries"}
                                </h3>

                                <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-text-secondary">
                                    {tickets.length === 0
                                        ? "Queries assigned to you will appear here."
                                        : "Try changing your search or filters to find a ticket."}
                                </p>

                                {(search ||
                                    status !== "ALL" ||
                                    priority !== "ALL") && (
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setSearch("");
                                                setStatus("ALL");
                                                setPriority("ALL");
                                                setPage(1);
                                            }}
                                            className="mt-4 text-sm font-semibold text-primary hover:underline"
                                        >
                                            Clear filters
                                        </button>
                                    )}
                            </div>
                        )}

                    {/* Pagination */}
                    {!loading && filteredTickets.length > 0 && (
                        <div className="flex flex-col gap-3 border-t border-border px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
                            <p className="text-sm text-text-secondary">
                                Page {page} of {totalPages}
                            </p>

                            <div className="flex items-center gap-2">
                                <button
                                    type="button"
                                    onClick={() =>
                                        setPage((current) =>
                                            Math.max(1, current - 1)
                                        )
                                    }
                                    disabled={page === 1}
                                    aria-label="Previous page"
                                    className="inline-flex h-10 items-center gap-2 rounded-lg border border-border px-3 text-sm font-medium transition hover:bg-background/30 disabled:cursor-not-allowed disabled:opacity-40"
                                >
                                    <FiChevronLeft />
                                    Previous
                                </button>

                                <button
                                    type="button"
                                    onClick={() =>
                                        setPage((current) =>
                                            Math.min(totalPages, current + 1)
                                        )
                                    }
                                    disabled={page >= totalPages}
                                    aria-label="Next page"
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
                    <p className="text-sm font-medium text-text-secondary">
                        {title}
                    </p>
                    <p className="mt-3 text-3xl font-bold tracking-tight">
                        {value}
                    </p>
                </div>

                <div
                    className={`flex h-11 w-11 items-center justify-center rounded-xl text-xl ${iconStyle}`}
                >
                    {icon}
                </div>
            </div>

            <p className="mt-3 text-xs text-text-secondary">
                {description}
            </p>
        </div>
    );
}

function StatusBadge({ status }: { status: TicketStatus }) {
    return (
        <span
            className={`inline-flex items-center whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-inset ${STATUS_STYLES[status] || "bg-gray-100 text-gray-600"
                }`}
        >
            {formatLabel(status)}
        </span>
    );
}
