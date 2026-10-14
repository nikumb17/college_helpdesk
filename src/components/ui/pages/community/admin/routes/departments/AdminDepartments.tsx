"use client";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import axios from "axios";
import { toast } from "react-toastify";
import {
    FiBriefcase,
    FiRefreshCw,
    FiSearch,
    FiUsers,
    FiCheckCircle,
    FiXCircle,
    FiAlertCircle,
} from "react-icons/fi";
import Button from "@/components/ui/shared/Button";
import AddDepartment from "../../modals/AddDepartment";

interface Department {
    _id: string;
    name: string;
    code?: string;
    description?: string;
    isActive: boolean;
    createdAt?: string;
    updatedAt?: string;
}

const AdminDepartments = () => {
    const [departments, setDepartments] = useState<Department[]>([]);
    const [search, setSearch] = useState("");
    const [statusFilter, setStatusFilter] = useState<
        "ALL" | "ACTIVE" | "INACTIVE"
    >("ALL");
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [error, setError] = useState("");

    const [addDep, setAddDep] = useState<boolean>(false);

    const fetchDepartments = useCallback(async (isRefresh = false) => {
        if (isRefresh) {
            setRefreshing(true);
        } else {
            setLoading(true);
        }

        setError("");

        try {
            const response = await axios.get(
                "/api/v1/helpdesk/admin/departments"
            );

            const fetchedDepartments: Department[] =
                response.data?.data?.departments ?? [];

            setDepartments(fetchedDepartments);
        } catch (err: unknown) {
            const message = axios.isAxiosError(err)
                ? err.response?.data?.message ||
                "Unable to fetch departments."
                : "An unexpected error occurred.";

            setError(message);
            toast.error(message);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, []);

    useEffect(() => {
        void fetchDepartments();
    }, [fetchDepartments]);

    const filteredDepartments = useMemo(() => {
        const query = search.trim().toLowerCase();

        return departments.filter((department) => {
            const matchesSearch =
                !query ||
                department.name.toLowerCase().includes(query) ||
                department.code?.toLowerCase().includes(query) ||
                department.description?.toLowerCase().includes(query);

            const matchesStatus =
                statusFilter === "ALL" ||
                (statusFilter === "ACTIVE" && department.isActive) ||
                (statusFilter === "INACTIVE" && !department.isActive);

            return matchesSearch && matchesStatus;
        });
    }, [departments, search, statusFilter]);

    const activeCount = departments.filter(
        (department) => department.isActive
    ).length;

    const inactiveCount = departments.length - activeCount;

    const formatDate = (date?: string) => {
        if (!date) return "—";

        const parsedDate = new Date(date);

        if (Number.isNaN(parsedDate.getTime())) return "—";

        return parsedDate.toLocaleDateString("en-IN", {
            day: "2-digit",
            month: "short",
            year: "numeric",
        });
    };

    return (
        <>
            {addDep && (
                <AddDepartment
                    onClose={() => setAddDep(false)}
                />
            )}
            <div className="min-h-screen p-4 sm:p-6 lg:p-8">
                <div className="mx-auto w-full space-y-6">
                    {/* Header */}
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                            <div className="flex items-center gap-3">
                                <div className="rounded-xl bg-blue-100 p-3 text-blue-600">
                                    <FiBriefcase size={24} />
                                </div>

                                <div>
                                    <h1 className="text-2xl font-bold text-gray-900 sm:text-3xl">
                                        Departments
                                    </h1>
                                    <p className="mt-1 text-sm text-gray-500">
                                        View and manage helpdesk departments.
                                    </p>
                                </div>
                            </div>
                        </div>

                        <button
                            type="button"
                            onClick={() => void fetchDepartments(true)}
                            disabled={loading || refreshing}
                            className="inline-flex items-center justify-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 shadow-sm transition hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                            <FiRefreshCw
                                className={
                                    refreshing ? "animate-spin" : ""
                                }
                                size={16}
                            />
                            {refreshing ? "Refreshing..." : "Refresh"}
                        </button>
                    </div>

                    {/* Statistics */}
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-gray-500">
                                        Total Departments
                                    </p>
                                    <p className="mt-2 text-3xl font-bold text-gray-900">
                                        {departments.length}
                                    </p>
                                </div>
                                <div className="rounded-lg bg-blue-50 p-3 text-blue-600">
                                    <FiBriefcase size={22} />
                                </div>
                            </div>
                        </div>

                        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-gray-500">
                                        Active Departments
                                    </p>
                                    <p className="mt-2 text-3xl font-bold text-gray-900">
                                        {activeCount}
                                    </p>
                                </div>
                                <div className="rounded-lg bg-green-50 p-3 text-green-600">
                                    <FiCheckCircle size={22} />
                                </div>
                            </div>
                        </div>

                        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-gray-500">
                                        Inactive Departments
                                    </p>
                                    <p className="mt-2 text-3xl font-bold text-gray-900">
                                        {inactiveCount}
                                    </p>
                                </div>
                                <div className="rounded-lg bg-red-50 p-3 text-red-600">
                                    <FiXCircle size={22} />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Search and filters */}
                    <section className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm sm:p-5">
                        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                            <div className="relative w-full md:max-w-md">
                                <FiSearch
                                    className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                                    size={18}
                                />

                                <input
                                    type="search"
                                    value={search}
                                    onChange={(event) =>
                                        setSearch(event.target.value)
                                    }
                                    placeholder="Search by department name or code..."
                                    className="w-full rounded-lg border border-gray-200 bg-gray-50 py-2.5 pl-10 pr-4 text-sm text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                                />
                            </div>

                            <div className="flex items-center gap-5">
                                <div className="flex flex-wrap items-center gap-2">
                                    {(
                                        [
                                            ["ALL", "All"],
                                            ["ACTIVE", "Active"],
                                            ["INACTIVE", "Inactive"],
                                        ] as const
                                    ).map(([value, label]) => (
                                        <button
                                            key={value}
                                            type="button"
                                            onClick={() =>
                                                setStatusFilter(value)
                                            }
                                            className={`rounded-lg px-4 py-2 text-sm font-medium transition ${statusFilter === value
                                                ? "bg-blue-600 text-white"
                                                : "border border-gray-200 bg-white text-gray-600 hover:bg-gray-50"
                                                }`}
                                        >
                                            {label}
                                        </button>
                                    ))}
                                </div>
                                <div>
                                    <Button
                                        type="button"
                                        onClick={() => setAddDep(true)}
                                    >
                                        Add Department
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </section>

                    {/* Department list */}
                    <section className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
                        <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4">
                            <div>
                                <h2 className="font-semibold text-gray-900">
                                    All Departments
                                </h2>
                                <p className="mt-1 text-sm text-gray-500">
                                    {filteredDepartments.length} department
                                    {filteredDepartments.length !== 1
                                        ? "s"
                                        : ""}{" "}
                                    found
                                </p>
                            </div>

                            <FiUsers
                                className="text-gray-400"
                                size={21}
                            />
                        </div>

                        {loading ? (
                            <div className="space-y-4 p-6">
                                {[1, 2, 3, 4].map((item) => (
                                    <div
                                        key={item}
                                        className="h-14 animate-pulse rounded-lg bg-gray-100"
                                    />
                                ))}
                            </div>
                        ) : error && departments.length === 0 ? (
                            <div className="flex flex-col items-center px-6 py-14 text-center">
                                <FiAlertCircle
                                    className="text-red-500"
                                    size={32}
                                />
                                <p className="mt-3 font-medium text-gray-900">
                                    Could not load departments
                                </p>
                                <p className="mt-1 text-sm text-gray-500">
                                    {error}
                                </p>
                                <button
                                    type="button"
                                    onClick={() =>
                                        void fetchDepartments()
                                    }
                                    className="mt-4 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
                                >
                                    Try again
                                </button>
                            </div>
                        ) : filteredDepartments.length === 0 ? (
                            <div className="px-6 py-16 text-center">
                                <FiBriefcase
                                    className="mx-auto text-gray-300"
                                    size={36}
                                />
                                <p className="mt-3 font-medium text-gray-900">
                                    No departments found
                                </p>
                                <p className="mt-1 text-sm text-gray-500">
                                    Try changing your search or status filter.
                                </p>
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full min-w-175 text-left">
                                    <thead className="bg-gray-50">
                                        <tr className="text-xs uppercase tracking-wider text-gray-500">
                                            <th className="px-5 py-4 font-semibold">
                                                Department
                                            </th>
                                            <th className="px-5 py-4 font-semibold">
                                                Code
                                            </th>
                                            <th className="px-5 py-4 font-semibold">
                                                Description
                                            </th>
                                            <th className="px-5 py-4 font-semibold">
                                                Status
                                            </th>
                                            <th className="px-5 py-4 font-semibold">
                                                Created
                                            </th>
                                        </tr>
                                    </thead>

                                    <tbody className="divide-y divide-gray-100">
                                        {filteredDepartments.map(
                                            (department) => (
                                                <tr
                                                    key={department._id}
                                                    className="transition hover:bg-gray-50"
                                                >
                                                    <td className="px-5 py-4">
                                                        <div className="flex items-center gap-3">
                                                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-blue-50 font-semibold text-blue-700">
                                                                {department.name
                                                                    .slice(0, 2)
                                                                    .toUpperCase()}
                                                            </div>
                                                            <div>
                                                                <p className="font-medium text-gray-900">
                                                                    {department.name}
                                                                </p>
                                                                <p className="mt-1 text-xs text-gray-400">
                                                                    ID:{" "}
                                                                    {department._id.slice(
                                                                        -8
                                                                    )}
                                                                </p>
                                                            </div>
                                                        </div>
                                                    </td>

                                                    <td className="px-5 py-4">
                                                        <span className="rounded-md bg-gray-100 px-2.5 py-1 font-mono text-xs font-medium text-gray-700">
                                                            {department.code ||
                                                                "—"}
                                                        </span>
                                                    </td>

                                                    <td className="max-w-xs px-5 py-4 text-sm text-gray-600">
                                                        <p className="line-clamp-2">
                                                            {department.description ||
                                                                "No description provided"}
                                                        </p>
                                                    </td>

                                                    <td className="px-5 py-4">
                                                        <span
                                                            className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${department.isActive
                                                                ? "bg-green-50 text-green-700"
                                                                : "bg-red-50 text-red-700"
                                                                }`}
                                                        >
                                                            <span
                                                                className={`h-1.5 w-1.5 rounded-full ${department.isActive
                                                                    ? "bg-green-500"
                                                                    : "bg-red-500"
                                                                    }`}
                                                            />
                                                            {department.isActive
                                                                ? "Active"
                                                                : "Inactive"}
                                                        </span>
                                                    </td>

                                                    <td className="whitespace-nowrap px-5 py-4 text-sm text-gray-500">
                                                        {formatDate(
                                                            department.createdAt
                                                        )}
                                                    </td>
                                                </tr>
                                            )
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        )}

                        {!loading &&
                            !error &&
                            filteredDepartments.length > 0 && (
                                <div className="border-t border-gray-100 px-5 py-4 text-xs text-gray-500">
                                    Showing {filteredDepartments.length} of{" "}
                                    {departments.length} departments
                                </div>
                            )}
                    </section>
                </div>
            </div>
        </>
    );
};

export default AdminDepartments;