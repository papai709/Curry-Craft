import mongoose from "mongoose"
import { Recipe } from "../models/recipe.model.js" // Fixed: Changed Video to Recipe
import { Subscription } from "../models/subscription.model.js"
import { Like } from "../models/like.model.js"
import { ApiError } from "../utils/ApiError.js"
import { ApiResponse } from "../utils/ApiResponse.js"
import { asyncHandler } from "../utils/asyncHandler.js"

const getChannelStats = asyncHandler(async (req, res) => {
    // We use the logged-in user's ID to fetch their specific dashboard stats
    const userId = req.user._id;

    // 1. Get Total Subscribers
    const totalSubscribers = await Subscription.countDocuments({
        channel: userId
    });

    // 2. Get Total Videos and Total Views in one pass using aggregation
    const videoStats = await Recipe.aggregate([
        {
            $match: {
                owner: new mongoose.Types.ObjectId(userId)
            }
        },
        {
            $group: {
                _id: null,
                totalVideos: { $sum: 1 },
                totalViews: { $sum: "$views" } // Assuming 'views' is a number field in your Recipe model
            }
        }
    ]);

    // 3. Get Total Likes across all videos uploaded by this user
    const likeStats = await Like.aggregate([
        {
            // Join the recipes collection to see who owns the liked video
            $lookup: {
                from: "recipes",
                localField: "video",
                foreignField: "_id",
                as: "recipeDetails"
            }
        },
        {
            $unwind: "$recipeDetails"
        },
        {
            // Only count likes where the logged-in user is the owner of that recipe
            $match: {
                "recipeDetails.owner": new mongoose.Types.ObjectId(userId)
            }
        },
        {
            $group: {
                _id: null,
                totalLikes: { $sum: 1 }
            }
        }
    ]);

    // Structure the final stats object
    const stats = {
        totalSubscribers,
        totalVideos: videoStats[0]?.totalVideos || 0,
        totalViews: videoStats[0]?.totalViews || 0,
        totalLikes: likeStats[0]?.totalLikes || 0
    };

    return res
        .status(200)
        .json(new ApiResponse(200, stats, "Channel stats fetched successfully"));
})

const getChannelVideos = asyncHandler(async (req, res) => {
    // Fetch all recipes uploaded by the currently logged-in user
    const userId = req.user._id;

    const videos = await Recipe.find({ owner: userId })
        .sort({ createdAt: -1 }); // Sort by newest first

    if (!videos) {
        throw new ApiError(500, "Failed to fetch channel videos");
    }

    return res
        .status(200)
        .json(new ApiResponse(200, videos, "Channel videos fetched successfully"));
})

export {
    getChannelStats,
    getChannelVideos
}