"use client"
import React, { useState } from "react";
import {
    FaLockOpen,
    FaLock,
    FaGoogle,
    FaFacebook,
    FaGithub,
    FaLinkedin,
    FaEye,
    FaEyeSlash,
} from "react-icons/fa";
import { Formik } from 'formik';
import * as Yup from 'yup';
import axios from "axios";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "react-toastify";
import InputField from "@/components/ui/shared/InputField";
import { FiMail } from "react-icons/fi";
import Button from "@/components/ui/shared/Button";

const loginSchema = Yup.object().shape({
    email: Yup.string().email('Invalid email').required('Email should be required'),
    password: Yup.string()
        .min(3, "Password should be min of 3 characters!")
        .max(16, "Password should be max of 16 characters long !")
        .required("Password should be required!"),
});

const Login = () => {
    const router = useRouter();
    const [visible, setVisible] = useState<boolean>(false);

    return (
        <div className="w-full lg:w-1/2 transition-all duration-500">
            <Formik
                initialValues={{ email: '', password: '' }}
                validationSchema={loginSchema}
                onSubmit={async (values, { setSubmitting }) => {
                    try {
                        setSubmitting(true);
                        const response = await axios.post(
                            "/api/v1/helpdesk/auth/login",
                            JSON.stringify(values),
                            {
                                headers: {
                                    "Content-Type": "application/json",
                                },
                            },
                        );
                        toast.success(response.data?.message || "Success!");
                        const role = response.data?.role;
                        router.push(role === "ADMIN" ? "/community/admin" : role === "DEP" ? "/community/department" : "/community/staff");
                        // router.push(response.data?.role === "ADMIN" ? "/community/admin" : );
                    } catch (error: any) {
                        console.error("Error: " + (error.response?.data?.message || error.message));
                        toast.error(error.response?.data?.message || error.message);
                    } finally {
                        setSubmitting(false);
                    }
                }}
            >
                {({
                    values,
                    touched,
                    errors,
                    handleChange,
                    handleSubmit,
                    isSubmitting,
                    /* and other goodies */
                }) => (
                    <form onSubmit={handleSubmit} className="flex flex-col w-4/5 mx-auto lg:w-2/3 h-full justify-center">
                        <div className='space-y-2 mb-20 text-center'>
                            <h1 className='text-center text-xl md:text-2xl text-primary font-bold'>Login !</h1>
                            <p className='text-center text-text-primary text-xs md:text-sm'>Fill in your credentials below carefully!</p>
                        </div>
                        <div className="space-y-10">
                            <InputField
                                name="email"
                                label="Registered Email Address"
                                type="email"
                                placeholder="Enter your college-registered email"
                                icon={<FiMail size={17} />}
                                touched={touched.email}
                                error={errors.email}
                            />
                            <div className='flex flex-col relative w-full'>
                                <span onClick={() => setVisible(!visible)} className='absolute top-0 lg:top-10 right-5 z-20 cursor-pointer hover:text-primary-glow transition'>
                                    {!visible ? (
                                        <FaLock size={17} />
                                    ) : (
                                        <FaLockOpen size={17} />
                                    )}
                                </span>
                                <InputField
                                    name="password"
                                    label="Your Password"
                                    type={visible ? "text" : "password"}
                                    placeholder="Enter your password"
                                    icon={<FaLock size={17} />}
                                    touched={touched.password}
                                    error={errors.password}
                                />
                            </div>
                        </div>
                        <div className="flex items-center justify-center gap-2 text-sm mb-5">
                            <span>Forget your password?</span>
                            <div className="flex items-center justify-center mt-2">
                                <Link href="/forgot-pass" className="mb-2 underline hover:text-text-primary">
                                    Change
                                </Link>
                            </div>
                        </div>
                        <div className="flex items-center justify-center">
                            <Button
                                type="submit"
                            >
                                {isSubmitting ? (
                                    <span className="flex space-x-1 py-1.5 justify-center">
                                        <span className="size-3 bg-white rounded-full animate-bounce [animation-delay:-0.3s]"></span>
                                        <span className="size-3 bg-white rounded-full animate-bounce [animation-delay:-0.15s]"></span>
                                        <span className="size-3 bg-white rounded-full animate-bounce"></span>
                                    </span>
                                ) : (
                                    "Login"
                                )}
                            </Button>
                        </div>
                        {/* <span className="text-sm mt-3">or use your social account</span>
                        <div className="flex justify-center gap-3 mt-4">
                            <a className="border p-2 rounded-full hover:bg-primary hover:border-primary cursor-pointer hover:text-text-primary transition">
                                <FaGoogle size={20} />
                            </a>
                            <a className="border p-2 rounded-full hover:bg-primary hover:border-primary cursor-pointer hover:text-text-primary transition">
                                <FaFacebook size={20} />
                            </a>
                            <a className="border p-2 rounded-full hover:bg-primary hover:border-primary cursor-pointer hover:text-text-primary transition">
                                <FaGithub size={20} />
                            </a>
                            <a className="border p-2 rounded-full hover:bg-primary hover:border-primary cursor-pointer hover:text-text-primary transition">
                                <FaLinkedin size={20} />
                            </a>
                        </div> */}
                    </form>
                )}
            </Formik>
        </div>
    )
}

export default Login