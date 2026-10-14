"use client";
import { useState } from "react";
import { Formik, Form, FormikHelpers } from "formik";
import * as Yup from "yup";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import {
    FiShield,
    FiArrowRight,
    FiArrowLeft,
    FiKey,
    FiHelpCircle,
    FiMail,
    FiRefreshCw,
} from "react-icons/fi";

import Button from "../../shared/Button";
import InputField from "../../shared/InputField";
import axios from "axios";
import { toast } from "react-toastify";
import { useRouter } from "next/navigation";

type VerificationStep = "helpdesk-id" | "otp";

interface HelpdeskIdValues {
    helpdeskId: string;
}

interface OtpValues {
    otp: string;
}

interface ApiResponse {
    message?: string;
    challengeId?: string;
    verified?: boolean;
}

const helpdeskIdSchema = Yup.object({
    helpdeskId: Yup.string()
        .trim()
        .uppercase()
        .matches(
            /^HDS-\d{2}-\d{6}$/,
            "Enter a valid Helpdesk Pass ID, e.g. HDS-26-008421."
        )
        .required("Helpdesk Pass ID is required."),
});

const otpSchema = Yup.object({
    otp: Yup.string()
        .matches(/^\d{6}$/, "Enter the 6-digit verification code.")
        .required("Verification code is required."),
});

const initialIdValues: HelpdeskIdValues = {
    helpdeskId: "",
};

const initialOtpValues: OtpValues = {
    otp: "",
};

