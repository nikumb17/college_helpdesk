"use client";
import { useCallback, useEffect, useState } from "react";
import axios from "axios";
import { toast } from "react-toastify";
import {
    FiAlertCircle,
    FiArrowDown,
    FiArrowUp,
    FiCheck,
    FiChevronLeft,
    FiChevronRight,
    FiClock,
    FiFilter,
    FiFileText,
    FiRefreshCw,
    FiSearch,
    FiSend,
} from "react-icons/fi";

interface Department {
    _id: string;
    name: string;
    code?: string;
    isActive?: boolean;
}

interface AssignedDepartment {
    _id?: string;
    name?: string;
}

interface AdminTicket {
    _id: string;
    ticketId: string;
    subject: string;
    description?: string;
    category: string;
    priority: string;
    status: string;
    assignedDepartment?: string | AssignedDepartment | null;
    createdAt: string;
    updatedAt?: string;
}

interface Pagination {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
}

interface ApiResponse<T> {
    success?: boolean;
    message?: string;
    data?: T;
}

const PAGE_SIZE = 10;

const STATUS_OPTIONS = [
    { value: "", label: "All statuses" },
    { value: "SUBMITTED", label: "Submitted" },
    { value: "UNDER_REVIEW", label: "Under Review" },
    { value: "IN_PROGRESS", label: "In Progress" },
    { value: "WAITING_FOR_STUDENT", label: "Waiting for Student" },
    { value: "RESOLVED", label: "Resolved" },
    { value: "CLOSED", label: "Closed" },
    { value: "REJECTED", label: "Rejected" },
];

const PRIORITY_OPTIONS = [
    { value: "", label: "All priorities" },
    { value: "LOW", label: "Low" },
    { value: "MEDIUM", label: "Medium" },
    { value: "HIGH", label: "High" },
    { value: "URGENT", label: "Urgent" },
];

const statusStyles: Record<string, string> = {
    SUBMITTED: "bg-blue-500/10 text-blue-600 border-blue-500/20",
    UNDER_REVIEW: "bg-amber-500/10 text-amber-600 border-amber-500/20",
    IN_PROGRESS: "bg-indigo-500/10 text-indigo-600 border-indigo-500/20",
    WAITING_FOR_STUDENT:
        "bg-orange-500/10 text-orange-600 border-orange-500/20",
    RESOLVED:
        "bg-emerald-500/10 text-emerald-600 border-emerald-500/20",
    CLOSED: "bg-gray-500/10 text-gray-600 border-gray-500/20",
    REJECTED: "bg-red-500/10 text-red-600 border-red-500/20",
};

const priorityStyles: Record<string, string> = {
    LOW: "text-slate-500",
    MEDIUM: "text-blue-600",
    HIGH: "text-orange-600",
    URGENT: "text-red-600",
};

const formatLabel = (value?: string) => {
    if (!value) return "Not specified";

    return value
        .replace(/[_-]+/g, " ")
        .toLowerCase()
        .replace(/\b\w/g, (character) => character.toUpperCase());
};

const formatDate = (value?: string) => {
    if (!value) return "—";

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) return "—";

    return new Intl.DateTimeFormat("en-IN", {
        dateStyle: "medium",
        timeStyle: "short",
    }).format(date);
};

const getErrorMessage = (error: unknown, fallback: string) => {
    if (axios.isAxiosError(error)) {
        return error.response?.data?.message ?? fallback;
    }

    return error instanceof Error ? error.message : fallback;
};

const getDepartmentId = (
    department?: string | AssignedDepartment | null
): string => {
    if (!department) return "";

    return typeof department === "string"
        ? department
        : department._id ?? "";
};

const getDepartmentName = (
    department: string | AssignedDepartment | null | undefined,
    departments: Department[]
) => {
    if (!department) return "Unassigned";

    if (typeof department !== "string") {
        return department.name ?? "Assigned department";
    }

    return (
        departments.find((item) => item._id === department)?.name ??
        "Assigned department"
    );
};

