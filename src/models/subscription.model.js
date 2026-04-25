import mongoose, {Schema} from "mongoose";

const subscriptionSchema = new Schema({
    subscriber: {
        type: Schema.Types.ObjectId,    // one who is subscribing
        ref: "User"
    },

    channel: {
        type: Schema.Types.ObjectId,    // one to whom 'subscriber' is subscribing
        ref: "User"
    }
}, {timestamps: true})

export const Subscription = mongoose.model("Subscription", subscriptionSchema)


/* 

AGREEGATION PIPELINE MONGODB - connect with users

[
    {
        $lookup: {
            from: "authors",
            localField: "author_id",
            foreignField: "_id",
            as: "author_details"
        }
    },
    {
        $addFields: {
            author_details: {
                $first: "$author_details"
            }
        }
    }
]

*/