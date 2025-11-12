/**
 * Score and Rating Workers
 * Handles user/service scoring, ratings, and leaderboards
 */

import Redis from 'ioredis';

const redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379');

interface ScoreFormula {
  id: number;
  name: string;
  formula: string;
  weights: Record<string, number>;
}

interface ScorableEntity {
  id: number;
  type: string;
  getData: () => Promise<Record<string, any>>;
}

/**
 * Main score calculation worker
 */
export class ScoreWorker {
  async perform(scorableId: number, scorableClass: string, formulaId: number) {
    try {
      // Get scorable entity
      const scorable = await this.getScorableEntity(scorableId, scorableClass);
      if (!scorable) {
        return { skipped: true, reason: 'Scorable entity not found' };
      }

      // Get score formula
      const formula = await this.getScoreFormula(formulaId);
      if (!formula) {
        return { skipped: true, reason: 'Score formula not found' };
      }

      // Calculate score
      const rating = await this.calculateScore(scorable, formula);

      if (rating.errors) {
        return { success: false, errors: rating.errors };
      }

      // Save score
      await this.saveScore(scorableId, scorableClass, rating, formulaId);

      return {
        success: true,
        scorableId,
        scorableClass,
        value: rating.value,
        decomposed: rating.decomposed,
      };
    } catch (error) {
      console.error('Score calculation error:', error);
      return { success: false, error: (error as Error).message };
    }
  }

  private async getScorableEntity(id: number, className: string): Promise<ScorableEntity | null> {
    // Mock implementation - would fetch from database
    return {
      id,
      type: className,
      getData: async () => ({
        completedFavors: 10,
        averageRating: 4.5,
        responseTime: 120, // minutes
        activityScore: 85,
      }),
    };
  }

  private async getScoreFormula(id: number): Promise<ScoreFormula | null> {
    // Mock implementation - would fetch from database
    return {
      id,
      name: 'User Score',
      formula: 'completed_favors * 10 + average_rating * 20 + activity_score',
      weights: {
        completed_favors: 10,
        average_rating: 20,
        response_time: -0.1,
        activity_score: 1,
      },
    };
  }

  private async calculateScore(
    scorable: ScorableEntity,
    formula: ScoreFormula
  ): Promise<{ value: number; decomposed: Record<string, number>; errors?: string[] }> {
    const data = await scorable.getData();
    const decomposed: Record<string, number> = {};
    let totalScore = 0;

    // Calculate weighted components
    for (const [key, weight] of Object.entries(formula.weights)) {
      const value = data[key] || 0;
      const componentScore = value * weight;
      decomposed[key] = componentScore;
      totalScore += componentScore;
    }

    return {
      value: Math.max(0, Math.round(totalScore)),
      decomposed,
    };
  }

  private async saveScore(
    scorableId: number,
    scorableClass: string,
    rating: { value: number; decomposed: Record<string, number> },
    formulaId: number
  ) {
    const key = `${scorableClass.toLowerCase()}:${scorableId}:score`;

    await redis.hset(key, {
      value: rating.value.toString(),
      decomposed: JSON.stringify(rating.decomposed),
      formula_id: formulaId.toString(),
      updated_at: new Date().toISOString(),
    });

    // Add to leaderboard
    await redis.zadd(`leaderboard:${scorableClass.toLowerCase()}`, rating.value, scorableId.toString());
  }
}

/**
 * Score query processor - batch score calculations
 */
export class ScoreQueryProcessorWorker {
  async perform(scorableClass: string, scorableIds: number[], formulaId: number) {
    try {
      const results = [];
      const worker = new ScoreWorker();

      for (const id of scorableIds) {
        const result = await worker.perform(id, scorableClass, formulaId);
        results.push(result);
      }

      return {
        success: true,
        processed: results.length,
        results,
      };
    } catch (error) {
      console.error('Batch score processing error:', error);
      return { success: false, error: (error as Error).message };
    }
  }
}

/**
 * Update rating worker
 */
export class UpdateRatingWorker {
  async perform(ratableId: number, ratableType: string) {
    try {
      // Get all ratings for this entity
      const ratings = await this.getRatings(ratableId, ratableType);

      if (ratings.length === 0) {
        return { skipped: true, reason: 'No ratings found' };
      }

      // Calculate average
      const sum = ratings.reduce((acc, r) => acc + r.value, 0);
      const average = sum / ratings.length;

      // Update cached rating
      await redis.hset(`${ratableType.toLowerCase()}:${ratableId}:rating`, {
        average: average.toFixed(2),
        count: ratings.length.toString(),
        updated_at: new Date().toISOString(),
      });

      return {
        success: true,
        ratableId,
        ratableType,
        average,
        count: ratings.length,
      };
    } catch (error) {
      console.error('Rating update error:', error);
      return { success: false, error: (error as Error).message };
    }
  }

