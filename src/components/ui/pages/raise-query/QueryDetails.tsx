"use client";
import { useEffect, useState } from "react";
import { Formik, Form, FormikHelpers, Field } from "formik";
import * as Yup from "yup";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import {
    FiArrowLeft,
    FiArrowRight,
    FiCheckCircle,
    FiClipboard,
    FiFileText,
    FiHelpCircle,
    FiLoader,
    FiMail,
    FiShield,
    FiUser,
} from "react-icons/fi";

import Button from "../../shared/Button";
import InputField from "../../shared/InputField";
import axios from "axios";
import { toast } from "react-toastify";

interface VerifiedStudent {
    helpdeskId: string;
    fullName: string;
    enrollmentNumber: string;
    email: string;
    contactNo?: string;
    department?: string;
    year?: string;
    institution?: string;
}

interface ProfileApiResponse {
    student?: VerifiedStudent;
    message?: string;
}

interface QueryValues {
    category: string;
    subject: string;
    description: string;
    priority: "LOW" | "MEDIUM" | "HIGH";
}

interface CreateTicketResponse {
    ticketId?: string;
    message?: string;
}

const initialValues: QueryValues = {
    category: "",
    subject: "",
    description: "",
    priority: "MEDIUM",
};

const querySchema = Yup.object({
    category: Yup.string()
        .required("Please select a query category."),

    subject: Yup.string()
        .trim()
        .min(5, "Subject must contain at least 5 characters.")
        .max(120, "Subject cannot exceed 120 characters.")
        .required("Please enter a subject."),

    description: Yup.string()
        .trim()
        .min(20, "Please describe your issue in at least 20 characters.")
        .max(3000, "Description cannot exceed 3000 characters.")
        .required("Please describe your issue."),

    priority: Yup.string()
        .oneOf(["LOW", "MEDIUM", "HIGH"])
        .required("Please select a priority."),
});

interface TicketCategory {
    value: string;
    label: string;
};

const priorities = [
    {
        value: "LOW",
        label: "Low",
        description: "General question or non-urgent request",
    },
    {
        value: "MEDIUM",
        label: "Medium",
        description: "Issue affecting a regular college activity",
    },
    {
        value: "HIGH",
        label: "High",
        description: "Time-sensitive issue requiring prompt attention",
    },
];

const pageVariants = {
    hidden: { opacity: 0, y: 12 },
    visible: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -8 },
};

function ProfileItem({
    label,
    value,
    icon,
}: {
    label: string;
    value?: string;
    icon: React.ReactNode;
}) {
    return (
        <div className="flex min-w-0 items-start gap-3 rounded-xl border border-border bg-background/30 p-3.5">
            <span className="mt-0.5 shrink-0 text-text-secondary">{icon}</span>
            <div className="min-w-0">
                <p className="text-xs font-medium text-text-secondary">{label}</p>
                <p className="mt-1 wrap-break-word text-sm font-semibold text-text-primary">
                    {value || "Not available"}
                </p>
            </div>
        </div>
    );
}

export const UnverifiedQueryDetails = () => {
    return (
        <div className="flex min-h-screen items-center justify-center px-4 py-10">
            <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                className="w-full max-w-md rounded-3xl border border-border bg-surface p-7 text-center shadow-sm sm:p-9"
            >
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                    <FiShield size={27} />
                </div>

                <h1 className="mt-5 text-xl font-bold text-text-primary">
                    Verification required
                </h1>

                <p className="mt-3 text-sm leading-6 text-text-secondary">
                    We couldn't load your verified student profile.
                </p>

                <div className="mt-6">
                    <Button href="/raise-query" size="lg" className="w-full">
                        Verify Helpdesk ID
                        <FiArrowRight className="ml-2 inline" />
                    </Button>
                </div>

                <Link
                    href="/"
                    className="mt-5 inline-block text-sm font-medium text-text-secondary hover:text-primary"
                >
                    Return to Home
                </Link>
            </motion.div>
        </div>
    )
};

