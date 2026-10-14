"use client";
import { useState } from "react";
import { Formik, Form, FormikHelpers } from "formik";
import * as Yup from "yup";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import {
    FiArrowLeft,
    FiArrowRight,
    FiShield,
    FiUser,
    FiMail,
    FiRefreshCw,
    FiCheckCircle,
    FiKey,
} from "react-icons/fi";

import Button from "../../shared/Button";
import InputField from "../../shared/InputField";
import axios from "axios";
import { toast } from "react-toastify";

type RecoveryStep = "details" | "otp" | "success";

interface RecoveryValues {
    enrollmentNumber: string;
    email: string;
}

interface OtpValues {
    otp: string;
}

interface RecoveryApiResponse {
    message?: string;
    challengeId?: string;
    helpdeskId?: string;
    verified?: boolean;
}

const recoverySchema = Yup.object({
    enrollmentNumber: Yup.string()
        .trim()
        .required("Enrollment number is required.")
        .max(50, "Enrollment number is too long."),
    email: Yup.string()
        .trim()
        .email("Enter a valid email address.")
        .required("Email address is required."),
});

const otpSchema = Yup.object({
    otp: Yup.string()
        .matches(/^\d{6}$/, "Enter the 6-digit verification code.")
        .required("Verification code is required."),
});

const initialRecoveryValues: RecoveryValues = {
    enrollmentNumber: "",
    email: "",
};

const initialOtpValues: OtpValues = {
    otp: "",
};

