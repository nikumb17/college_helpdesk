"use client";
import Modal from "@/components/ui/shared/Modal";
import React, { useState } from "react";
import axios from "axios";
import { Formik, Form, Field, ErrorMessage } from "formik";
import * as Yup from "yup";
import { toast } from "react-toastify";
import {
    FiBriefcase,
    FiHash,
    FiFileText,
    FiX,
    FiPlus,
    FiLoader,
} from "react-icons/fi";

interface AddDepartmentProps {
    onClose: () => void;
    onSuccess?: () => void;
}

interface DepartmentFormValues {
    name: string;
    code: string;
    description: string;
}

const initialValues: DepartmentFormValues = {
    name: "",
    code: "",
    description: "",
};

const validationSchema = Yup.object({
    name: Yup.string()
        .trim()
        .min(2, "Department name must contain at least 2 characters.")
        .max(100, "Department name cannot exceed 100 characters.")
        .required("Department name is required."),

    code: Yup.string()
        .trim()
        .uppercase()
        .matches(
            /^[A-Z0-9-]+$/,
            "Use only uppercase letters, numbers, and hyphens."
        )
        .max(20, "Department code cannot exceed 20 characters.")
        .required("Department code is required."),

    description: Yup.string()
        .trim()
        .max(500, "Description cannot exceed 500 characters."),
});

