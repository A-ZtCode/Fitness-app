import axios from 'axios';

const ANALYTICS_URL = process.env.ANALYTICS_URL || "http://analytics:5050";

export class AnalyticsService {
  constructor() {
    this.baseURL = ANALYTICS_URL;
  }

  async getAllStats() {
    const { data } = await axios.get(`${this.baseURL}/stats`, {
      timeout: 5000
    });
    return data.stats || [];
  }

  async getUserStats(username) {
    const { data } = await axios.get(`${this.baseURL}/stats/${username}`, {
      timeout: 5000
    });
    return data.stats || [];
  }

  async getWeeklyStats(username, startDate, endDate) {
    const { data } = await axios.get(`${this.baseURL}/stats/weekly/`, {
      params: {
        user: username,
        start: startDate,
        end: endDate
      },
      timeout: 5000
    });
    return data.stats || [];
  }

  async healthCheck() {
    try {
      await axios.get(`${this.baseURL}/stats`, { timeout: 3000 });
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
