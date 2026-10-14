import mongoose, { Schema, Model } from "mongoose";
import { generatePublicId } from "../utils/generatePublicId";

export interface IDepartment {
    departmentId: string;
    name: string;
    code: string;
    description?: string;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
}

const departmentSchema = new Schema<IDepartment>({
    departmentId: {
        type: String,
        required: true,
        unique: true,
        default: () => generatePublicId("HDC"),
    },

    name: {
        type: String,
        required: true,
        trim: true,
        maxlength: 100,
    },

    code: {
        type: String,
        required: true,
        uppercase: true,
        trim: true,
        unique: true,
    },

    description: {
        type: String,
        trim: true,
        maxlength: 500,
    },

    isActive: {
        type: Boolean,
        default: true,
    },
}, { timestamps: true });

const Department: Model<IDepartment> = mongoose.models.Department || mongoose.model<IDepartment>(
    "Department",
    departmentSchema
);
export default Department;