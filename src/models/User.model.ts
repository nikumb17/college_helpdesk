import mongoose, { Model, Schema, Types } from "mongoose";
import bcryptjs from "bcryptjs";
import jwt, { Secret, SignOptions } from "jsonwebtoken";

export type UserRole = "ADMIN" | "DEP" | "STAFF";

export interface IUser {
    name: string;
    email: string;
    passwordHash: string;
    role: UserRole;
    departmentId?: Types.ObjectId | null;
    isActive: boolean;
    accessToken?: string | null;
    createdAt: Date;
    updatedAt: Date;
}

export interface IUserMethods {
    isValid(enteredPass: string): Promise<boolean>;
    generateAccessToken(): Promise<string>;
}

type UserModel = Model<IUser, {}, IUserMethods>;

const userSchema = new Schema<IUser, UserModel, IUserMethods>(
    {
        name: {
            type: String,
            required: true,
            trim: true,
            maxlength: 100,
        },
        email: {
            type: String,
            required: true,
            unique: true,
            lowercase: true,
            trim: true,
            maxlength: 254,
        },
        passwordHash: {
            type: String,
            required: true,
            select: false,
        },
        role: {
            type: String,
            enum: ["ADMIN", "DEP", "STAFF"],
            default: "STAFF",
            required: true,
        },
        departmentId: {
            type: Schema.Types.ObjectId,
            ref: "Department",
            default: null,
        },
        isActive: {
            type: Boolean,
            default: true,
        },
        accessToken: {
            type: String,
            default: null,
        },
    },
    {
        timestamps: true,
    }
);

// Hash passwords when a new password is assigned.
userSchema.pre("save", async function () {
    if (!this.isModified("passwordHash")) return;

    const salt = await bcryptjs.genSalt(10);
    this.passwordHash = await bcryptjs.hash(this.passwordHash, salt);
});

userSchema.methods.generateAccessToken = async function (): Promise<string> {
    const secret = process.env.ACCESS_TOKEN_KEY;
    const expiresIn = process.env.ACCESS_TOKEN_EXPIRY;

    if (!secret || !expiresIn) {
        throw new Error("JWT configuration is missing.");
    }

    return jwt.sign(
        {
            _id: this._id.toString(),
            role: this.role,
            email: this.email,
        },
        secret as Secret,
        {
            expiresIn: expiresIn as SignOptions["expiresIn"],
        }
    );
};

userSchema.methods.isValid = async function (
    enteredPass: string
): Promise<boolean> {
    return bcryptjs.compare(enteredPass, this.passwordHash);
};

const User =
    (mongoose.models.User as UserModel | undefined) ||
    mongoose.model<IUser, UserModel>("User", userSchema);

export default User;