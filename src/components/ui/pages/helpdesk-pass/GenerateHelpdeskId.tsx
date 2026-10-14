"use client";
import { useState } from "react";
import { Formik, Form, FormikHelpers } from "formik";
import * as Yup from "yup";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import {
    FiArrowLeft,
    FiArrowRight,
    FiCheckCircle,
    FiKey,
    FiMail,
    FiRefreshCw,
    FiShield,
    FiUser,
} from "react-icons/fi";

import Button from "@/components/ui/shared/Button";
import InputField from "@/components/ui/shared/InputField";
import axios from "axios";
import { toast } from "react-toastify";

type GenerateStep = "details" | "otp" | "success";

interface StudentDetails {
    firstName: string;
    lastName: string;
    enrollmentNumber: string;
    email: string;
}

interface OtpValues {
    otp: string;
}

interface GenerateApiResponse {
    message?: string;
    challengeId?: string;
    verified?: boolean;
    helpdeskId?: string;
    alreadyExists?: boolean;
}

const detailsSchema = Yup.object({
    firstName: Yup.string()
        .min(2, "Too Short!")
        .max(50, "Too Long!")
        .required("First name is required"),
    lastName: Yup.string()
        .min(2, "Too Short!")
        .max(50, "Too Long!")
        .required("Last name is required"),
    enrollmentNumber: Yup.string()
        .trim()
        // .required("Enrollment number is required.")
        .max(50, "Enrollment number is too long."),
    email: Yup.string()
        .trim()
        .email("Enter a valid email address.")
        .required("Registered email address is required."),
});

const otpSchema = Yup.object({
    otp: Yup.string()
        .matches(/^\d{6}$/, "Enter the 6-digit OTP.")
        .required("OTP is required."),
});

const pageVariants = {
    hidden: { opacity: 0, y: 12 },
    visible: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -8 },
};