const RaiseQueryPage = () => {
    const router = useRouter();

    const [step, setStep] =
        useState<VerificationStep>("helpdesk-id");

    const [challengeId, setChallengeId] = useState("");
    const [verifiedHelpdeskId, setVerifiedHelpdeskId] =
        useState("");

    const [notice, setNotice] = useState("");

    const startVerification = async (
        values: HelpdeskIdValues,
        helpers: FormikHelpers<HelpdeskIdValues>
    ) => {
        setNotice("");
        const helpdeskId = values.helpdeskId.trim().toUpperCase();

        try {
            const response = await axios.post(
                "/api/v1/helpdesk/verification/start",
                JSON.stringify({ helpdeskId }),
                {
                    headers: {
                        "Content-Type": "application/json",
                    },
                },
            );

            const data = response.data as ApiResponse;

            setVerifiedHelpdeskId(helpdeskId);
            setChallengeId(data.challengeId || "");
            setStep("otp");

            setNotice(
                data.message ||
                "If verification can be completed, follow the instructions sent to your registered contact."
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

    const confirmVerification = async (
        values: OtpValues,
        helpers: FormikHelpers<OtpValues>
    ) => {
        setNotice("");
        try {
            const response = await axios.post(
                "/api/v1/helpdesk/verification/confirm",
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

            const data = response.data as ApiResponse;

            // The backend must establish a protected,
            // short-lived verification session before
            // returning verified: true.
            router.push("/raise-query/details");
        } catch (error) {
            toast.error(
                error instanceof Error
                    ? error.message
                    : "Unable to verify your identity."
            );
        } finally {
            helpers.setSubmitting(false);
        }
    };

    const resetVerification = () => {
        setStep("helpdesk-id");
        setChallengeId("");
        setVerifiedHelpdeskId("");
        setNotice("");
    };

    return (
        <main className="relative flex min-h-screen items-center justify-center overflow-hidden px-4 py-12">
            <motion.section
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.35 }}
                aria-labelledby="verification-title"
                className="relative w-full max-w-md rounded-3xl border border-border bg-surface p-6 shadow-xl sm:p-8"
            >
                {/* Header */}
                <div className="mb-7 text-center">
                    <motion.div
                        initial={{ scale: 0.8 }}
                        animate={{ scale: 1 }}
                        transition={{
                            type: "spring",
                            stiffness: 220,
                            damping: 15,
                        }}
                        className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 text-primary"
                    >
                        {step === "helpdesk-id" ? (
                            <FiShield size={32} />
                        ) : (
                            <FiMail size={32} />
                        )}
                    </motion.div>
                    <p className="mb-2 text-xs font-bold uppercase tracking-[0.2em] text-primary">
                        College Helpdesk
                    </p>
                    <h1
                        id="verification-title"
                        className="text-2xl font-bold tracking-tight text-text-primary sm:text-3xl"
                    >
                        {step === "helpdesk-id"
                            ? "Verify your identity"
                            : "Confirm your identity"}
                    </h1>
                    <p className="mt-3 text-sm leading-6 text-text-secondary">
                        {step === "helpdesk-id"
                            ? "Enter your reusable Helpdesk Pass ID to continue raising a query."
                            : "Enter the verification code sent through your registered contact channel."}
                    </p>
                </div>

                {/* Step indicator */}
                <div className="mb-7 flex items-center gap-3">
                    <div
                        className={`h-1.5 flex-1 rounded-full ${step === "helpdesk-id"
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
                    {step === "helpdesk-id" ? (
                        <motion.div
                            key="helpdesk-id"
                            initial={{ opacity: 0, x: -12 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: 12 }}
                            transition={{ duration: 0.2 }}
                        >
                            <Formik
                                initialValues={initialIdValues}
                                validationSchema={helpdeskIdSchema}
                                onSubmit={startVerification}
                            >
                                {({
                                    isSubmitting,
                                    touched,
                                    errors,
                                }) => (
                                    <Form className="space-y-5">
                                        <InputField
                                            name="helpdeskId"
                                            label="Helpdesk Pass ID"
                                            placeholder="HDS-26-008421"
                                            icon={
                                                <FiKey size={18} />
                                            }
                                            touched={touched.helpdeskId}
                                            error={errors.helpdeskId}
                                        />

                                        <p className="-mt-2 text-xs leading-5 text-text-secondary">
                                            Your Helpdesk Pass ID identifies
                                            your existing student profile.
                                            You can reuse it for future
                                            queries.
                                        </p>

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
                                                        Starting verification...
                                                    </>
                                                }
                                                className="w-full"
                                            >
                                                <div className="flex w-full items-center justify-center flex-nowrap gap-2">
                                                    <span>Verify Helpdesk Pass ID</span>
                                                    <FiArrowRight size={18} />
                                                </div>
                                            </Button>
                                        </div>
                                    </Form>
                                )}
                            </Formik>

                            {/* Recovery link */}
                            <div className="my-7 flex items-center gap-3">
                                <div className="h-px flex-1 bg-border" />

                                <span className="text-xs font-medium text-text-secondary">
                                    NEED HELP?
                                </span>

                                <div className="h-px flex-1 bg-border" />
                            </div>

                            <div className="rounded-2xl border border-border bg-background/30 p-4 text-center">
                                <div className="mb-2 flex justify-center text-primary">
                                    <FiHelpCircle size={22} />
                                </div>

                                <p className="text-sm font-semibold text-text-primary">
                                    Forgot or don&apos;t have your Helpdesk Pass ID?
                                </p>

                                <p className="mt-1 text-xs leading-5 text-text-secondary">
                                    Recover your existing ID or get one
                                    issued after your identity is verified.
                                </p>

                                <Link
                                    href="/raise-query/helpdesk-pass"
                                    className="mt-4 inline-flex items-center gap-2 text-sm font-bold text-primary transition hover:opacity-80"
                                >
                                    Recover or generate ID
                                    <FiArrowRight size={16} />
                                </Link>
                            </div>
                        </motion.div>
                    ) : (
                        <motion.div
                            key="otp"
                            initial={{ opacity: 0, x: 12 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -12 }}
                            transition={{ duration: 0.2 }}
                        >
                            <div className="mb-5 rounded-xl bg-background/70 p-3">
                                <p className="text-xs text-text-secondary">
                                    Helpdesk Pass ID
                                </p>

                                <p className="mt-1 font-semibold tracking-wide text-text-primary">
                                    {verifiedHelpdeskId}
                                </p>
                            </div>

                            <Formik
                                initialValues={initialOtpValues}
                                validationSchema={otpSchema}
                                onSubmit={confirmVerification}
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
                                                <FiShield size={18} />
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
                                                <div className="flex w-full items-center justify-center gap-2">
                                                    Confirm & Continue
                                                    <FiArrowRight size={18} />
                                                </div>
                                            </Button>
                                        </div>
                                    </Form>
                                )}
                            </Formik>

                            <button
                                type="button"
                                onClick={resetVerification}
                                className="mt-5 w-full"
                            >
                                <div className="flex items-center justify-center gap-2 text-sm font-semibold text-text-secondary transition hover:text-primary">
                                    <FiArrowLeft size={16} />
                                    Change Helpdesk Pass ID
                                </div>
                            </button>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Footer */}
                <div className="mt-7 border-t border-border pt-5 text-center">
                    <p className="text-xs leading-5 text-text-secondary">
                        No separate helpdesk account is required.
                        Your information is handled securely by the
                        college helpdesk.
                    </p>
                </div>
            </motion.section>
        </main>
    );
};

export default RaiseQueryPage;