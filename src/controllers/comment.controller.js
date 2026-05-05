import mongoose from "mongoose"
import { Comment } from "../models/comment.model.js"
import { ApiError } from "../utils/ApiError.js"
import { ApiResponse } from "../utils/ApiResponse.js"
import { asyncHandler } from "../utils/asyncHandler.js"

const getVideoComments = asyncHandler(async (req, res) => {
    //TODO: get all comments for a video
    const { videoId } = req.params
    const { page = 1, limit = 10 } = req.query

    if (!videoId) throw new ApiError(400, "Video id is required")

    const pageNum = parseInt(page) || 1;
    const limitNum = parseInt(limit) || 10;
    const skip = (pageNum - 1) * limitNum;

    const allComments = await Comment.find({ video: videoId })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum)


    return res
        .status(200)
        .json(new ApiResponse(200, allComments, "comments fetched"))
})

const addComment = asyncHandler(async (req, res) => {
    // TODO: add a comment to a video
    const { content } = req.body
    const userId = req?.user._id
    const { videoId } = req.params;

    if (!content) throw new ApiError(400, "Content is required")
    if (!userId) throw new ApiError(401, "Unauthorized access")
    if (!videoId) throw new ApiError(400, "video id is missing")

    const comment = await Comment.create({
        content,
        video: videoId,
        owner: userId
    })

    if (!comment) throw new ApiError(400, "Internal error")

    return res
        .status(201)
        .json(new ApiResponse(201, comment, "comment created"))
})

const updateComment = asyncHandler(async (req, res) => {
    // TODO: update a comment
    const { content } = req.body
    const { commentId } = req.params;
    const userId = req?.user._id

    if (!content) throw new ApiError(400, "content is required to update")
    if (!commentId) throw new ApiError(400, "comment id missing")
    if (!userId) throw new ApiError(401, "user not logged in")

    const comment = await Comment.findById(commentId)

    if (!comment) throw new ApiError(404, "comment not found")

    if (comment.owner.toString() !== userId.toString()) throw new ApiError(403, "Unauthorized")

    const updatedComment = await Comment.findByIdAndUpdate(commentId, {
        content: content
    }, { new: true });

    if (!updatedComment) {
        throw new ApiError(404, "comment not found")
    }

    return res
        .status(200)
        .json(new ApiResponse(200, updatedComment, "comment updated"))

})

const deleteComment = asyncHandler(async (req, res) => {
    // TODO: delete a comment
    const { commentId } = req.params
    const userId = req.user?._id

    if (!commentId) throw new ApiError(400, "comment id required")

    const comment = await Comment.findById(commentId)

    if (!comment) {
        throw new ApiError(404, "comment not found");
    }

    if (comment.owner.toString() !== userId.toString()) throw new ApiError(403, "unauthorized")

    const deletedComment = await Comment.findByIdAndDelete(commentId);

    if (!deletedComment) throw new ApiError(404, "commment not found")

    return res
        .status(200)
        .json(new ApiResponse(200, deletedComment, "comment deleted"))
})

export {
    getVideoComments,
    addComment,
    updateComment,
    deleteComment
}