export default function GenerateHelpdeskIdPage() {
    const [step, setStep] = useState<GenerateStep>("details");
    const [challengeId, setChallengeId] = useState("");
    const [studentDetails, setStudentDetails] =
        useState<StudentDetails | null>(null);
    const [helpdeskId, setHelpdeskId] = useState("");
    const [alreadyExists, setAlreadyExists] = useState(false);
    const [successMessage, setSuccessMessage] = useState("");

    const startGeneration = async (
        values: StudentDetails,
        helpers: FormikHelpers<StudentDetails>
    ) => {
        setSuccessMessage("");

        const normalizedValues = {
            firstName: values.firstName.trim(),
            lastName: values.lastName.trim(),
            enrollmentNumber: values.enrollmentNumber.trim(),
            email: values.email.trim().toLowerCase(),
        };

        try {
            const response = await axios.post(
                "/api/v1/helpdesk/pass/generate/start",
                JSON.stringify(normalizedValues),
                {
                    headers: {
                        "Content-Type": "application/json",
                    },
                },
            );

            const data = response.data as GenerateApiResponse;

            setStudentDetails(normalizedValues);
            setChallengeId(data.challengeId || "");
            setSuccessMessage(
                data.message ||
                "If your details match an eligible college record, verification instructions will be sent to your registered contact."
            );
            setStep("otp");
        } catch {
            toast.error(
                "Unable to connect to the server. Please check your connection and try again."
            );
        } finally {
            helpers.setSubmitting(false);
        }
    };

    const confirmOtp = async (
        values: OtpValues,
        helpers: FormikHelpers<OtpValues>
    ) => {
        try {
            const response = await axios.post(
                "/api/v1/helpdesk/pass/generate/confirm",
                JSON.stringify({
                    challengeId,
                    otp: values.otp,
                }),
                {
                    headers: {
                        "Content-Type": "application/json",
                    },
                },
            );

            const data = response.data as GenerateApiResponse;

            // The backend may return an existing ID if the student
            // already has a profile. Never create a duplicate profile.
            if (!data.helpdeskId) {
                toast.error(
                    "Verification succeeded, but we couldn't retrieve your Helpdesk ID. Please contact the college helpdesk."
                );
                return;
            }

            setHelpdeskId(data.helpdeskId);
            setAlreadyExists(Boolean(data.alreadyExists));
            setStep("success");
        } catch {
            toast.error(
                "Unable to verify your OTP right now. Please try again."
            );
        } finally {
            helpers.setSubmitting(false);
        }
    };

    const resetForm = () => {
        setStep("details");
        setChallengeId("");
        setStudentDetails(null);
        setHelpdeskId("");
        setAlreadyExists(false);
        setSuccessMessage("");
    };

    return (
        <main className="min-h-screen px-4 py-10 sm:px-6 lg:py-16">
            <div className="mx-auto w-full max-w-xl">
                <Link
                    href="/raise-query/helpdesk-pass"
                    className="mb-8 inline-flex items-center gap-2 text-sm font-medium text-text-secondary transition hover:text-primary"
                >
                    <FiArrowLeft />
                    Back to Helpdesk ID options
                </Link>

                <motion.div
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.35 }}
                    className="overflow-hidden rounded-3xl border border-border bg-surface shadow-sm"
                >
                    <div className="border-b border-border bg-primary/5 px-6 py-7 sm:px-8">
                        <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                            <FiKey size={26} />
                        </div>

                        <p className="mb-2 text-sm font-semibold uppercase tracking-wider text-primary">
                            Student Helpdesk
                        </p>

                        <h1 className="text-2xl font-bold tracking-tight text-text-primary sm:text-3xl">
                            Request a new Helpdesk ID
                        </h1>

                        <p className="mt-3 max-w-md text-sm leading-6 text-text-secondary">
                            Verify your college identity to get your reusable Helpdesk ID
                            for submitting and tracking queries.
                        </p>

                        <div className="mt-6 flex items-center gap-2">
                            {(["details", "otp", "success"] as GenerateStep[]).map(
                                (item, index) => {
                                    const isActive = step === item;
                                    const isComplete =
                                        (step === "otp" && index === 0) ||
                                        (step === "success" && index < 2);

                                    return (
                                        <div key={item} className="flex flex-1 items-center gap-2">
                                            <div
                                                className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold ${isActive
                                                    ? "bg-primary text-white"
                                                    : isComplete
                                                        ? "bg-secondary text-white"
                                                        : "bg-border/70 text-text-secondary"
                                                    }`}
                                            >
                                                {isComplete ? <FiCheckCircle size={15} /> : index + 1}
                                            </div>

                                            <span
                                                className={`hidden text-xs font-medium sm:block ${isActive
                                                    ? "text-text-primary"
                                                    : "text-text-secondary"
                                                    }`}
                                            >
                                                {item === "details"
                                                    ? "Student details"
                                                    : item === "otp"
                                                        ? "Verify OTP"
                                                        : "Your ID"}
                                            </span>

                                            {index < 2 && (
                                                <div className="h-px flex-1 bg-border" />
                                            )}
                                        </div>
                                    );
                                }
                            )}
                        </div>
                    </div>

                    <div className="px-6 py-7 sm:px-8 sm:py-8">
                        <AnimatePresence mode="wait">
                            {step === "details" && (
                                <motion.div
                                    key="details"
                                    variants={pageVariants}
                                    initial="hidden"
                                    animate="visible"
                                    exit="exit"
                                    transition={{ duration: 0.2 }}
                                >
                                    <h2 className="text-lg font-bold text-text-primary">
                                        Verify your student details
                                    </h2>

                                    <p className="mt-2 text-sm leading-6 text-text-secondary">
                                        Enter the details associated with your official college
                                        record. We will use your registered contact to verify
                                        your identity.
                                    </p>

                                    <Formik<StudentDetails>
                                        initialValues={{
                                            firstName: "",
                                            lastName: "",
                                            enrollmentNumber: "",
                                            email: "",
                                        }}
                                        validationSchema={detailsSchema}
                                        onSubmit={startGeneration}
                                    >
                                        {({
                                            errors,
                                            touched,
                                            isSubmitting,
                                        }) => (
                                            <Form className="mt-6 space-y-5">
                                                <InputField
                                                    name="firstName"
                                                    label="First Name"
                                                    placeholder="Enter your first name"
                                                    icon={<FiUser size={17} />}
                                                    touched={touched.firstName}
                                                    error={errors.firstName}
                                                />

                                                <InputField
                                                    name="lastName"
                                                    label="Last Name"
                                                    placeholder="Enter your last name"
                                                    icon={<FiUser size={17} />}
                                                    touched={touched.lastName}
                                                    error={errors.lastName}
                                                />

                                                <InputField
                                                    name="email"
                                                    label="Registered Email Address"
                                                    type="email"
                                                    placeholder="Enter your college-registered email"
                                                    icon={<FiMail size={17} />}
                                                    touched={touched.email}
                                                    error={errors.email}
                                                />

                                                <InputField
                                                    name="enrollmentNumber"
                                                    label="Enrollment / Registration Number (Optional)"
                                                    placeholder="Enter your college enrollment number"
                                                    icon={<FiUser size={17} />}
                                                    touched={touched.enrollmentNumber}
                                                    error={errors.enrollmentNumber}
                                                />

                                                <div className="rounded-2xl border border-border bg-background/30 p-4">
                                                    <div className="flex items-start gap-3">
                                                        <FiShield
                                                            className="mt-0.5 shrink-0 text-primary"
                                                            size={19}
                                                        />
                                                        <div>
                                                            <p className="text-sm font-semibold text-text-primary">
                                                                One student, one Helpdesk ID
                                                            </p>
                                                            <p className="mt-1 text-xs leading-5 text-text-secondary">
                                                                If an ID has already been issued to you, the
                                                                system will help you retrieve it instead of
                                                                creating a duplicate.
                                                            </p>
                                                        </div>
                                                    </div>
                                                </div>

                                                <Button
                                                    type="submit"
                                                    size="lg"
                                                    className="w-full"
                                                    loading={isSubmitting}
                                                    loadingText="Checking details..."
                                                >
                                                    Continue to verification
                                                    <FiArrowRight className="ml-2 inline" />
                                                </Button>
                                            </Form>
                                        )}
                                    </Formik>

                                    <p className="mt-6 text-center text-sm text-text-secondary">
                                        Already have an ID or forgot it?{" "}
                                        <Link
                                            href="/raise-query/helpdesk-pass/recover"
                                            className="font-semibold text-primary hover:underline"
                                        >
                                            Recover my ID
                                        </Link>
                                    </p>
                                </motion.div>
                            )}

                            {step === "otp" && (
                                <motion.div
                                    key="otp"
                                    variants={pageVariants}
                                    initial="hidden"
                                    animate="visible"
                                    exit="exit"
                                    transition={{ duration: 0.2 }}
                                >
                                    <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                                        <FiMail size={23} />
                                    </div>

                                    <h2 className="text-lg font-bold text-text-primary">
                                        Verify your registered contact
                                    </h2>

                                    <p className="mt-2 text-sm leading-6 text-text-secondary">
                                        Enter the 6-digit OTP sent to your registered contact, if
                                        your college details are eligible for verification.
                                    </p>

                                    {successMessage && (
                                        <div className="mt-5 rounded-xl border border-border bg-background/50 px-4 py-3 text-sm leading-6 text-text-secondary">
                                            {successMessage}
                                        </div>
                                    )}

                                    <Formik<OtpValues>
                                        initialValues={{ otp: "" }}
                                        validationSchema={otpSchema}
                                        onSubmit={confirmOtp}
                                    >
                                        {({
                                            errors,
                                            touched,
                                            isSubmitting,
                                            setFieldValue,
                                        }) => (
                                            <Form className="mt-6 space-y-5">
                                                <InputField
                                                    name="otp"
                                                    label="6-digit OTP"
                                                    type="text"
                                                    placeholder="Enter OTP"
                                                    icon={<FiKey size={17} />}
                                                    touched={touched.otp}
                                                    error={errors.otp}
                                                />

                                                <Button
                                                    type="submit"
                                                    size="lg"
                                                    className="w-full"
                                                    loading={isSubmitting}
                                                    loadingText="Verifying..."
                                                >
                                                    Verify and continue
                                                    <FiArrowRight className="ml-2 inline" />
                                                </Button>

                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        setFieldValue("otp", "");
                                                    }}
                                                    className="mx-auto flex items-center gap-2 text-sm font-medium text-text-secondary transition hover:text-primary"
                                                >
                                                    <FiRefreshCw size={14} />
                                                    Clear OTP
                                                </button>
                                            </Form>
                                        )}
                                    </Formik>

                                    <button
                                        type="button"
                                        onClick={resetForm}
                                        className="mt-6 inline-flex items-center gap-2 text-sm font-medium text-text-secondary transition hover:text-primary"
                                    >
                                        <FiArrowLeft size={15} />
                                        Change student details
                                    </button>
                                </motion.div>
                            )}

                            {step === "success" && (
                                <motion.div
                                    key="success"
                                    variants={pageVariants}
                                    initial="hidden"
                                    animate="visible"
                                    exit="exit"
                                    transition={{ duration: 0.25 }}
                                    className="text-center"
                                >
                                    <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-secondary/10 text-secondary">
                                        <FiCheckCircle size={34} />
                                    </div>

                                    <h2 className="text-2xl font-bold text-text-primary">
                                        {alreadyExists
                                            ? "Your Helpdesk ID already exists"
                                            : "Your Helpdesk ID is ready"}
                                    </h2>

                                    <p className="mx-auto mt-3 max-w-sm text-sm leading-6 text-text-secondary">
                                        {alreadyExists
                                            ? "We found an existing Helpdesk ID linked to your verified college record. No duplicate ID was created."
                                            : "Your identity has been verified and your Helpdesk ID has been issued successfully."}
                                    </p>

                                    <div className="mt-7 rounded-2xl border border-border bg-background/30 p-5">
                                        <p className="text-xs font-semibold uppercase tracking-widest text-text-secondary">
                                            Your Helpdesk ID
                                        </p>

                                        <p className="mt-3 break-all font-mono text-2xl font-bold tracking-wider text-primary sm:text-3xl">
                                            {helpdeskId}
                                        </p>

                                        <p className="mt-3 text-xs leading-5 text-text-secondary">
                                            Keep this ID safe. You can reuse it whenever you raise
                                            a query with the college helpdesk.
                                        </p>

                                        <button
                                            type="button"
                                            onClick={() => {
                                                if (navigator.clipboard) {
                                                    navigator.clipboard.writeText(helpdeskId);
                                                    toast.success("Copied to clipboard!")
                                                }
                                            }}
                                            className="mt-4 text-sm font-semibold text-primary hover:underline"
                                        >
                                            Copy Helpdesk ID
                                        </button>
                                    </div>

                                    <div className="mt-6 space-y-3">
                                        <Button
                                            href="/raise-query"
                                            size="lg"
                                            className="w-full"
                                        >
                                            Continue to Raise a Query
                                            <FiArrowRight className="ml-2 inline" />
                                        </Button>

                                        <Link
                                            href="/"
                                            className="block py-2 text-sm font-medium text-text-secondary transition hover:text-primary"
                                        >
                                            Return to Home
                                        </Link>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                </motion.div>

                <p className="mx-auto mt-6 max-w-md text-center text-xs leading-5 text-text-secondary">
                    Your Helpdesk ID identifies your helpdesk profile. It is not a
                    password or proof of identity by itself.
                </p>
            </div>
        </main>
    );
}