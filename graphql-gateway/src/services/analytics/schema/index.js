export const analyticsTypeDefs = `#graphql
  type ExerciseStats {
    exerciseType: String!
    totalDuration: Int!
  }

  type UserStats {
    username: String!
    exercises: [ExerciseStats!]!
  }

  type WeeklyStats {
    exerciseType: String!
    totalDuration: Int!
  }

  type DailyTrend {
    name: String!
    Duration: Int!
    date: String!
  }

  type ActivitiesRange {
    id: String!
    username: String!
    date: String!
    time: String!
    activityType: String!
    duration: Int!
    comments: String!
    createdAt: String!
  }

  type UpdateActivityResponse {
    ok: Boolean!
    message: String
  }

  type AnalyticsQuery {
    # Get all user statistics
    allStats: [UserStats!]!
    
    # Get statistics for a specific user
    userStats(username: String!): [UserStats!]!
    
    # Get weekly statistics for a user within date range
    weeklyStats(username: String!, startDate: String!, endDate: String!): [WeeklyStats!]!

    # Get daily trend data (for line chart)
    dailyTrend(username: String!): [DailyTrend!]!

    # Get all activities data for a user within date range (for journal page)
    activitiesRange(username: String!, startDate: String!, endDate: String!): [ActivitiesRange!]!

    # Update an activity's comment/description and return the updated activity
    updateActivityComment(activityId: String!, comments: String!): UpdateActivityResponse!
  
  }

  extend type Query {
    analytics: AnalyticsQuery!
  }
`;
