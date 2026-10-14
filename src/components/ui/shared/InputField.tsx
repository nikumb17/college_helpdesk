import React from "react";
import { Field } from "formik";

interface InputFieldProps {
    name: string;
    label: string;
    placeholder?: string;
    type?: string;
    icon?: React.ReactNode;
    touched?: boolean;
    error?: string;
    readonly?: boolean;
}

const InputField = ({
    name,
    label,
    placeholder,
    type = "text",
    icon,
    touched,
    error,
    readonly = false,
}: InputFieldProps) => {
    return (
        <div className="space-y-2">
            <label
                htmlFor={name}
                className="text-sm font-semibold text-text-primary"
            >
                {label}
            </label>

            <div className="relative">
                {icon && (
                    <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-text-secondary">
                        {icon}
                    </span>
                )}

                <Field
                    id={name}
                    name={name}
                    type={type}
                    placeholder={placeholder}
                    className={`w-full rounded-2xl border bg-background/30 px-4 py-3.5 text-sm font-medium text-text-primary outline-none transition placeholder:text-text-secondary/60 ${icon ? "pl-11" : ""
                        } ${touched && error
                            ? "border-red-500 focus:border-red-500"
                            : "border-border focus:border-primary"
                        }`}
                    readOnly={readonly}
                />
            </div>

            {touched && error && (
                <p className="text-xs font-medium text-red-500">
                    {error}
                </p>
            )}
        </div>
    );
};

export default InputField;