const applyTimeDecay = (allReviews) => {
    const rateTime = {};
    const now = new Date();

    allReviews.forEach(review => {
        const ageInDays = (now - new Date(review.createdAt)) / (1000 * 60 * 60 * 24);
        const decayFactor = Math.max(1 - ageInDays / 2, 0); // Decay every hour
        const decayedRating = review.rating * decayFactor;

        if (!rateTime[review.serviceId]) {
            rateTime[review.serviceId] = [];
        }

        rateTime[review.serviceId].push({
            rating: review.rating,
            decayedRating: decayedRating,
            createdAt: review.createdAt
        });
    });

    console.log(rateTime)
    return rateTime;
};

const calculateRecommendedServices = (allServices, userId, rateTime) => {
    // Assign weights
    const DEFAULT_WEIGHT = 1;
    const RATING_WEIGHT_4_5 = 3;
    const FAVORITE_WEIGHT = 2;

    // Calculate scores based on weights
    const serviceScores = {};

    allServices.forEach(service => {
        serviceScores[service.id] = {
            ...service,
            score: DEFAULT_WEIGHT
        };

        // Add weight for favorited services
        if (service.favoritedBy.some(fav => fav.userId === userId)) {
            serviceScores[service.id].score += FAVORITE_WEIGHT;
        }

        // Add weight for highly rated services
        const userReview = service.reviewsAndRatings.find(review => review.userId === userId);
        if (userReview && userReview.rating >= 4) {
            serviceScores[service.id].score += RATING_WEIGHT_4_5;
        }

        // Incorporate decayed ratings into the score
        if (rateTime[service.id]) {
            const averageDecayedRating = rateTime[service.id].reduce((acc, review) => acc + review.decayedRating, 0) / rateTime[service.id].length;
            serviceScores[service.id].score += averageDecayedRating;
        }
    });

    // Convert scores object to array and sort by score
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
};