const QueryDetails = ({ student, ticketCategories }: { student: VerifiedStudent, ticketCategories: TicketCategory[] }) => {
    const [ticketId, setTicketId] = useState("");
    const [submitted, setSubmitted] = useState(false);

    const submitQuery = async (
        values: QueryValues,
        helpers: FormikHelpers<QueryValues>
    ) => {
        try {
            const response = await axios.post(
                "/api/v1/helpdesk/tickets",
                JSON.stringify({
                    category: values.category,
                    subject: values.subject.trim(),
                    description: values.description.trim(),
                    priority: values.priority,
                }),
                {
                    headers: {
                        "Content-Type": "application/json",
                    },
                },
            );

            const data = response.data as CreateTicketResponse;

            setTicketId(data.ticketId || "");
            setSubmitted(true);
        } catch {
            toast.error(
                "Unable to connect to the server. Your query may not have been submitted. Please check your ticket list before retrying."
            );
        } finally {
            helpers.setSubmitting(false);
        }
    };

    return (
        <div className="min-h-screen px-4 py-10 sm:px-6 lg:py-14">
            <div className="mx-auto max-w-6xl">
                <Link
                    href="/raise-query"
                    className="mb-7 inline-flex items-center gap-2 text-sm font-medium text-text-secondary transition hover:text-primary"
                >
                    <FiArrowLeft />
                    Back to verification
                </Link>

                <AnimatePresence mode="wait">
                    {submitted ? (
                        <motion.div
                            key="success"
                            variants={pageVariants}
                            initial="hidden"
                            animate="visible"
                            exit="exit"
                            transition={{ duration: 0.25 }}
                            className="mx-auto max-w-xl rounded-3xl border border-border bg-surface p-7 text-center shadow-sm sm:p-10"
                        >
                            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-secondary/10 text-secondary">
                                <FiCheckCircle size={34} />
                            </div>

                            <h1 className="mt-5 text-2xl font-bold text-text-primary">
                                Query submitted successfully
                            </h1>

                            <p className="mt-3 text-sm leading-6 text-text-secondary">
                                Your query has been recorded. Keep your Ticket ID for future
                                reference when checking its status.
                            </p>

                            <div className="mt-7 rounded-2xl border border-border bg-background/30 p-5">
                                <p className="text-xs font-semibold uppercase tracking-widest text-text-secondary">
                                    Your Ticket ID
                                </p>

                                <p className="mt-3 break-all font-mono text-2xl font-bold tracking-wider text-primary">
                                    {ticketId}
                                </p>

                                <button
                                    type="button"
                                    onClick={() => {
                                        if (navigator.clipboard) {
                                            navigator.clipboard.writeText(ticketId);
                                            toast.success("Ticket ID copied to clipboard.");
                                        }
                                    }}
                                    className="mt-3 text-sm font-semibold text-primary hover:underline"
                                >
                                    Copy Ticket ID
                                </button>
                            </div>

                            <div className="mt-7">
                                <Button href="/" size="lg" className="w-full">
                                    Return to Home
                                    <FiArrowRight className="ml-2 inline" />
                                </Button>
                            </div>
                        </motion.div>
                    ) : (
                        <motion.div
                            key="form"
                            variants={pageVariants}
                            initial="hidden"
                            animate="visible"
                            exit="exit"
                            transition={{ duration: 0.25 }}
                            className="grid gap-6 lg:grid-cols-[0.85fr_1.4fr]"
                        >
                            {/* Student profile */}
                            <aside className="h-fit overflow-hidden rounded-3xl border border-border bg-surface shadow-sm">
                                <div className="border-b border-border bg-primary/5 p-6">
                                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                                        <FiUser size={24} />
                                    </div>

                                    <h2 className="mt-4 text-lg font-bold text-text-primary">
                                        Verified student
                                    </h2>

                                    <p className="mt-1 text-sm leading-5 text-text-secondary">
                                        These details were retrieved from your verified profile.
                                    </p>

                                    <div className="mt-4 inline-flex items-center gap-2 rounded-full border border-secondary/20 bg-secondary/10 px-3 py-1.5 text-xs font-semibold text-secondary">
                                        <FiShield size={14} />
                                        Identity verified
                                    </div>
                                </div>

                                {student && (
                                    <div className="space-y-3 p-5">
                                        <ProfileItem
                                            label="Full Name"
                                            value={student.fullName}
                                            icon={<FiUser size={17} />}
                                        />

                                        <ProfileItem
                                            label="Enrollment Number"
                                            value={student.enrollmentNumber}
                                            icon={<FiClipboard size={17} />}
                                        />

                                        <ProfileItem
                                            label="Email Address"
                                            value={student.email}
                                            icon={<FiMail size={17} />}
                                        />

                                        <ProfileItem
                                            label="Helpdesk ID"
                                            value={student.helpdeskId}
                                            icon={<FiShield size={17} />}
                                        />

                                        {student.contactNo && (
                                            <ProfileItem
                                                label="Contact Number"
                                                value={student.contactNo}
                                                icon={<FiUser size={17} />}
                                            />
                                        )}

                                        {student.department && (
                                            <ProfileItem
                                                label="Department"
                                                value={student.department}
                                                icon={<FiFileText size={17} />}
                                            />
                                        )}

                                        {student.year && (
                                            <ProfileItem
                                                label="Academic Year"
                                                value={student.year}
                                                icon={<FiFileText size={17} />}
                                            />
                                        )}

                                        {student.institution && (
                                            <ProfileItem
                                                label="Institution"
                                                value={student.institution}
                                                icon={<FiFileText size={17} />}
                                            />
                                        )}
                                    </div>
                                )}

                                <div className="border-t border-border px-5 py-4">
                                    <p className="text-xs leading-5 text-text-secondary">
                                        If any profile information is incorrect, contact the
                                        college administration to update your official record.
                                    </p>
                                </div>
                            </aside>

                            {/* Query form */}
                            <section className="overflow-hidden rounded-3xl border border-border bg-surface shadow-sm">
                                <div className="border-b border-border p-6 sm:p-8">
                                    <p className="text-sm font-semibold uppercase tracking-wider text-primary">
                                        Student Helpdesk
                                    </p>

                                    <h1 className="mt-2 text-2xl font-bold tracking-tight text-text-primary sm:text-3xl">
                                        Raise a Query
                                    </h1>

                                    <p className="mt-3 text-sm leading-6 text-text-secondary">
                                        Describe your issue clearly so the appropriate college
                                        department can review and resolve it.
                                    </p>
                                </div>

                                <div className="p-6 sm:p-8">
                                    <Formik<QueryValues>
                                        initialValues={initialValues}
                                        validationSchema={querySchema}
                                        onSubmit={submitQuery}
                                    >
                                        {({
                                            errors,
                                            touched,
                                            isSubmitting,
                                            values,
                                        }) => (
                                            <Form className="space-y-6">
                                                <div className="space-y-2">
                                                    <label
                                                        htmlFor="category"
                                                        className="text-sm font-semibold text-text-primary"
                                                    >
                                                        Query Category
                                                    </label>

                                                    <Field
                                                        as="select"
                                                        id="category"
                                                        name="category"
                                                        className={`w-full rounded-2xl border bg-background/30 px-4 py-3.5 text-sm font-medium text-text-primary outline-none transition focus:border-primary ${touched.category && errors.category
                                                            ? "border-red-500"
                                                            : "border-border"
                                                            }`}
                                                    >
                                                        <option value="">Select a category</option>
                                                        {ticketCategories.map((category) => (
                                                            <option
                                                                key={category.value}
                                                                value={category.value}
                                                            >
                                                                {category.label}
                                                            </option>
                                                        ))}
                                                    </Field>

                                                    {touched.category && errors.category && (
                                                        <p className="text-xs font-medium text-red-500">
                                                            {errors.category}
                                                        </p>
                                                    )}
                                                </div>

                                                <InputField
                                                    name="subject"
                                                    label="Query Subject"
                                                    placeholder="e.g. Scholarship application status"
                                                    icon={<FiFileText size={17} />}
                                                    touched={touched.subject}
                                                    error={errors.subject}
                                                />

                                                <div className="space-y-2">
                                                    <label
                                                        htmlFor="description"
                                                        className="text-sm font-semibold text-text-primary"
                                                    >
                                                        Describe Your Issue
                                                    </label>

                                                    <Field
                                                        as="textarea"
                                                        id="description"
                                                        name="description"
                                                        rows={6}
                                                        maxLength={3000}
                                                        placeholder="Explain the issue, what you have already tried, and any relevant details..."
                                                        className={`w-full resize-y rounded-2xl border bg-background/30 px-4 py-3.5 text-sm leading-6 text-text-primary outline-none transition placeholder:text-text-secondary/60 focus:border-primary ${touched.description && errors.description
                                                            ? "border-red-500"
                                                            : "border-border"
                                                            }`}
                                                    />

                                                    <div className="flex items-start justify-between gap-3">
                                                        {touched.description && errors.description ? (
                                                            <p className="text-xs font-medium text-red-500">
                                                                {errors.description}
                                                            </p>
                                                        ) : (
                                                            <p className="text-xs text-text-secondary">
                                                                Minimum 20 characters.
                                                            </p>
                                                        )}

                                                        <p className="shrink-0 text-xs text-text-secondary">
                                                            {values.description.length}/3000
                                                        </p>
                                                    </div>
                                                </div>

                                                <div className="space-y-3">
                                                    <label className="text-sm font-semibold text-text-primary">
                                                        Priority Level
                                                    </label>

                                                    <div className="grid gap-3 sm:grid-cols-3">
                                                        {priorities.map((priority) => {
                                                            const selected =
                                                                values.priority === priority.value;

                                                            return (
                                                                <label
                                                                    key={priority.value}
                                                                    className={`flex cursor-pointer items-start gap-3 rounded-2xl border p-4 transition ${selected
                                                                        ? "border-primary bg-primary/5"
                                                                        : "border-border hover:border-primary/40"
                                                                        }`}
                                                                >
                                                                    <Field
                                                                        type="radio"
                                                                        name="priority"
                                                                        value={priority.value}
                                                                        className="mt-1 accent-primary"
                                                                    />

                                                                    <span>
                                                                        <span className="block text-sm font-semibold text-text-primary">
                                                                            {priority.label}
                                                                        </span>
                                                                        <span className="mt-1 block text-xs leading-5 text-text-secondary">
                                                                            {priority.description}
                                                                        </span>
                                                                    </span>
                                                                </label>
                                                            );
                                                        })}
                                                    </div>

                                                    {touched.priority && errors.priority && (
                                                        <p className="text-xs font-medium text-red-500">
                                                            {errors.priority}
                                                        </p>
                                                    )}

                                                    <p className="text-xs leading-5 text-text-secondary">
                                                        Priority helps the helpdesk assess urgency.
                                                        Actual handling time depends on college policy
                                                        and the nature of the issue.
                                                    </p>
                                                </div>

                                                <div className="rounded-2xl border border-border bg-background/40 p-4">
                                                    <div className="flex items-start gap-3">
                                                        <FiHelpCircle
                                                            size={19}
                                                            className="mt-0.5 shrink-0 text-primary"
                                                        />
                                                        <p className="text-xs leading-5 text-text-secondary">
                                                            Please do not include passwords, OTPs, or
                                                            unnecessary sensitive personal information in
                                                            your query.
                                                        </p>
                                                    </div>
                                                </div>

                                                <Button
                                                    type="submit"
                                                    size="lg"
                                                    className="w-full"
                                                    loading={isSubmitting}
                                                    loadingText="Submitting query..."
                                                >
                                                    Submit Query
                                                    <FiArrowRight className="ml-2 inline" />
                                                </Button>

                                                <p className="text-center text-xs leading-5 text-text-secondary">
                                                    A unique Ticket ID will be generated after the
                                                    backend successfully creates your query.
                                                </p>
                                            </Form>
                                        )}
                                    </Formik>
                                </div>
                            </section>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
}


export default QueryDetails;