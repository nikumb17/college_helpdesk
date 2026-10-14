import mongoose from "mongoose";

const studentSchema = new mongoose.Schema({
    enrollmentNumber: {
        type: String,
        default: "",
        unique: true,
        index: true,
    },
    email: {
        type: String,
        required: true,
        unique: true,
        index: true,
    },
    firstName: {
        type: String,
        required: true,
    },
    lastName: {
        type: String,
        required: true,
    },
}, { timestamps: true });

const Student = mongoose.models.Student || mongoose.model("Student", studentSchema);
export default Student;