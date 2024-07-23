const math = require('mathjs');

const getMatrix = (allFavorites) => {
    const userSet = new Set();
    const serviceSet = new Set();

    allFavorites.forEach(favorite => {
        userSet.add(favorite.user.username);
        serviceSet.add(favorite.service.serviceName);
    });

    const users = Array.from(userSet);
    const services = Array.from(serviceSet);

    const matrix = Array(users.length).fill(null).map(() => Array(services.length).fill(0));

    allFavorites.forEach(favorite => {
        const userIndex = users.indexOf(favorite.user.username);
        const serviceIndex = services.indexOf(favorite.service.serviceName);
        if (userIndex !== -1 && serviceIndex !== -1) {
            matrix[userIndex][serviceIndex] = 1;
        }
    });

    const cosineSimilarity = (vecA, vecB) => {
        const dotProduct = math.dot(vecA, vecB);
        const magnitudeA = math.sqrt(math.dot(vecA, vecA));
        const magnitudeB = math.sqrt(math.dot(vecB, vecB));
        return magnitudeA && magnitudeB ? dotProduct / (magnitudeA * magnitudeB) : 0;
    };

    const calculateCosineSimilarityMatrix = (matrix) => {
        if (matrix.length === 0 || matrix[0].length === 0) return [[]];

        const numServices = matrix[0].length;
        const cosineSimMatrix = Array(numServices).fill(null).map(() => Array(numServices).fill(0));

        for (let i = 0; i < numServices; i++) {
            for (let j = 0; j < numServices; j++) {
                cosineSimMatrix[i][j] = cosineSimilarity(matrix.map(row => row[i]), matrix.map(row => row[j]));
            }
        }
        return cosineSimMatrix;
    };

    const cosineSimMatrix = calculateCosineSimilarityMatrix(matrix);

    return { matrix, cosineSimMatrix, users, services };
};

const applyTimeDecay = (allReviews) => {
    const rateTime = {};
    const now = new Date();

    allReviews.forEach(review => {
        const ageInDays = (now - new Date(review.createdAt)) / (1000 * 60 * 60 * 24);
        const decayFactor = Math.max(1 - ageInDays / 2, 0); // Decay every 2 days
        const decayedRating = review.rating * decayFactor;

        if (!rateTime[review.serviceId]) {
            rateTime[review.serviceId] = [];
        }

        rateTime[review.serviceId].push({
            rating: review.rating,
            decayedRating: decayedRating,
            createdAt: review.createdAt,
            userId: review.userId
        });
    });

    return rateTime;
};

const calculateRecommendedServices = (allServices, userId, rateTime, cosineSimMatrix, services, userFavorites) => {
    const DEFAULT_WEIGHT = 2;
    const MAX_RATING_WEIGHT = 4;
    const FAVORITE_WEIGHT = 2.5;
    const SIMILARITY_WEIGHT = 2;

    const serviceScores = {};

    allServices.forEach(service => {
        serviceScores[service.id] = {
            ...service,
            score: DEFAULT_WEIGHT
        };

        if (rateTime[service.id]) {
            const userDecayedRatings = rateTime[service.id].filter(review => review.userId === userId);
            if (userDecayedRatings.length > 0) {
                const totalWeight = userDecayedRatings.reduce((acc, review) => {
                    const weight = (MAX_RATING_WEIGHT * review.decayedRating) / 5;
                    return acc + weight;
                }, 0);

                const averageWeight = totalWeight / userDecayedRatings.length;
                serviceScores[service.id].score += averageWeight;
            }
        }

        if (service.favoritedBy.some(fav => fav.userId === userId)) {
            serviceScores[service.id].score += FAVORITE_WEIGHT;
        }

        const serviceIndex = services.indexOf(service.serviceName);
        if (serviceIndex !== -1 && cosineSimMatrix.length > 0) {
            allServices.forEach(otherService => {
                const otherServiceIndex = services.indexOf(otherService.serviceName);
                if (otherServiceIndex !== -1 && serviceIndex !== otherServiceIndex) {
                    const similarity = cosineSimMatrix[serviceIndex][otherServiceIndex];
                    if (similarity > 0) {
                        serviceScores[service.id].score += similarity * SIMILARITY_WEIGHT;
                    }
                }
            });
        }
    });

    const recommendedServices = Object.values(serviceScores).sort((a, b) => b.score - a.score);

    recommendedServices.forEach(service => {
        if (service.image) {
            service.image = service.image.toString('base64');
        }
        service.averageRating = service.reviewsAndRatings.length > 0
            ? (service.reviewsAndRatings.reduce((acc, review) => acc + review.rating, 0) / service.reviewsAndRatings.length).toFixed(2)
            : 'No ratings yet';
    });

    return recommendedServices;
};

module.exports = {
    calculateRecommendedServices,
    applyTimeDecay,
    getMatrix
};
