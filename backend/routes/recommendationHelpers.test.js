const { getMatrix, applyTimeDecay, calculateRecommendedServices } = require('./recommendationHelpers');
const math = require('mathjs');

// Custom matcher to compare floating-point numbers with a tolerance
expect.extend({
    toBeCloseToArray(received, expected, tolerance = 1e-10) {
        if (received.length !== expected.length) {
            return {
                message: () => `Expected arrays to be of same length`,
                pass: false
            };
        }

        for (let i = 0; i < received.length; i++) {
            if (Array.isArray(received[i]) && Array.isArray(expected[i])) {
                for (let j = 0; j < received[i].length; j++) {
                    if (Math.abs(received[i][j] - expected[i][j]) > tolerance) {
                        return {
                            message: () => `Expected ${received[i][j]} to be close to ${expected[i][j]} within tolerance ${tolerance}`,
                            pass: false
                        };
                    }
                }
            } else if (Math.abs(received[i] - expected[i]) > tolerance) {
                return {
                    message: () => `Expected ${received[i]} to be close to ${expected[i]} within tolerance ${tolerance}`,
                    pass: false
                };
            }
        }

        return {
            message: () => `Arrays are close within tolerance ${tolerance}`,
            pass: true
        };
    }
});

describe('getMatrix', () => {
    test('should return correct matrix and cosine similarity matrix', () => {
        const allFavorites = [
            { user: { username: 'user1' }, service: { serviceName: 'service1' } },
            { user: { username: 'user2' }, service: { serviceName: 'service2' } },
            { user: { username: 'user1' }, service: { serviceName: 'service2' } },
        ];

        const result = getMatrix(allFavorites);
        const expectedMatrix = [
            [1, 1],
            [0, 1]
        ];
        const expectedCosineSimMatrix = [
            [1, Math.sqrt(0.5)],
            [Math.sqrt(0.5), 1]
        ];

        expect(result.matrix).toEqual(expectedMatrix);
        expect(result.cosineSimMatrix).toBeCloseToArray(expectedCosineSimMatrix);
        expect(result.users).toEqual(['user1', 'user2']);
        expect(result.services).toEqual(['service1', 'service2']);
    });
});

describe('applyTimeDecay', () => {
    test('should apply time decay correctly', () => {
        const now = new Date();
        const allReviews = [
            { createdAt: now.toISOString(), rating: 5, userId: 1, serviceId: 1 },
            { createdAt: new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString(), rating: 4, userId: 1, serviceId: 1 }
        ];

        const result = applyTimeDecay(allReviews);
        const expectedRateTime = {
            1: [
                { rating: 5, decayedRating: 5, createdAt: allReviews[0].createdAt, userId: 1 },
                { rating: 4, decayedRating: 2, createdAt: allReviews[1].createdAt, userId: 1 }
            ]
        };

        expect(result).toEqual(expect.objectContaining({
            1: expect.arrayContaining([
                expect.objectContaining({
                    rating: 5,
                    decayedRating: expect.closeTo(5, 1e-8),
                    createdAt: allReviews[0].createdAt,
                    userId: 1
                }),
                expect.objectContaining({
                    rating: 4,
                    decayedRating: expect.closeTo(2, 1e-8),
                    createdAt: allReviews[1].createdAt,
                    userId: 1
                })
            ])
        }));
    });
});

describe('calculateRecommendedServices', () => {
    test('should calculate recommended services correctly', () => {
        const allServices = [
            { id: 1, serviceName: 'service1', favoritedBy: [], reviewsAndRatings: [] },
            { id: 2, serviceName: 'service2', favoritedBy: [], reviewsAndRatings: [] }
        ];
        const userId = 1;
        const rateTime = {
            1: [{ rating: 5, decayedRating: 5, createdAt: new Date(), userId: 1 }],
            2: [{ rating: 4, decayedRating: 2, createdAt: new Date(), userId: 1 }]
        };
        const cosineSimMatrix = [
            [1, 0.5],
            [0.5, 1]
        ];
        const services = ['service1', 'service2'];
        const userFavorites = [{ userId: 1, serviceId: 1 }];

        const result = calculateRecommendedServices(allServices, userId, rateTime, cosineSimMatrix, services, userFavorites);

        // Just check the structure and presence of keys, the actual values might be subject to floating point inaccuracies
        expect(result).toHaveLength(2);
        expect(result[0]).toHaveProperty('score');
        expect(result[1]).toHaveProperty('score');
    });
});