const AdminTickets = () => {
    const [tickets, setTickets] = useState<AdminTicket[]>([]);
    const [departments, setDepartments] = useState<Department[]>([]);

    const [search, setSearch] = useState("");
    const [statusFilter, setStatusFilter] = useState("");
    const [priorityFilter, setPriorityFilter] = useState("");

    const [page, setPage] = useState(1);
    const [pagination, setPagination] = useState<Pagination>({
        page: 1,
        limit: PAGE_SIZE,
        total: 0,
        totalPages: 1,
    });

    const [selectedDepartments, setSelectedDepartments] = useState<
        Record<string, string>
    >({});

    const [loading, setLoading] = useState(true);
    const [loadingDepartments, setLoadingDepartments] = useState(true);
    const [assigningTicketId, setAssigningTicketId] = useState<string | null>(
        null
    );

    const [refreshing, setRefreshing] = useState(false);

    const fetchDepartments = useCallback(async () => {
        setLoadingDepartments(true);

        try {
            const response = await axios.get<
                ApiResponse<{ departments: Department[] }>
            >("/api/v1/helpdesk/department/options");

            const list = response.data.data?.departments ?? [];

            setDepartments(list.filter((department) => department.isActive !== false));
        } catch (error) {
            toast.error(
                getErrorMessage(
                    error,
                    "Unable to load departments."
                )
            );
        } finally {
            setLoadingDepartments(false);
        }
    }, []);

    const fetchTickets = useCallback(
        async (showRefresh = false) => {
            if (showRefresh) {
                setRefreshing(true);
            } else {
                setLoading(true);
            }

            try {
                const response = await axios.get<
                    ApiResponse<{
                        tickets: AdminTicket[];
                        pagination?: Pagination;
                    }>
                >("/api/v1/helpdesk/admin/tickets", {
                    params: {
                        page,
                        limit: PAGE_SIZE,
                        search: search.trim() || undefined,
                        status: statusFilter || undefined,
                        priority: priorityFilter || undefined,
                    },
                });

                const data = response.data.data;

                setTickets(data?.tickets ?? []);

                setPagination(
                    data?.pagination ?? {
                        page,
                        limit: PAGE_SIZE,
                        total: data?.tickets?.length ?? 0,
                        totalPages: 1,
                    }
                );

                // Initialize each row's dropdown from its current assignment.
                setSelectedDepartments((previous) => {
                    const next = { ...previous };

                    for (const ticket of data?.tickets ?? []) {
                        if (!(ticket.ticketId in next)) {
                            next[ticket.ticketId] = getDepartmentId(
                                ticket.assignedDepartment
                            );
                        }
                    }

                    return next;
                });
            } catch (error) {
                toast.error(
                    getErrorMessage(
                        error,
                        "Unable to load helpdesk tickets."
                    )
                );
            } finally {
                setLoading(false);
                setRefreshing(false);
            }
        },
        [page, search, statusFilter, priorityFilter]
    );

    useEffect(() => {
        void fetchDepartments();
    }, [fetchDepartments]);

    useEffect(() => {
        void fetchTickets();
    }, [fetchTickets]);

    const handleAssignDepartment = async (ticket: AdminTicket) => {
        const departmentId = selectedDepartments[ticket.ticketId];

        if (!departmentId) {
            toast.error("Please select a department.");
            return;
        }

        const currentDepartmentId = getDepartmentId(
            ticket.assignedDepartment
        );

        if (departmentId === currentDepartmentId) {
            toast.info("This ticket is already assigned to that department.");
            return;
        }

        setAssigningTicketId(ticket.ticketId);

        try {
            // The backend must authorize ADMIN and validate the department.
            await axios.post(
                `/api/v1/helpdesk/admin/tickets/department?ticketId=${encodeURIComponent(
                    ticket.ticketId
                )}`,
                { departmentId }
            );

            toast.success("Department assigned successfully.");

            // Reload so the displayed assignment reflects persisted data.
            await fetchTickets(true);
        } catch (error) {
            toast.error(
                getErrorMessage(
                    error,
                    "Unable to assign the department."
                )
            );
        } finally {
            setAssigningTicketId(null);
        }
    };

    const handleFilterChange = (
        setter: (value: string) => void,
        value: string
    ) => {
        setter(value);
        setPage(1);
    };

    const unassignedCount = tickets.filter(
        (ticket) => !ticket.assignedDepartment
    ).length;

    const pageCount = Math.max(1, pagination.totalPages);

    return (
        <section className="min-h-screen px-4 py-8 text-text-primary sm:px-6 lg:px-8">
            <div className="mx-auto w-full space-y-6">
                {/* Header */}
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <div className="flex items-center gap-2 text-sm font-semibold text-primary">
                            <FiFileText size={17} />
                            Helpdesk Administration
                        </div>

                        <h1 className="mt-2 text-2xl font-bold tracking-tight sm:text-3xl">
                            Ticket Management
                        </h1>

                        <p className="mt-2 max-w-2xl text-sm leading-6 text-text-secondary">
                            Review incoming tickets and route each query to
                            the appropriate department.
                        </p>
                    </div>

                    <button
                        type="button"
                        onClick={() => void fetchTickets(true)}
                        disabled={loading || refreshing}
                        className="inline-flex items-center justify-center gap-2 rounded-xl border border-border bg-surface px-4 py-2.5 text-sm font-semibold transition hover:bg-background/30 disabled:opacity-50"
                    >
                        <FiRefreshCw
                            className={
                                refreshing ? "animate-spin" : ""
                            }
                        />
                        Refresh
                    </button>
                </div>

                {/* Summary cards */}
                <div className="grid gap-4 sm:grid-cols-2">
                    <div className="rounded-2xl border border-border bg-surface p-5">
                        <div className="flex items-center justify-between">
                            <p className="text-sm text-text-secondary">
                                Total matching tickets
                            </p>
                            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                                <FiFileText size={19} />
                            </span>
                        </div>

                        <p className="mt-3 text-3xl font-bold">
                            {pagination.total}
                        </p>

                        <p className="mt-1 text-xs text-text-secondary">
                            Tickets matching your current filters
                        </p>
                    </div>

                    <div className="rounded-2xl border border-amber-500/20 bg-surface p-5">
                        <div className="flex items-center justify-between">
                            <p className="text-sm text-text-secondary">
                                Unassigned on this page
                            </p>
                            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/10 text-amber-600">
                                <FiAlertCircle size={19} />
                            </span>
                        </div>

                        <p className="mt-3 text-3xl font-bold">
                            {unassignedCount}
                        </p>

                        <p className="mt-1 text-xs text-text-secondary">
                            Tickets awaiting department routing
                        </p>
                    </div>
                </div>

                {/* Search and filters */}
                <div className="rounded-2xl border border-border bg-surface p-4 sm:p-5">
                    <div className="mb-4 flex items-center gap-2">
                        <FiFilter className="text-primary" size={18} />
                        <h2 className="font-semibold">Search and filter</h2>
                    </div>

                    <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                        <div className="relative">
                            <FiSearch
                                className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary"
                                size={17}
                            />

                            <input
                                type="search"
                                value={search}
                                onChange={(event) =>
                                    handleFilterChange(
                                        setSearch,
                                        event.target.value
                                    )
                                }
                                placeholder="Search ID, subject, category..."
                                className="w-full rounded-xl border border-border bg-background/30 py-2.5 pl-10 pr-3 text-sm outline-none transition focus:border-primary"
                            />
                        </div>

                        <select
                            value={statusFilter}
                            onChange={(event) =>
                                handleFilterChange(
                                    setStatusFilter,
                                    event.target.value
                                )
                            }
                            className="w-full rounded-xl border border-border bg-background/30 px-3 py-2.5 text-sm outline-none focus:border-primary"
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

                        <select
                            value={priorityFilter}
                            onChange={(event) =>
                                handleFilterChange(
                                    setPriorityFilter,
                                    event.target.value
                                )
                            }
                            className="w-full rounded-xl border border-border bg-background/30 px-3 py-2.5 text-sm outline-none focus:border-primary"
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

                        <button
                            type="button"
                            onClick={() => {
                                setSearch("");
                                setStatusFilter("");
                                setPriorityFilter("");
                                setPage(1);
                            }}
                            className="rounded-xl border border-border px-4 py-2.5 text-sm font-semibold transition hover:bg-background/30"
                        >
                            Clear filters
                        </button>
                    </div>
                </div>

                {/* Tickets table */}
                <div className="overflow-hidden rounded-2xl border border-border bg-surface">
                    <div className="flex flex-col gap-2 border-b border-border px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                            <h2 className="font-bold">All Tickets</h2>
                            <p className="mt-1 text-xs text-text-secondary">
                                Assign each ticket to the department
                                responsible for handling it.
                            </p>
                        </div>

                        <span className="text-sm text-text-secondary">
                            Page {pagination.page} of {pageCount}
                        </span>
                    </div>

                    {loading ? (
                        <div className="flex min-h-64 items-center justify-center gap-3 text-sm text-text-secondary">
                            <FiClock className="animate-spin" size={20} />
                            Loading tickets...
                        </div>
                    ) : tickets.length === 0 ? (
                        <div className="flex min-h-64 flex-col items-center justify-center px-5 text-center">
                            <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-background/30 text-text-secondary">
                                <FiFileText size={25} />
                            </span>

                            <h3 className="mt-4 font-semibold">
                                No tickets found
                            </h3>

                            <p className="mt-2 max-w-md text-sm text-text-secondary">
                                No tickets match your current search and
                                filters. Try changing your filters or
                                refreshing the list.
                            </p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full min-w-262.5 text-left">
                                <thead className="bg-background/30/70">
                                    <tr className="border-b border-border text-xs uppercase tracking-wider text-text-secondary">
                                        <th className="px-5 py-4 font-semibold">
                                            Ticket
                                        </th>
                                        <th className="px-5 py-4 font-semibold">
                                            Category / Priority
                                        </th>
                                        <th className="px-5 py-4 font-semibold">
                                            Status
                                        </th>
                                        <th className="px-5 py-4 font-semibold">
                                            Department
                                        </th>
                                        <th className="px-5 py-4 font-semibold">
                                            Submitted
                                        </th>
                                        <th className="px-5 py-4 text-right font-semibold">
                                            Action
                                        </th>
                                    </tr>
                                </thead>

                                <tbody className="divide-y divide-border">
                                    {tickets.map((ticket) => {
                                        const currentDepartmentId =
                                            getDepartmentId(
                                                ticket.assignedDepartment
                                            );

                                        const selectedDepartmentId =
                                            selectedDepartments[
                                            ticket.ticketId
                                            ] ?? currentDepartmentId;

                                        const hasChanged =
                                            selectedDepartmentId !==
                                            currentDepartmentId;

                                        const isAssigning =
                                            assigningTicketId ===
                                            ticket.ticketId;

                                        return (
                                            <tr
                                                key={ticket._id}
                                                className="align-top transition hover:bg-background/30/40"
                                            >
                                                <td className="max-w-xs px-5 py-4">
                                                    <p className="font-mono text-xs font-semibold text-primary">
                                                        {ticket.ticketId}
                                                    </p>

                                                    <p className="mt-2 line-clamp-2 text-sm font-semibold text-text-primary">
                                                        {ticket.subject}
                                                    </p>

                                                    <p className="mt-1 line-clamp-2 text-xs leading-5 text-text-secondary">
                                                        {ticket.description ||
                                                            "No description provided."}
                                                    </p>
                                                </td>

                                                <td className="px-5 py-4">
                                                    <p className="text-sm font-medium">
                                                        {formatLabel(
                                                            ticket.category
                                                        )}
                                                    </p>

                                                    <p
                                                        className={`mt-2 text-xs font-semibold ${priorityStyles[
                                                            ticket.priority?.toUpperCase()
                                                        ] ??
                                                            "text-text-secondary"
                                                            }`}
                                                    >
                                                        {formatLabel(
                                                            ticket.priority
                                                        )}{" "}
                                                        priority
                                                    </p>
                                                </td>

                                                <td className="px-5 py-4">
                                                    <span
                                                        className={`inline-flex whitespace-nowrap rounded-full border px-2.5 py-1 text-xs font-semibold ${statusStyles[
                                                            ticket.status?.toUpperCase()
                                                        ] ??
                                                            "border-border bg-background/30 text-text-secondary"
                                                            }`}
                                                    >
                                                        {formatLabel(
                                                            ticket.status
                                                        )}
                                                    </span>
                                                </td>

                                                <td className="px-5 py-4">
                                                    <p
                                                        className={`text-sm font-medium ${!ticket.assignedDepartment
                                                            ? "text-amber-600"
                                                            : "text-text-primary"
                                                            }`}
                                                    >
                                                        {getDepartmentName(
                                                            ticket.assignedDepartment,
                                                            departments
                                                        )}
                                                    </p>

                                                    {!ticket.assignedDepartment && (
                                                        <p className="mt-1 text-xs text-amber-600">
                                                            Awaiting assignment
                                                        </p>
                                                    )}
                                                </td>

                                                <td className="whitespace-nowrap px-5 py-4">
                                                    <p className="text-sm text-text-primary">
                                                        {formatDate(
                                                            ticket.createdAt
                                                        )}
                                                    </p>

                                                    <p className="mt-1 text-xs text-text-secondary">
                                                        Updated{" "}
                                                        {formatDate(
                                                            ticket.updatedAt
                                                        )}
                                                    </p>
                                                </td>

                                                <td className="px-5 py-4">
                                                    <div className="flex min-w-56 flex-col gap-2">
                                                        <select
                                                            value={
                                                                selectedDepartmentId
                                                            }
                                                            disabled={
                                                                loadingDepartments ||
                                                                isAssigning
                                                            }
                                                            onChange={(
                                                                event
                                                            ) =>
                                                                setSelectedDepartments(
                                                                    (
                                                                        previous
                                                                    ) => ({
                                                                        ...previous,
                                                                        [ticket.ticketId]:
                                                                            event
                                                                                .target
                                                                                .value,
                                                                    })
                                                                )
                                                            }
                                                            className="w-full rounded-lg border border-border bg-background/30 px-3 py-2 text-sm outline-none focus:border-primary disabled:opacity-50"
                                                        >
                                                            <option value="">
                                                                Select department
                                                            </option>

                                                            {departments.map(
                                                                (
                                                                    department
                                                                ) => (
                                                                    <option
                                                                        key={
                                                                            department._id
                                                                        }
                                                                        value={
                                                                            department._id
                                                                        }
                                                                    >
                                                                        {
                                                                            department.name
                                                                        }
                                                                        {department.code
                                                                            ? ` (${department.code})`
                                                                            : ""}
                                                                    </option>
                                                                )
                                                            )}
                                                        </select>

                                                        <button
                                                            type="button"
                                                            disabled={
                                                                !hasChanged ||
                                                                !selectedDepartmentId ||
                                                                isAssigning ||
                                                                loadingDepartments
                                                            }
                                                            onClick={() =>
                                                                void handleAssignDepartment(
                                                                    ticket
                                                                )
                                                            }
                                                            className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-3 py-2 text-xs font-semibold text-white transition hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-50"
                                                        >
                                                            {isAssigning ? (
                                                                <>
                                                                    <FiClock className="animate-spin" />
                                                                    Assigning...
                                                                </>
                                                            ) : hasChanged ? (
                                                                <>
                                                                    <FiSend />
                                                                    Assign Department
                                                                </>
                                                            ) : (
                                                                <>
                                                                    <FiCheck />
                                                                    Assigned
                                                                </>
                                                            )}
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    )}

                    {/* Pagination */}
                    {!loading && tickets.length > 0 && (
                        <div className="flex flex-col gap-3 border-t border-border px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
                            <p className="text-sm text-text-secondary">
                                Showing{" "}
                                {(pagination.page - 1) * pagination.limit +
                                    1}{" "}
                                –{" "}
                                {Math.min(
                                    pagination.page * pagination.limit,
                                    pagination.total
                                )}{" "}
                                of {pagination.total} tickets
                            </p>

                            <div className="flex items-center gap-2">
                                <button
                                    type="button"
                                    onClick={() =>
                                        setPage((current) =>
                                            Math.max(1, current - 1)
                                        )
                                    }
                                    disabled={page <= 1}
                                    className="inline-flex items-center gap-1 rounded-lg border border-border px-3 py-2 text-sm font-medium transition hover:bg-background/30 disabled:opacity-40"
                                >
                                    <FiChevronLeft />
                                    Previous
                                </button>

                                <span className="min-w-10 text-center text-sm font-semibold">
                                    {page}
                                </span>

                                <button
                                    type="button"
                                    onClick={() =>
                                        setPage((current) =>
                                            Math.min(
                                                pageCount,
                                                current + 1
                                            )
                                        )
                                    }
                                    disabled={page >= pageCount}
                                    className="inline-flex items-center gap-1 rounded-lg border border-border px-3 py-2 text-sm font-medium transition hover:bg-background/30 disabled:opacity-40"
                                >
                                    Next
                                    <FiChevronRight />
                                </button>
                            </div>
                        </div>
                    )}
                </div>

                {/* Workflow note */}
                <div className="flex items-start gap-3 rounded-2xl border border-primary/15 bg-primary/5 p-4">
                    <FiAlertCircle
                        size={19}
                        className="mt-0.5 shrink-0 text-primary"
                    />

                    <div>
                        <p className="text-sm font-semibold text-text-primary">
                            Department routing workflow
                        </p>
                        <p className="mt-1 text-sm leading-6 text-text-secondary">
                            Assign tickets to the department responsible for
                            the query category. Department heads can then
                            assign tickets to active staff in their own
                            department. If a department has no active staff,
                            keep the ticket in that department&apos;s
                            unassigned queue.
                        </p>
                    </div>
                </div>
            </div>
        </section>
    );
};

export default AdminTickets;