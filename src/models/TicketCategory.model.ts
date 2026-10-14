import mongoose from "mongoose";

export interface ITicketCategory {
    value: string;
    label: string;
};

const ticketCategorySchema = new mongoose.Schema<ITicketCategory>({
    value: {
        type: String,
        required: true,
        unique: true,
    },
    label: {
        type: String,
        required: true,
    },
}, { timestamps: true });

const TicketCategory = mongoose.models.TicketCategory || mongoose.model<ITicketCategory>("TicketCategory", ticketCategorySchema);
export default TicketCategory;