const AddDepartment = ({
    onClose,
    onSuccess,
}: AddDepartmentProps) => {
    const [submitting, setSubmitting] = useState(false);

    const handleSubmit = async (
        values: DepartmentFormValues
    ) => {
        if (submitting) return;

        setSubmitting(true);

        try {
            await axios.post(
                "/api/v1/helpdesk/admin/departments/add",
                {
                    name: values.name.trim(),
                    code: values.code.trim().toUpperCase(),
                    description: values.description.trim(),
                }
            );

            toast.success("Department created successfully.");
            onSuccess?.();
            onClose();
        } catch (error: unknown) {
            const message = axios.isAxiosError(error)
                ? error.response?.data?.message ||
                "Failed to create department."
                : "An unexpected error occurred.";

            toast.error(message);
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <Modal onClose={onClose}>
            <div
                className="
                    mx-auto w-[calc(100vw-1.5rem)]
                    sm:w-[calc(100vw-2.5rem)]
                    lg:w-225
                    max-w-3xl
                    overflow-hidden rounded-2xl
                    bg-white shadow-2xl
                "
            >
                {/* Header */}
                <div className="flex items-start justify-between border-b border-gray-100 px-5 py-5 sm:px-7">
                    <div className="flex items-start gap-3">
                        <div className="rounded-xl bg-blue-50 p-3 text-blue-600">
                            <FiBriefcase size={22} />
                        </div>

                        <div>
                            <h2 className="text-xl font-bold text-gray-900">
                                Add Department
                            </h2>
                            <p className="mt-1 text-sm text-gray-500">
                                Create a department for helpdesk ticket routing.
                            </p>
                        </div>
                    </div>

                    <button
                        type="button"
                        onClick={onClose}
                        disabled={submitting}
                        aria-label="Close modal"
                        className="rounded-lg p-2 text-gray-400 transition hover:bg-gray-100 hover:text-gray-700 disabled:opacity-50"
                    >
                        <FiX size={20} />
                    </button>
                </div>

                {/* Form */}
                <Formik
                    initialValues={initialValues}
                    validationSchema={validationSchema}
                    onSubmit={handleSubmit}
                >
                    {({ isSubmitting, setFieldValue, values }) => (
                        <Form>
                            <div className="space-y-5 px-5 py-6 sm:px-7">
                                {/* Department Name */}
                                <div>
                                    <label
                                        htmlFor="name"
                                        className="mb-2 block text-sm font-medium text-gray-700"
                                    >
                                        Department Name
                                        <span className="ml-1 text-red-500">
                                            *
                                        </span>
                                    </label>

                                    <div className="relative">
                                        <FiBriefcase
                                            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                                            size={18}
                                        />

                                        <Field
                                            id="name"
                                            name="name"
                                            type="text"
                                            placeholder="e.g. Computer Science"
                                            maxLength={100}
                                            className="w-full rounded-xl border border-gray-200 bg-gray-50 py-3 pl-10 pr-4 text-sm text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-50"
                                        />
                                    </div>

                                    <ErrorMessage
                                        name="name"
                                        component="p"
                                        className="mt-1.5 text-xs text-red-500"
                                    />
                                </div>

                                {/* Department Code */}
                                <div>
                                    <label
                                        htmlFor="code"
                                        className="mb-2 block text-sm font-medium text-gray-700"
                                    >
                                        Department Code
                                        <span className="ml-1 text-red-500">
                                            *
                                        </span>
                                    </label>

                                    <div className="relative">
                                        <FiHash
                                            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                                            size={18}
                                        />

                                        <Field
                                            id="code"
                                            name="code"
                                            type="text"
                                            placeholder="e.g. CSE"
                                            maxLength={20}
                                            autoCapitalize="characters"
                                            onChange={(
                                                event: React.ChangeEvent<HTMLInputElement>
                                            ) =>
                                                setFieldValue(
                                                    "code",
                                                    event.target.value.toUpperCase()
                                                )
                                            }
                                            className="w-full rounded-xl border border-gray-200 bg-gray-50 py-3 pl-10 pr-4 text-sm uppercase text-gray-900 outline-none transition placeholder:normal-case placeholder:text-gray-400 focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-50"
                                        />
                                    </div>

                                    <ErrorMessage
                                        name="code"
                                        component="p"
                                        className="mt-1.5 text-xs text-red-500"
                                    />

                                    <p className="mt-1.5 text-xs text-gray-400">
                                        Use a unique code to identify the department.
                                    </p>
                                </div>

                                {/* Description */}
                                <div>
                                    <div className="mb-2 flex items-center justify-between gap-3">
                                        <label
                                            htmlFor="description"
                                            className="text-sm font-medium text-gray-700"
                                        >
                                            Description
                                            <span className="ml-1 text-gray-400">
                                                (Optional)
                                            </span>
                                        </label>

                                        <span className="text-xs text-gray-400">
                                            {values.description.length}/500
                                        </span>
                                    </div>

                                    <div className="relative">
                                        <FiFileText
                                            className="absolute left-3 top-3.5 text-gray-400"
                                            size={18}
                                        />

                                        <Field
                                            as="textarea"
                                            id="description"
                                            name="description"
                                            rows={4}
                                            maxLength={500}
                                            placeholder="Describe the department's responsibilities..."
                                            className="w-full resize-y rounded-xl border border-gray-200 bg-gray-50 py-3 pl-10 pr-4 text-sm text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-50"
                                        />
                                    </div>

                                    <ErrorMessage
                                        name="description"
                                        component="p"
                                        className="mt-1.5 text-xs text-red-500"
                                    />
                                </div>
                            </div>

                            {/* Footer */}
                            <div className="flex flex-col-reverse gap-3 border-t border-gray-100 bg-gray-50 px-5 py-4 sm:flex-row sm:justify-end sm:px-7">
                                <button
                                    type="button"
                                    onClick={onClose}
                                    disabled={submitting || isSubmitting}
                                    className="rounded-xl border border-gray-200 bg-white px-5 py-2.5 text-sm font-medium text-gray-700 transition hover:bg-gray-100 disabled:opacity-50"
                                >
                                    Cancel
                                </button>

                                <button
                                    type="submit"
                                    disabled={submitting || isSubmitting}
                                    className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
                                >
                                    {submitting || isSubmitting ? (
                                        <>
                                            <FiLoader
                                                className="animate-spin"
                                                size={17}
                                            />
                                            Creating...
                                        </>
                                    ) : (
                                        <>
                                            <FiPlus size={17} />
                                            Create Department
                                        </>
                                    )}
                                </button>
                            </div>
                        </Form>
                    )}
                </Formik>
            </div>
        </Modal>
    );
};

export default AddDepartment;