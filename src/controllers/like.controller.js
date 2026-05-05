import mongoose, { isValidObjectId } from "mongoose"
import { Like } from "../models/like.model.js"
import { ApiError } from "../utils/ApiError.js"
import { ApiResponse } from "../utils/ApiResponse.js"
import { asyncHandler } from "../utils/asyncHandler.js"
import { Video } from "../models/video.model.js"

const toggleVideoLike = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    const userId = req.user?._id
    //TODO: toggle like on video

    if (!videoId) throw new ApiError(400, "video id required")

    if (!userId) throw new ApiError(401, "Unauthorized");


    const like = await Like.findOne({
        video: videoId,
        likedBy: userId
    })

    if (like) {
        await Like.findOneAndDelete({
            video: videoId,
            likedBy: userId
        })

        return res
            .status(200)
            .json(new ApiResponse(200, null, "Video unliked"));
    }

    await Like.create({ video: videoId, likedBy: userId })

    return res
        .status(200)
        .json(new ApiResponse(200, null, "video liked"))
})

const toggleCommentLike = asyncHandler(async (req, res) => {
    const { commentId } = req.params
    //TODO: toggle like on comment

})

const toggleTweetLike = asyncHandler(async (req, res) => {
    const { tweetId } = req.params
    //TODO: toggle like on tweet
}
)

const getLikedVideos = asyncHandler(async (req, res) => {
    //TODO: get all liked videos
    const userId = req.user?._id

    if(!userId) throw new ApiError(401, "Anauthorized")

    const likes = await Like.find({
        likedBy: userId,
        video: {$ne: null}
    })

    const videoIds = likes.map(like => like.video)

    const videos = await Video.find({
        _id: {$in: videoIds}
    })

    return res
    .status(200)
    .json(new ApiResponse(200, videos, "liked video fetched"))
})

export {
    toggleCommentLike,
    toggleTweetLike,
    toggleVideoLike,
    getLikedVideos
}