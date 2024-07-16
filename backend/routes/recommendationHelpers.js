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

        // Add weight for highly rated services
        const userReview = service.reviewsAndRatings.find(review => review.userId === userId);
        if (userReview && userReview.rating >= 4) {
            console.log(`Service ${service.id} is rated ${userReview.rating} by user ${userId}`);
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
