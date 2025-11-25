import { IsNumber, IsNotEmpty, IsEnum, IsOptional, IsUrl, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { PaymentMethod } from '@prisma/client';

export class CreatePaymentDto {
    @ApiProperty({
        description: 'ID of the subscription plan',
        example: 2,
    })
    @IsNumber()
    @IsNotEmpty()
    planId: number;

    @ApiProperty({
        description: 'Payment method used',
        enum: PaymentMethod,
        example: PaymentMethod.BANK_TRANSFER,
    })
    @IsEnum(PaymentMethod)
    @IsNotEmpty()
    method: PaymentMethod;

    @ApiProperty({
        description: 'URL of the payment proof (for manual payments)',
        required: false,
        example: 'https://example.com/proof.jpg',
    })
    @IsOptional()
    @IsUrl()
    proofUrl?: string;
}

export class ApprovePaymentDto {
    @ApiProperty({
        description: 'ID of the admin user approving the payment',
        example: 1,
    })
    @IsNumber()
    @IsNotEmpty()
    adminUserId: number;
}

export class RejectPaymentDto {
    @ApiProperty({
        description: 'Reason for rejecting the payment',
        example: 'Invalid proof of payment',
    })
    @IsString()
    @IsNotEmpty()
    reason: string;
}
