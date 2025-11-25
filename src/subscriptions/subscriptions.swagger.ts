import { ApiOperation, ApiResponse } from '@nestjs/swagger';
import { applyDecorators } from '@nestjs/common';

export function ApiGetPlans() {
    return applyDecorators(
        ApiOperation({ summary: 'Get all active subscription plans' }),
        ApiResponse({
            status: 200,
            description: 'List of active subscription plans returned successfully.',
        }),
        ApiResponse({
            status: 404,
            description: 'No subscription plans found.',
        }),
    );
}

export function ApiGetBandSubscription() {
    return applyDecorators(
        ApiOperation({ summary: 'Get active subscription for a band' }),
        ApiResponse({
            status: 200,
            description: 'Subscription details returned successfully.',
        }),
        ApiResponse({
            status: 404,
            description: 'Subscription not found for this band.',
        }),
    );
}

export function ApiGetBandLimits() {
    return applyDecorators(
        ApiOperation({
            summary: 'Get plan limits and current usage for a band',
        }),
        ApiResponse({
            status: 200,
            description: 'Limits and usage returned successfully.',
        }),
    );
}

export function ApiCancelSubscription() {
    return applyDecorators(
        ApiOperation({ summary: 'Cancel a band subscription' }),
        ApiResponse({
            status: 200,
            description: 'Subscription cancelled successfully.',
        }),
        ApiResponse({
            status: 400,
            description: 'Failed to cancel subscription.',
        }),
        ApiResponse({
            status: 404,
            description: 'Subscription not found.',
        }),
    );
}
