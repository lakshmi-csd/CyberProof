const mongoose = require("mongoose");

const scanSchema = new mongoose.Schema(
    {
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true
        },

        type: {
            type: String,
            required: true
        },

        input: {
            type: String,
            required: true
        },

        status: {
            type: String,
            required: true
        },

        action: {
            type: String,
            required: true
        },

        context: {
            type: String,
            default: "unknown"
        }
    },
    {
        timestamps: true
    }
);

module.exports = mongoose.model("Scan", scanSchema);