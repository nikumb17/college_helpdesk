import mongoose from "mongoose";
import dns from "node:dns/promises";

async function connectDb() {
    try {
        const isConnected = mongoose.connection.readyState;

        if (isConnected !== 1) {
            await dns.setServers(["1.1.1.1", "8.8.8.8"]);
            await mongoose.connect(process.env.MONGO_URI as string);

            const connection = mongoose.connection;

            connection.on("connected", () => {
                console.log("Connected to MongoDB host: " + connection.host + " on port: " + connection.port + " with database: " + connection.name);
            });

            connection.on("disconnected", () => {
                console.log("Disconnected from MongoDB");
            });

            connection.on("error", (error) => {
                throw error;
            });
        }
        else {
            // console.log("============Already connected to MongoDB=============");
            return mongoose.connection;
        }
    } catch (error: any) {
        console.log("Error while connecting to MongoDB: " + error);
    }
}

export default connectDb;