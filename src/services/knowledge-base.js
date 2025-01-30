"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateArticleEmbedding = updateArticleEmbedding;
exports.updateAllEmbeddings = updateAllEmbeddings;
exports.findSimilarArticles = findSimilarArticles;
exports.incrementMetric = incrementMetric;
exports.getArticleMetrics = getArticleMetrics;
exports.suggestArticleImprovements = suggestArticleImprovements;
exports.suggestTags = suggestTags;
const openai_1 = require("@/utils/openai");
const vector_store_1 = require("@/utils/vector-store");
const knowledge_base_1 = require("@/app/actions/knowledge-base");
async function updateArticleEmbedding(articleId) {
    try {
        // Fetch the article
        const article = await (0, knowledge_base_1.findSimilarArticlesAction)(articleId, 1);
        if (!article.success || !article.articles) {
            throw new Error('Article not found');
        }
        // Sync the article to Pinecone
        const result = await (0, vector_store_1.syncKnowledgeBase)([{
                id: article.articles[0].id,
                title: article.articles[0].title,
                content: article.articles[0].content,
                category: article.articles[0].tags?.[0] || 'general',
                tags: article.articles[0].tags || [],
                created_at: article.articles[0].created_at,
                updated_at: article.articles[0].updated_at
            }]);
        if (!result.success) {
            throw new Error(result.message);
        }
    }
    catch (error) {
        console.error('Error updating article in vector store:', error);
        throw error;
    }
}
async function updateAllEmbeddings() {
    try {
        // Fetch all articles
        const articles = await (0, knowledge_base_1.findSimilarArticlesAction)('', 100);
        if (!articles.success || !articles.articles) {
            return;
        }
        // Sync all articles to Pinecone
        const result = await (0, vector_store_1.syncKnowledgeBase)(articles.articles.map(article => ({
            id: article.id,
            title: article.title,
            content: article.content,
            category: article.tags?.[0] || 'general',
            tags: article.tags || [],
            created_at: article.created_at,
            updated_at: article.updated_at
        })));
        if (!result.success) {
            throw new Error(result.message);
        }
    }
    catch (error) {
        console.error('Error syncing articles to vector store:', error);
        throw error;
    }
}
async function findSimilarArticles(text, limit = 3) {
    try {
        const result = await (0, knowledge_base_1.findSimilarArticlesAction)(text, limit);
        if (!result.success || !result.articles) {
            return [];
        }
        return result.articles.map(article => ({
            article: {
                id: article.id,
                title: article.title,
                content: article.content,
                tags: article.tags,
                status: 'published',
                created_by: 'system',
                created_at: article.created_at,
                updated_at: article.updated_at,
                view_count: 0,
                suggestion_count: 0,
                click_through_count: 0,
                resolution_count: 0,
                helpful_votes: 0,
                unhelpful_votes: 0
            },
            similarity: 1 // Pinecone already filters by threshold
        }));
    }
    catch (error) {
        console.error('Error finding similar articles:', error);
        throw error;
    }
}
async function incrementMetric(articleId, metric) {
    try {
        // This function is no longer used in the new implementation
    }
    catch (error) {
        console.error('Error incrementing metric:', error);
        throw error;
    }
}
async function getArticleMetrics(articleId) {
    try {
        // This function is no longer used in the new implementation
        throw new Error('Article metrics are no longer available');
    }
    catch (error) {
        console.error('Error getting article metrics:', error);
        throw error;
    }
}
async function suggestArticleImprovements(title, content) {
    try {
        const analysis = await (0, openai_1.analyzeArticleQuality)(content);
        const suggestions = analysis.split('\n').filter(line => line.trim().length > 0);
        return {
            clarity: 0.8, // These would be calculated based on the AI analysis
            completeness: 0.7,
            technicalAccuracy: 0.9,
            formatting: 0.8,
            suggestions
        };
    }
    catch (error) {
        console.error('Error analyzing article quality:', error);
        throw error;
    }
}
async function suggestTags(title, content) {
    try {
        return await (0, openai_1.generateTags)(title, content);
    }
    catch (error) {
        console.error('Error generating tags:', error);
        throw error;
    }
}
