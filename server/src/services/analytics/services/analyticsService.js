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

    async getTopEndpoints(clientId, options = {}) {
        try {
            const { limit = 10, startTime } = options;
            const parsedStartTime = startTime ? new Date(startTime) : null;

            const endpoints = await this.metricsRepository.getTopEndpoints(clientId, limit, parsedStartTime)

            return endpoints.map((endpoint) => ({
                serviceName: endpoint.service_name,
                endpoint: endpoint.endpoint,
                method: endpoint.method,
                totalHits: parseInt(endpoint.total_hits),
                avgLatency: parseFloat(endpoint.avg_latency).toFixed(2),
                errorHits: parseInt(endpoint.error_hits),
                errorRate: parseFloat(
                    (parseInt(endpoint.error_hits) / parseInt(endpoint.total_hits)) * 100
                ).toFixed(2),
            }))
        } catch (error) {
            logger.error('Error getting top endpoints:', error);
            throw error;
        }
    }

    async getTimeSeries(clientId, filters = {}) {
        try {
            const { serviceName, endpoint, startTime, endTime, limit = 100, offset = 0 } = filters;

            const { endTime: end_time, startTime: start_time } = this.parseTimeFilters({ startTime, endTime });

            const metrics = await this.metricsRepository.getMetrics({ clientId, serviceName, endpoint, startTime: start_time, endTime: end_time, limit, offset })

            return metrics.map((metric) => ({
                serviceName: metric.service_name,
                endpoint:    metric.endpoint,
                method:      metric.method,
                totalHits:   parseInt(metric.total_hits),
                errorHits:   parseInt(metric.error_hits),
                avgLatency:  parseFloat(metric.avg_latency).toFixed(2),
                minLatency:  parseFloat(metric.min_latency).toFixed(2),
                maxLatency:  parseFloat(metric.max_latency).toFixed(2),
                // pg returns TIMESTAMP WITHOUT TIME ZONE as a Date object (local-time-aware).
                // Serialize to ISO string so the frontend always gets a UTC-anchored string.
                timeBucket: metric.time_bucket instanceof Date
                    ? metric.time_bucket.toISOString()
                    : new Date(metric.time_bucket).toISOString(),
            }))
        } catch (error) {
            logger.error('Error getting time series:', error);
            throw error;
        }
    }

    /**
     * Aggregated hourly trend — groups ALL endpoints by time_bucket only.
     * Used by the dashboard latency trend chart.
     * Returns an array ordered by time_bucket ASC, each point has:
     *   { timeBucket, avgLatency, totalHits, errorHits }
     */
    async getAggregatedTimeSeries(clientId, filters = {}) {
        try {
            const { startTime, endTime } = this.parseTimeFilters(filters);
            const metrics = await this.metricsRepository.getTimeSeriesAggregated(
                clientId,
                startTime,
                endTime,
                48 // up to 48 hourly buckets (7D coverage at hourly granularity)
            );

            return metrics.map((m) => ({
                // Serialize to ISO string — see getTimeSeries comment above
                timeBucket: m.time_bucket instanceof Date
                    ? m.time_bucket.toISOString()
                    : new Date(m.time_bucket).toISOString(),
                avgLatency: parseFloat(m.avg_latency) || 0,
                totalHits:  parseInt(m.total_hits)   || 0,
                errorHits:  parseInt(m.error_hits)   || 0,
            }));
        } catch (error) {
            logger.error('Error getting aggregated time series:', error);
            throw error;
        }
    }

    /**
     * Archive query — same as timeSeries but with pagination support.
     * No default time range; caller must provide startTime/endTime.
     */
    async getArchive(clientId, filters = {}) {
        try {
            const {
                serviceName, endpoint,
                startTime, endTime,
                limit = 50, offset = 0,
            } = filters;

            const metrics = await this.metricsRepository.getMetrics({
                clientId,
                serviceName: serviceName || undefined,
                endpoint:    endpoint    || undefined,
                startTime:   startTime   ? new Date(startTime) : undefined,
                endTime:     endTime     ? new Date(endTime)   : undefined,
                limit,
                offset,
            });

            return metrics.map((m) => ({
                serviceName: m.service_name,
                endpoint:    m.endpoint,
                method:      m.method,
                totalHits:   parseInt(m.total_hits),
                errorHits:   parseInt(m.error_hits),
                avgLatency:  parseFloat(m.avg_latency).toFixed(2),
                minLatency:  parseFloat(m.min_latency).toFixed(2),
                maxLatency:  parseFloat(m.max_latency).toFixed(2),
                // Serialize to ISO string — see getTimeSeries comment above
                timeBucket:  m.time_bucket instanceof Date
                    ? m.time_bucket.toISOString()
                    : new Date(m.time_bucket).toISOString(),
            }));
        } catch (error) {
            logger.error('Error getting archive metrics:', error);
            throw error;
        }
    }

}