import mongoose, { isValidObjectId } from "mongoose"
import { Video } from "../models/video.model.js"
import { User } from "../models/user.model.js"
import { ApiError } from "../utils/ApiError.js"
import { ApiResponse } from "../utils/ApiResponse.js"
import { asyncHandler } from "../utils/asyncHandler.js"
import { uploadOnCloudinary } from "../utils/cloudinary.js"
import getPublicIdFromUrl from "../utils/getPublicID.js"
import { v2 as cloudinary } from 'cloudinary';

const getAllVideos = asyncHandler(async (req, res) => {
    let { page = 1, limit = 10, query, sortBy = "createdAt", sortType = "desc", username } = req.query;
    //TODO: get all videos based on query, sort, pagination

    // Convert to Numbers
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    // Build filter object
    const filter = {};

    if (username) {
        const user = await User.findOne({ username });

        if (!user) {
            return res.status(404).json(
                new ApiResponse(404, [], "User not found")
            );
        }

        filter.owner = user?._id;
    }

    if (query) {
        filter.title = { $regex: query, $options: 'i' }
    }

    const sortOption = {
        [sortBy]: sortType === 'asc' ? 1 : -1
    }

    const videos = await Video.find(filter).sort(sortOption).skip(skip).limit(limitNum);
    console.log(videos)

    return res
        .status(200)
        .json(new ApiResponse(
            200,
            videos,
            "videos fetched successfully"
        ))
})

const publishAVideo = asyncHandler(async (req, res) => {
    const { title, description } = req.body
    // TODO: get video, upload to cloudinary, create video

    if (!req.user) {
        throw new ApiError(401, "Unauthorized request");
    }

    if (!title || !description) {
        throw new ApiError(400, "Title and Description Missing.")
    }


    // Safe file access
    const videoLocalPath = req.files?.videoFile?.[0]?.path;
    const thumbnailLocalPath = req.files?.thumbnail?.[0]?.path;

    if (!videoLocalPath) {
        throw new ApiError(400, "Video file is required");
    }

    if (!thumbnailLocalPath) {
        throw new ApiError(400, "Thumbnail file is required");
    }

    // Upload video first
    const videoUpload = await uploadOnCloudinary(videoLocalPath);

    if (!videoUpload) {
        throw new ApiError(500, "Video upload failed");
    }

    // Upload thumbnail
    const thumbnailUpload = await uploadOnCloudinary(thumbnailLocalPath);
    if (!thumbnailUpload) {
        throw new ApiError(500, "Thumbnail upload failed");
    }


    // Create DB entry
    const videoData = await Video.create({
        videoFile: videoUpload.url,
        thumbnail: thumbnailUpload.url,
        title,
        description,
        duration: videoUpload.duration || 0,
        owner: req.user._id
    })

    return res
        .status(201)
        .json(
            new ApiResponse(
                201,
                videoData,
                "Video Uploaded Successfully"
            )
        )
})

const getVideoById = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    //TODO: get video by id

    if (!videoId) {
        throw new ApiError(400, "video id not found")
    }

    const video = await Video.findById(videoId);

    if (!video) {
        throw new ApiError(404, "video not found")
    }

    return res
        .status(200)
        .json(new ApiResponse(200, video, "video fetched successfully"))
})

const updateVideo = asyncHandler(async (req, res) => {
    //TODO: update video details like title, description, thumbnail
    /*
    1. check videoID
    2. take data to be updated
    3. validate data
    4. find Video
    5. update video
    */

    const { videoId } = req.params
    const { title, description } = req.body;
    const thumbnailLocalPath = req.file?.path;

    if (!videoId) {
        throw new ApiError(400, "Video id missing")
    }

    if (!title && !description && !thumbnailLocalPath) {
        throw new ApiError(400, "new values not found")
    }

    const updateData = {}

    if (title) updateData.title = title;
    if (description) updateData.description = description;

    if (thumbnailLocalPath) {
        const upload = await uploadOnCloudinary(thumbnailLocalPath);

        if (!upload) {
            throw new ApiError(500, "thumbnail upload failed")
        }

        updateData.thumbnail = upload.url;
    }

    const existingVideo = await Video.findById(videoId);

    if (!existingVideo) {
        throw new ApiError(404, "Video not found")
    }


    const video = await Video.findByIdAndUpdate(videoId, {
        $set: updateData

    }, { returnDocument: "after" })


    if (!video) {
        throw new ApiError(404, "Video not updated")
    }

    if (updateData?.thumbnail && existingVideo?.thumbnail) {

        try {
            const publicId = getPublicIdFromUrl(existingVideo.thumbnail);
            console.log("old url: ", existingVideo.thumbnail);

            console.log(publicId);
            await cloudinary.uploader.destroy(publicId);
        } catch (err) {
            console.error("Cloudinary delete failed:", err.message);
        }
    }

    return res
        .status(200)
        .json(new ApiResponse(
            200,
            video,
            "video updated successfully"
        ))

})

const deleteVideo = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    //TODO: delete video

    if (!videoId) {
        throw new ApiError(400, "video id missing")
    }

    const oldVideo = await Video.findById(videoId)

    if (!oldVideo) {
        throw new ApiError(404, "Video not found")
    }

    const deletedVideo = await Video.findByIdAndDelete(videoId)

    if (!deletedVideo) {
        throw new ApiError(500, "Video deletion failed")
    }

    try {

        if (oldVideo.videoFile) {
            const videoPublicId = getPublicIdFromUrl(oldVideo.videoFile)
            await cloudinary.uploader.destroy(videoPublicId, {
                resource_type: "video"
            })
        }

        if (oldVideo.thumbnail) {
            const thumbnailPublicId = getPublicIdFromUrl(oldVideo.thumbnail)
            await cloudinary.uploader.destroy(thumbnailPublicId, {
                resource_type: "image"
            })
        }
    } catch (error) {
        console.error("Cloudinary delete failed:", error.message);
    }


    return res
        .status(200)
        .json(
            new ApiResponse(200, deletedVideo, "Video Deleted successfully")
        )

})

const togglePublishStatus = asyncHandler(async (req, res) => {
    const { videoId } = req.params

    if(!videoId){
        throw new ApiError(400, "video id required")
    }

    const video = await Video.findById(videoId);
    if(!video){
        throw new ApiError(404, "video not found")
    }

    const updatedVideo = await Video.findByIdAndUpdate(videoId, {
        isPublished: !video.isPublished
    }, {returnDocument: "after"});

    if(!updatedVideo){
        throw new ApiError(500, "Internal error")
    }

    const message = updatedVideo.isPublished
    ? "Video published"
    : "Video unpublished";
    return res.status(200).json(new ApiResponse(200, updatedVideo, message))
})

export {
    getAllVideos,
    publishAVideo,
    getVideoById,
    updateVideo,
    deleteVideo,
    togglePublishStatus
}