  private async getRatings(id: number, type: string): Promise<Array<{ value: number }>> {
    // Mock implementation - would fetch from database
    return [
      { value: 5 },
      { value: 4 },
      { value: 5 },
      { value: 4 },
    ];
  }
}

/**
 * Recalculate strength worker - for matching algorithm
 */
export class RecalculateStrengthWorker {
  async perform(userId: number) {
    try {
      // Get user data
      const userData = await this.getUserData(userId);

      // Calculate strength components
      const strength = {
        activity: this.calculateActivityStrength(userData),
        completion: this.calculateCompletionStrength(userData),
        rating: this.calculateRatingStrength(userData),
        response: this.calculateResponseStrength(userData),
      };

      // Calculate overall strength (0-100)
      const overallStrength = Math.round(
        strength.activity * 0.3 +
        strength.completion * 0.3 +
        strength.rating * 0.25 +
        strength.response * 0.15
      );

      // Save strength
      await redis.hset(`user:${userId}:strength`, {
        overall: overallStrength.toString(),
        activity: strength.activity.toString(),
        completion: strength.completion.toString(),
        rating: strength.rating.toString(),
        response: strength.response.toString(),
        updated_at: new Date().toISOString(),
      });

      // Update user matching tier
      const tier = this.calculateTier(overallStrength);
      await redis.set(`user:${userId}:tier`, tier);

      return {
        success: true,
        userId,
        strength: overallStrength,
        tier,
        components: strength,
      };
    } catch (error) {
      console.error('Strength calculation error:', error);
      return { success: false, error: (error as Error).message };
    }
  }

  private async getUserData(userId: number): Promise<Record<string, any>> {
    // Mock implementation
    return {
      lastActiveAt: new Date(),
      completedFavors: 15,
      totalFavors: 20,
      averageRating: 4.5,
      averageResponseTime: 90, // minutes
    };
  }

  private calculateActivityStrength(data: Record<string, any>): number {
    const lastActive = new Date(data.lastActiveAt);
    const daysSinceActive = (Date.now() - lastActive.getTime()) / (1000 * 60 * 60 * 24);

    if (daysSinceActive < 1) return 100;
    if (daysSinceActive < 7) return 80;
    if (daysSinceActive < 30) return 60;
    if (daysSinceActive < 90) return 40;
    return 20;
  }

  private calculateCompletionStrength(data: Record<string, any>): number {
    const completionRate = data.totalFavors > 0
      ? (data.completedFavors / data.totalFavors) * 100
      : 0;

    return Math.min(100, completionRate);
  }

  private calculateRatingStrength(data: Record<string, any>): number {
    return (data.averageRating / 5) * 100;
  }

  private calculateResponseStrength(data: Record<string, any>): number {
    // Lower response time = higher strength
    const responseTime = data.averageResponseTime || 0;

    if (responseTime < 60) return 100; // < 1 hour
    if (responseTime < 180) return 80; // < 3 hours
    if (responseTime < 360) return 60; // < 6 hours
    if (responseTime < 1440) return 40; // < 1 day
    return 20;
  }

  private calculateTier(strength: number): string {
    if (strength >= 90) return 'platinum';
    if (strength >= 75) return 'gold';
    if (strength >= 60) return 'silver';
    if (strength >= 40) return 'bronze';
    return 'starter';
  }
}

/**
 * Leaderboard worker
 */
export class NotifyLeaderboardWorker {
  async perform(userId: number, leaderboardType: string, rank: number) {
    try {
      // Get user's previous rank
      const previousRank = await redis.get(`user:${userId}:leaderboard:${leaderboardType}:rank`);

      // Save new rank
      await redis.set(`user:${userId}:leaderboard:${leaderboardType}:rank`, rank.toString());

      // Check if rank improved
      if (previousRank && parseInt(previousRank, 10) > rank) {
        // Rank improved - send notification
        console.log(`User ${userId} improved to rank ${rank} in ${leaderboardType}`);

        // Queue push notification
        // (Would enqueue a notification worker here)
      }

      return {
        success: true,
        userId,
        leaderboardType,
        rank,
        previousRank: previousRank ? parseInt(previousRank, 10) : null,
      };
    } catch (error) {
      console.error('Leaderboard notification error:', error);
      return { success: false, error: (error as Error).message };
    }
  }
}

export default {
  ScoreWorker,
  ScoreQueryProcessorWorker,
  UpdateRatingWorker,
  RecalculateStrengthWorker,
  NotifyLeaderboardWorker,
};
