"use client";
import React from "react";
import Link from "next/link";
import { motion } from "framer-motion";

const buttonHover = {
    scale: 1.03,
};

const buttonTap = {
    scale: 0.97,
};

type ButtonVariant = "primary" | "secondary" | "outline" | "danger";

type ButtonSize = "xs" | "sm" | "lg" | "xl" | "2xl" | "3xl";

type CommonProps = {
    children: React.ReactNode;
    variant?: ButtonVariant;
    size?: ButtonSize;
    loading?: boolean;
    loadingText?: React.ReactNode;
    disabled?: boolean;
    className?: string;
};

type LinkButtonProps = CommonProps & {
    href: string;
    type?: never;
    onClick?: never;
};

type NormalButtonProps = CommonProps &
    React.ButtonHTMLAttributes<HTMLButtonElement> & {
        href?: never;
    };

type ButtonProps = LinkButtonProps | NormalButtonProps;

const Button: React.FC<ButtonProps> = ({
    children,
    variant = "primary",
    size = "lg",
    loading = false,
    loadingText = "Loading...",
    disabled = false,
    className = "",
    ...props
}) => {
    const baseStyles =
        "inline-block cursor-pointer font-bold rounded-xl transition";

    const variantStyles: Record<ButtonVariant, string> = {
        primary:
            "bg-linear-to-br from-primary/60 to-secondary text-white shadow-md hover:shadow-xl",

        secondary:
            "bg-primary text-white hover:bg-primary-hover",

        outline:
            "border-2 border-primary text-primary hover:bg-primary hover:text-white",

        danger:
            "bg-red-400 text-white font-semibold hover:bg-red-600 hover:shadow-2xl",
    };

    const sizeStyles: Record<ButtonSize, string> = {
        "xs": "px-3 py-1.5 text-xs rounded-lg",
        "sm": "px-4 py-2 text-sm rounded-lg",
        "lg": "px-6 py-2.5 text-base rounded-xl",
        "xl": "px-8 py-3 text-lg rounded-xl",
        "2xl": "px-10 py-3.5 text-xl rounded-xl",
        "3xl": "px-12 py-4 text-2xl rounded-2xl",
    };

    const disabledStyles =
        disabled || loading
            ? "opacity-60 cursor-not-allowed pointer-events-none"
            : "";

    const buttonClassName = `
        ${baseStyles}
        ${variantStyles[variant]}
        ${sizeStyles[size]}
        ${disabledStyles}
        ${className}
    `.trim();

    const content = loading ? loadingText : children;

    /*
     * Link Button
     */
    if ("href" in props && props.href) {
        return (
            <motion.div
                whileHover={
                    !disabled && !loading
                        ? buttonHover
                        : undefined
                }
                whileTap={
                    !disabled && !loading
                        ? buttonTap
                        : undefined
                }
                className="inline-block"
            >
                <Link
                    href={props.href}
                    className={buttonClassName}
                >
                    {content}
                </Link>
            </motion.div>
        );
    }

    /*
     * Normal / Submit / Danger Button
     */
    return (
        <motion.div
            whileHover={
                !disabled && !loading
                    ? buttonHover
                    : undefined
            }
            whileTap={
                !disabled && !loading
                    ? buttonTap
                    : undefined
            }
            className="inline-block"
        >
            <button
                {...props}
                disabled={disabled || loading}
                className={buttonClassName}
            >
                {content}
            </button>
        </motion.div>
    );
};

export default Button;