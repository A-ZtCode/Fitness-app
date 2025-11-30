import axios from 'axios';

const ANALYTICS_URL = process.env.ANALYTICS_URL || "http://analytics:5050";

export class AnalyticsService {
  constructor() {
    this.baseURL = ANALYTICS_URL;
  }

  async getAllStats(context) {
    const { data } = await axios.get(`${this.baseURL}/stats`, {
      headers: { Authorization: context.authHeader },
      timeout: 5000
    });
    return data.stats || [];
  }

  async getUserStats(username, context) {
    const { data } = await axios.get(`${this.baseURL}/stats/${username}`, {
      headers: { Authorization: context.authHeader },
      timeout: 5000
    });
    return data.stats || [];
  }

  async getWeeklyStats(username, startDate, endDate, context) {
    const { data } = await axios.get(`${this.baseURL}/stats/weekly/`, {
      params: {
        user: username,
        start: startDate,
        end: endDate
      },
      headers: { Authorization: context.authHeader },
      timeout: 5000
    });
    return data.stats || [];
  }


  async getDailyTrend(username, context) {
    const { data } = await axios.get(`${this.baseURL}/stats/daily_trend/${username}`, {
      params: {
        user: username
      },
      headers: { Authorization: context.authHeader },
      timeout: 5000
    });
    return data.trend || [];
  }
  

  async getActivitiesRange(username, startDate, endDate, context) {
    const { data } = await axios.get(`${this.baseURL}/api/activities/range`, {
      params: {
        user: username,
        start: startDate,
        end: endDate
      },
      headers: { Authorization: context.authHeader },
      timeout: 5000
    });
    return data || [];
  }


  async updateActivityComment(activityId, comments, context) {
  const { data } = await axios.patch(
    `${this.baseURL}/api/activities/${activityId}`,
    { comments },
    {
      headers: { Authorization: context.authHeader },
      timeout: 5000
    }
  );

  // data = { ok: true }
  return data;
}
  

  async healthCheck() {
    try {
      await axios.get(`${this.baseURL}/health`, { timeout: 3000 });
      return { status: 'healthy', analyticsService: 'connected' };
    } catch (error) {
      return { 
        status: 'degraded', 
        analyticsService: 'disconnected',
        error: error.message 
      };
    }
  }
}
