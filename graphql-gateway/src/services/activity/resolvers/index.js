import { ActivityService } from '../datasource/activityService.js';
import { handleServiceError, retryWithFallback } from '../../../utils/errorHandler.js';

/**
 * Activity Service Instance
 */
const activityService = new ActivityService();

/**
 * Query Resolvers for Activity Service
 */
const queryResolvers = {
  /**
   * Get all exercises
   */
  exercises: async () => {
    try {
      const result = await activityService.getAllExercises();
      return result || [];
    } catch (error) {
      console.error('Error in exercises resolver:', error);
      return [];
    }
  },

  /**
   * Get exercise by ID
   */
  exercise: async (_, { id }) => {
    try {
      const result = await activityService.getExerciseById(id);
      return result;
    } catch (error) {
      console.error(`Error in exercise resolver for ID ${id}:`, error);
      return null;
    }
  }
};

/**
 * Mutation Resolvers for Activity Service
 */
const mutationResolvers = {
  /**
   * Add a new exercise
   */
  addExercise: async (_, { input }) => {
    try {
      return await retryWithFallback(async () => {
        return await activityService.addExercise(input);
      });
    } catch (error) {
      handleServiceError(error, 'add exercise');
    }
  },

  /**
   * Update an existing exercise
   */
  updateExercise: async (_, { id, input }) => {
    try {
      return await retryWithFallback(async () => {
        return await activityService.updateExercise(id, input);
      });
    } catch (error) {
      handleServiceError(error, 'update exercise');
    }
  },

  /**
   * Delete an exercise
   */
  deleteExercise: async (_, { id }) => {
    try {
      return await retryWithFallback(async () => {
        return await activityService.deleteExercise(id);
      });
    } catch (error) {
      handleServiceError(error, 'delete exercise');
    }
  }
};

/**
 * Activity Resolvers Export
 */
export const activityResolvers = {
  Query: queryResolvers,
  Mutation: mutationResolvers
};
