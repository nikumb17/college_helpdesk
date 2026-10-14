"use client"
import axios from 'axios';
import { useRouter } from 'next/navigation';
import React, { useCallback, useState } from 'react'
import { MdLogout } from 'react-icons/md';
import { toast } from 'react-toastify';

const Logout = () => {
    const router = useRouter();
    const [processing, setProcessing] = useState(false);

    const logout = useCallback(async () => {
        try {
            setProcessing(true);
            const response = await axios.get("/api/v1/helpdesk/auth/logout");
            toast.success(response.data?.message || "Logout Successful !");
            router.push("/");
        } catch (error: any) {
            console.error("Error: " + (error.response?.data?.message || error.message));
            toast.error("Error: " + (error.response?.data?.message || error.message));
        } finally {
            setProcessing(false);
        }
    }, []);

    return (
        <div onClick={logout} className={`hover:text-primary transition-colors duration-150 ${processing ? "cursor-not-allowed text-primary" : "cursor-pointer"}`}>
            <MdLogout size={22} />
        </div>
    )
}

export default Logout