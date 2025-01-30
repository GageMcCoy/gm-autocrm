"use strict";
'use server';
Object.defineProperty(exports, "__esModule", { value: true });
exports.findSimilarArticlesAction = findSimilarArticlesAction;
const vector_store_1 = require("@/utils/vector-store");
async function findSimilarArticlesAction(text, limit = 3) {
    try {
        const articles = await (0, vector_store_1.searchSimilarArticles)(text, limit);
        return {
            success: true,
            articles
        };
    }
    catch (error) {
        console.error('Error finding similar articles:', error);
        return {
            success: false,
            message: error instanceof Error ? error.message : 'Unknown error occurred'
        };
    }
}
