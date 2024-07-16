const applyTimeDecay = (ratings) => {
    const now = new Date();
    return ratings.map(rating => {
        const ageInDays = (now - new Date(rating.createdAt)) / (1000 * 60 * 60 * 24);
        const decayFactor = Math.max(1 - ageInDays / 0.08, 0); // Linear decay every hour
        return rating.rating * decayFactor;
    });
};

const calculateRecommendedServices = (allServices, userId) => {
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
        if (service.favoritedBy.some(fav => fav.id === userId)) {
            console.log(`Service ${service.id} is favorited by user ${userId}`);
            serviceScores[service.id].score += FAVORITE_WEIGHT;
        }

        // Apply time decay to ratings
        const decayedRatings = applyTimeDecay(service.reviewsAndRatings);

     // Add weight for highly rated services based on decayed ratings
        const userReview = decayedRatings.find((rating, index) => service.reviewsAndRatings[index].userId === userId && rating >= 4);
        if (userReview) {
            console.log(`Service ${service.id} is rated ${userReview} by user ${userId}`);
            serviceScores[service.id].score += RATING_WEIGHT_4_5;
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
};