export default function RecoverHelpdeskId() {
    const [step, setStep] = useState<RecoveryStep>("details");
    const [challengeId, setChallengeId] = useState("");
    const [recoveredId, setRecoveredId] = useState("");
    const [notice, setNotice] = useState("");

    const startRecovery = async (
        values: RecoveryValues,
        helpers: FormikHelpers<RecoveryValues>
    ) => {
        setNotice("");
        try {
            const response = await axios.post(
                "/api/helpdesk/id/recover/start",
                JSON.stringify({
                    enrollmentNumber:
                        values.enrollmentNumber.trim(),
                    email: values.email.trim().toLowerCase(),
                }),
                {
                    headers: {
                        "Content-Type": "application/json",
                    },
                },
            );

            const data = response.data;

            setChallengeId(data.challengeId);
            setStep("otp");

            setNotice(
                data.message ||
                "If the details match an eligible student record, follow the verification instructions sent to the registered contact."
            );
        } catch (error) {
            toast.error(
                error instanceof Error
                    ? error.message
                    : "Something went wrong. Please try again."
            );
        } finally {
            helpers.setSubmitting(false);
        }
    };

    const confirmRecovery = async (
        values: OtpValues,
        helpers: FormikHelpers<OtpValues>
    ) => {
        setNotice("");
        try {
            const response = await axios.post(
                "/api/helpdesk/id/recover/confirm",
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

            const data = response.data;

            setRecoveredId(data.helpdeskId);
            setStep("success");
            setNotice("");
        } catch (error) {
            toast.error(
                error instanceof Error
                    ? error.message
                    : "Verification failed. Please try again."
            );
        } finally {
            helpers.setSubmitting(false);
        }
    };

    const resetRecovery = () => {
        setStep("details");
        setChallengeId("");
        setRecoveredId("");
        setNotice("");
    };

    return (
        <main className="relative flex min-h-screen items-center justify-center overflow-hidden px-4 py-12">
            <motion.section
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.35 }}
                aria-labelledby="recover-title"
                className="relative w-full max-w-md rounded-3xl border border-border bg-surface p-6 shadow-xl sm:p-8"
            >
                {/* Back navigation */}
                <Link
                    href="/raise-query/helpdesk-pass"
                    className="mb-8 inline-flex items-center gap-2 text-sm font-semibold text-text-secondary transition hover:text-primary"
                >
                    <FiArrowLeft size={17} />
                    Back to Helpdesk ID options
                </Link>

                {/* Header */}
                <div className="mb-7 text-center">
                    <motion.div
                        key={step}
                        initial={{ scale: 0.8 }}
                        animate={{ scale: 1 }}
                        transition={{
                            type: "spring",
                            stiffness: 220,
                            damping: 15,
                        }}
                        className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 text-primary"
                    >
                        {step === "details" && (
                            <FiUser size={30} />
                        )}

                        {step === "otp" && (
                            <FiShield size={30} />
                        )}

                        {step === "success" && (
                            <FiCheckCircle size={30} />
                        )}
                    </motion.div>

                    <p className="mb-2 text-xs font-bold uppercase tracking-[0.2em] text-primary">
                        College Helpdesk
                    </p>

                    <h1
                        id="recover-title"
                        className="text-2xl font-bold tracking-tight text-text-primary sm:text-3xl"
                    >
                        {step === "details" &&
                            "Recover your Helpdesk ID"}

                        {step === "otp" &&
                            "Verify your identity"}

                        {step === "success" &&
                            "Your ID is recovered"}
                    </h1>

                    <p className="mt-3 text-sm leading-6 text-text-secondary">
                        {step === "details" &&
                            "Enter your registered student details to find your existing Helpdesk ID."}

                        {step === "otp" &&
                            "Enter the verification code to securely retrieve your Helpdesk ID."}

                        {step === "success" &&
                            "Your existing Helpdesk ID has been recovered successfully."}
                    </p>
                </div>

                {/* Step indicator */}
                {step !== "success" && (
                    <div className="mb-7 flex items-center gap-3">
                        <div
                            className={`h-1.5 flex-1 rounded-full ${step === "details"
                                ? "bg-primary"
                                : "bg-secondary"
                                }`}
                        />

                        <div
                            className={`h-1.5 flex-1 rounded-full ${step === "otp"
                                ? "bg-primary"
                                : "bg-border"
                                }`}
                        />
                    </div>
                )}

                {/* API feedback */}
                <AnimatePresence mode="wait">
                    {notice && (
                        <motion.div
                            key="notice"
                            initial={{ opacity: 0, y: -6 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0 }}
                            role="status"
                            className="mb-5 rounded-xl border border-primary/20 bg-primary/5 px-4 py-3 text-sm leading-5 text-text-primary"
                        >
                            {notice}
                        </motion.div>
                    )}
                </AnimatePresence>

                <AnimatePresence mode="wait">
                    {/* STEP 1: Student details */}
                    {step === "details" && (
                        <motion.div
                            key="details"
                            initial={{ opacity: 0, x: -12 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: 12 }}
                            transition={{ duration: 0.2 }}
                        >
                            <Formik
                                initialValues={initialRecoveryValues}
                                validationSchema={recoverySchema}
                                onSubmit={startRecovery}
                            >
                                {({
                                    isSubmitting,
                                    touched,
                                    errors,
                                }) => (
                                    <Form className="space-y-5">
                                        <InputField
                                            name="enrollmentNumber"
                                            label="Enrollment number"
                                            placeholder="Enter your enrollment number"
                                            icon={
                                                <FiKey size={18} />
                                            }
                                            touched={
                                                touched.enrollmentNumber
                                            }
                                            error={
                                                errors.enrollmentNumber
                                            }
                                        />

                                        <InputField
                                            name="email"
                                            label="Registered email address"
                                            type="email"
                                            placeholder="Enter your college-registered email"
                                            icon={
                                                <FiMail size={18} />
                                            }
                                            touched={touched.email}
                                            error={errors.email}
                                        />

                                        <div className="w-full [&>div]:w-full">
                                            <Button
                                                type="submit"
                                                size="xl"
                                                loading={isSubmitting}
                                                loadingText={
                                                    <>
                                                        <FiRefreshCw
                                                            size={18}
                                                            className="mr-2 inline animate-spin"
                                                        />
                                                        Finding your ID...
                                                    </>
                                                }
                                                className="w-full"
                                            >
                                                <div className="flex items-center justify-center gap-2">
                                                    Find my Helpdesk ID
                                                    <FiArrowRight size={18} />
                                                </div>
                                            </Button>
                                        </div>
                                    </Form>
                                )}
                            </Formik>

                            <div className="mt-6 rounded-2xl border border-border bg-background/30 p-4">
                                <div className="flex items-start gap-3">
                                    <FiShield
                                        size={20}
                                        className="mt-0.5 shrink-0 text-primary"
                                    />

                                    <div>
                                        <p className="text-sm font-semibold text-text-primary">
                                            Your information is protected
                                        </p>

                                        <p className="mt-1 text-xs leading-5 text-text-secondary">
                                            Your ID will only be disclosed
                                            after successful verification.
                                            Use the contact details registered
                                            with your college.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    )}

                    {/* STEP 2: OTP */}
                    {step === "otp" && (
                        <motion.div
                            key="otp"
                            initial={{ opacity: 0, x: 12 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -12 }}
                            transition={{ duration: 0.2 }}
                        >
                            <Formik
                                initialValues={initialOtpValues}
                                validationSchema={otpSchema}
                                onSubmit={confirmRecovery}
                            >
                                {({
                                    isSubmitting,
                                    touched,
                                    errors,
                                }) => (
                                    <Form className="space-y-5">
                                        <InputField
                                            name="otp"
                                            label="6-digit verification code"
                                            placeholder="Enter your code"
                                            icon={
                                                <FiShield
                                                    size={18}
                                                />
                                            }
                                            touched={touched.otp}
                                            error={errors.otp}
                                        />

                                        <div className="w-full [&>div]:w-full">
                                            <Button
                                                type="submit"
                                                size="xl"
                                                loading={isSubmitting}
                                                loadingText="Verifying..."
                                                className="w-full"
                                            >
                                                <div className="flex items-center justify-center gap-2">
                                                    Verify & Recover ID
                                                    <FiArrowRight size={18} />
                                                </div>
                                            </Button>
                                        </div>
                                    </Form>
                                )}
                            </Formik>

                            <button
                                type="button"
                                onClick={resetRecovery}
                                className="mt-5 w-full"
                            >
                                <div className="flex items-center justify-center gap-2 text-sm font-semibold text-text-secondary transition hover:text-primary">
                                    <FiArrowLeft size={16} />
                                    Go back and change details
                                </div>
                            </button>
                        </motion.div>
                    )}

                    {/* STEP 3: Recovered ID */}
                    {step === "success" && (
                        <motion.div
                            key="success"
                            initial={{ opacity: 0, y: 12 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 0.25 }}
                            className="space-y-5"
                        >
                            <div className="rounded-2xl border border-secondary/30 bg-secondary/5 p-5 text-center">
                                <div className="mb-3 flex justify-center text-secondary">
                                    <FiCheckCircle size={32} />
                                </div>

                                <p className="text-sm font-medium text-text-secondary">
                                    Your Helpdesk ID
                                </p>

                                <p className="mt-3 break-all text-xl font-bold tracking-wide text-text-primary sm:text-2xl">
                                    {recoveredId}
                                </p>

                                <p className="mt-3 text-xs leading-5 text-text-secondary">
                                    Keep this ID safe. You can reuse it
                                    whenever you need to raise a query.
                                </p>
                            </div>

                            <div className="w-full [&>div]:w-full">
                                <Button
                                    href="/raise-query"
                                    size="xl"
                                    className="w-full"
                                >
                                    <div className="flex items-center justify-center gap-2">
                                        Continue to Raise Query
                                        <FiArrowRight size={18} />
                                    </div>
                                </Button>
                            </div>

                            <Link
                                href="/raise-query/helpdesk-pass"
                                className="w-full"
                            >
                                <div className="flex items-center justify-center gap-2 text-sm font-semibold text-text-secondary transition hover:text-primary">
                                    <FiArrowLeft size={16} />
                                    Back to Helpdesk ID options
                                </div>
                            </Link>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Footer */}
                {step !== "success" && (
                    <div className="mt-7 border-t border-border pt-5 text-center">
                        <p className="text-xs leading-5 text-text-secondary">
                            Never had a Helpdesk ID?{" "}
                            <Link
                                href="/raise-query/helpdesk-pass/generate"
                                className="font-semibold text-primary hover:underline"
                            >
                                Generate a new ID
                            </Link>
                        </p>
                    </div>
                )}
            </motion.section>
        </main>
    );
}