import { ApiOperation, ApiResponse } from '@nestjs/swagger';
import { applyDecorators } from '@nestjs/common';

export function ApiCreatePayment() {
    return applyDecorators(
        ApiOperation({ summary: 'Submit a payment for a subscription plan' }),
        ApiResponse({
            status: 201,
            description: 'Payment submitted successfully.',
        }),
        ApiResponse({
            status: 400,
            description: 'Failed to create payment.',
        }),
        ApiResponse({
            status: 404,
            description: 'Plan not found.',
        }),
    );
}

export function ApiGetPendingPayments() {
    return applyDecorators(
        ApiOperation({ summary: 'Get all pending payments (Admin only)' }),
        ApiResponse({
            status: 200,
            description: 'List of pending payments returned successfully.',
        }),
    );
}

export function ApiGetBandPayments() {
    return applyDecorators(
        ApiOperation({ summary: 'Get payment history for a band' }),
        ApiResponse({
            status: 200,
            description: 'Payment history returned successfully.',
        }),
    );
}

export function ApiApprovePayment() {
    return applyDecorators(
        ApiOperation({ summary: 'Approve a pending payment (Admin only)' }),
        ApiResponse({
            status: 200,
            description: 'Payment approved and subscription updated successfully.',
        }),
        ApiResponse({
            status: 400,
            description: 'Failed to approve payment or payment is not pending.',
        }),
        ApiResponse({
            status: 404,
            description: 'Payment not found.',
        }),
    );
}

export function ApiRejectPayment() {
    return applyDecorators(
        ApiOperation({ summary: 'Reject a pending payment (Admin only)' }),
        ApiResponse({
            status: 200,
            description: 'Payment rejected successfully.',
        }),
        ApiResponse({
            status: 400,
            description: 'Failed to reject payment or payment is not pending.',
        }),
        ApiResponse({
            status: 404,
            description: 'Payment not found.',
        }),
    );
}
