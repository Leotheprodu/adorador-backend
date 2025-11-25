import { IsNumber, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpgradeSubscriptionDto {
    @ApiProperty({
        description: 'ID of the new plan to upgrade to',
        example: 2,
    })
    @IsNumber()
    @IsNotEmpty()
    newPlanId: number;
}
