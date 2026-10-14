import nodemailer from "nodemailer";

function formatDate(dateString: string): string {
    const date = new Date(dateString);

    return date.toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric",
    });
}

export interface SendMailOptions {
    type: string;
    otp?: string;
    name?: string;
    email?: string;
    subject?: string;
    emails?: string[];
    pass?: string;
    participationId?: string;
    teamId?: string;
    teamName?: string;
    eventName?: string;
    eventDate?: string;
    resetLink?: string;
    attachmentUrl?: string;
    registrationId?: string;
    gameName?: string;
    playerUid?: string;
    inGameName?: string;
    isLeader?: boolean;
    players?: {
        name: string;
        email: string;
        contactNo: string;
        inGameName: string;
        playerUid: string;
        device: string;
        isLeader: boolean;
        registrationId: string;
    }[];
    onmessage?: string;
    date?: string;
}

const sendMail = async ({ type, email, emails, otp, name, subject, pass, participationId, teamId, teamName, eventName, eventDate, resetLink, attachmentUrl, registrationId, gameName, playerUid, inGameName, isLeader, players, onmessage, date }: SendMailOptions) => {
    if (!emails) {
        if (!email) {
            return { mailInfo: null };
        }
    }
    // Create a Transporter to send emails
    let transporter = nodemailer.createTransport({
        service: 'gmail',
        host: process.env.MAIL_HOST,
        port: 587,
        auth: {
            user: process.env.MAIL_USER,
            pass: process.env.MAIL_PASS
        }
    })
    if (type === "code") {
        if (!email) {
            return { mailInfo: null };
        }

        const title = "Your Code For Identity Verification";
        const body = `
        <div style="font-family: Arial, Helvetica, sans-serif; background:#E6F9FA; padding:30px;">
        <div style="max-width:520px; margin:auto; background:#ffffff; border-radius:8px; padding:28px; text-align:center; border:1px solid #DCE3E8;">
            
            <h2 style="color:#0F172A; margin-bottom:10px;">
            Identity Verification
            </h2>

            <p style="font-size:16px; color:#475569;">
            Use the following One-Time Password (OTP) to continue:
            </p>

            <div style="
            margin:20px auto;
            padding:14px;
            border-radius:6px;
            background:#E6F9FA;
            border:1px dashed #2DE2E6;
            font-size:26px;
            font-weight:bold;
            color:#0FB9C1;
            letter-spacing:2px;
            width:fit-content;
            ">
            ${otp}
            </div>

            <p style="font-size:13px; color:#94A3B8;">
            This code is valid for 5 minutes. Do not share it with anyone.
            </p>

        </div>
        </div>
        `;

        const mailInfo = await transporter.sendMail({
            from: {
                name: "College Helpdesk",
                address: process.env.MAIL_USER as string,
            },
            to: email,
            subject: title,
            html: body,
        });
        return { mailInfo };
    }
    else {
        return null;
    }
};

export { sendMail };