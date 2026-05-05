import mongoose, { isValidObjectId } from "mongoose"
import { Tweet } from "../models/tweet.model.js"
import { User } from "../models/user.model.js"
import { ApiError } from "../utils/ApiError.js"
import { ApiResponse } from "../utils/ApiResponse.js"
import { asyncHandler } from "../utils/asyncHandler.js"

const createTweet = asyncHandler(async (req, res) => {
    //TODO: create tweet
    const { content } = req.body;
    const userId = req?.user._id;

    if (!content) {
        throw new ApiError(400, "Content is Required")
    }

    if (!userId) {
        throw new ApiError(400, "User must be logged In")
    }

    const tweet = await Tweet.create({
        content: content,
        owner: userId
    })

    return res
        .status(201)
        .json(
            new ApiResponse(
                201,
                tweet,
                "tweet created succesfully"
            )
        )
})

const getUserTweets = asyncHandler(async (req, res) => {
    // TODO: get user tweets
    const userId = req?.user._id;
    const { page = 1, limit = 10 } = req.query;

    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limit;



    if (!userId) {
        throw new ApiError(401, "User Id is required")
    }

    const tweets = await Tweet.find({ owner: userId })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum);

    return res
        .status(200)
        .json(new ApiResponse(200, tweets, "Tweets Fetched"))

})

const updateTweet = asyncHandler(async (req, res) => {
    //TODO: update tweet
    const { content } = req.body
    const { tweetId } = req.params;

    if (!tweetId) {
        throw new ApiError(400, "tweet id is required")
    }

    if (!content) {
        throw new ApiError(400, "new content is required")
    }

    const updatedTweet = await Tweet.findByIdAndUpdate(tweetId, { content: content }, {new: true})

    if (!updatedTweet) throw new ApiError(404, "tweet not found")

    return res
        .status(200)
        .json(new ApiResponse(200, updatedTweet, "Tweet Updated Successfully"))
})

const deleteTweet = asyncHandler(async (req, res) => {
    //TODO: delete tweet
    const {tweetId} = req.params

    if(!tweetId) throw new ApiError(400, "tweet id is required")

    const deletedTweet = await Tweet.findByIdAndDelete(tweetId)
    if(!deletedTweet){
        throw new ApiError(404, "Tweet not found ")
    }

    return res
    .status(200)
    .json(new ApiResponse(200, deletedTweet, "tweet deleted"))

})

export {
    createTweet,
    getUserTweets,
    updateTweet,
    deleteTweet
}