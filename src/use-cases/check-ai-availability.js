import { AIService } from '../services/ai-service.js';
import { Result } from '../utils/result.js';

export class CheckAIAvailabilityUseCase {
    /**
     * @param {AIService} aiService
     */
    constructor(aiService) {
        this.aiService = aiService;
    }

    /**
     * Check if Chrome Built-in AI is available
     * @returns {Promise<Result<string>>} Availability status
     */
    async execute() {
        try {
            const status = await this.aiService.checkAvailability();
            return Result.success(status);
        } catch (error) {
            return Result.failure(error);
        }
    }
}