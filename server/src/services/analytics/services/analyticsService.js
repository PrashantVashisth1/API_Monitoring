import logger from "../../../shared/config/logger.js";
import AppError from "../../../shared/utils/AppError.js";


export class AnalyticsService {
    constructor(metricsRepo) {
        if(!metricsRepo) throw new Error("Analytics Service requires a metrics Repository");
        this.metricsRepository = metricsRepo;
    }

    async getOverallStats(clientId, filters = {}) {
        try {
            const { startTime, endTime } = this.parseTimeFilters(filters);

            const stats = await this.metricsRepository.getOverallStats(
                clientId, 
                startTime, 
                endTime
            );

            const totalHits = parseInt(stats.total_hits) || 0;
            const errorHits = parseInt(stats.error_hits) || 0;
            const errorRate = totalHits > 0 ? (errorHits / totalHits) * 100 : 0

            return {
                totalHits,
                errorHits,
                successHits: totalHits - errorHits,
                errorRate: parseFloat(errorRate.toFixed(2)),
                avgLatency: parseFloat(stats.avg_latency) || 0,
                uniqueServices: parseInt(stats.unique_services) || 0,
                uniqueEndpoints: parseInt(stats.unique_endpoints) || 0,
                timeRange: {
                    start: startTime,
                    end: endTime,
                },
            }
        } catch (error) {
            logger.error('Error getting overall stats:', error);    
            throw error;
        }
    }

    parseTimeFilters(filters = {}) {
        let { startTime, endTime } = filters;

        if (!startTime) {
            startTime = new Date();
            startTime.setHours(startTime.getHours() - 24) // Last 24 hrs
        }
        else {
            startTime = new Date(startTime);
        }


        if (!endTime) {
            endTime = new Date();
        }
        else {
            endTime = new Date(endTime);
        }

        return { startTime, endTime }

    }
}