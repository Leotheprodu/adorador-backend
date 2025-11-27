import {
    Controller,
    Get,
    Post,
    Body,
    Param,
    UseGuards,
    ParseIntPipe,
    Put,
    Res,
    HttpException,
    HttpStatus,
} from '@nestjs/common';
import { Response } from 'express';
import { ApiTags } from '@nestjs/swagger';
import { PaymentsService } from './payments.service';
import { PermissionsGuard } from '../auth/guards/permissions/permissions.guard';
import { AppRole, CheckLoginStatus, CheckUserMemberOfBand } from '../auth/decorators/permissions.decorators';
import { catchHandle } from '../chore/utils/catchHandle';
import { CreatePaymentDto, ApprovePaymentDto, RejectPaymentDto } from './dto/payment.dto';
import { ApiApprovePayment, ApiCreatePayment, ApiGetBandPayments, ApiGetPendingPayments, ApiRejectPayment } from './payments.swagger';
import { userRoles } from 'config/constants';

import { GetUser } from '../auth/decorators/get-user.decorator';
import { JwtPayload } from '../auth/services/jwt.service';

@Controller('payments')
@ApiTags('payments')
@UseGuards(PermissionsGuard)
export class PaymentsController {
    constructor(private readonly paymentsService: PaymentsService) { }

    @ApiCreatePayment()
    @Post('band/:bandId')
    @CheckLoginStatus('loggedIn')
    async createPayment(
        @Res() res: Response,
        @Param('bandId', ParseIntPipe) bandId: number,
        @Body() createPaymentDto: CreatePaymentDto,
        @GetUser() user: JwtPayload,
    ) {
        try {
            const payment = await this.paymentsService.createPayment(
                bandId,
                createPaymentDto.planId,
                createPaymentDto.method,
                user.sub,
                createPaymentDto.proofUrl,
            );

            if (!payment) {
                throw new HttpException(
                    'Failed to create payment',
                    HttpStatus.BAD_REQUEST,
                );
            }

            res.status(HttpStatus.CREATED).send(payment);
        } catch (e) {
            catchHandle(e);
        }
    }

    @ApiGetPendingPayments()
    @Get('pending')
    @CheckLoginStatus('loggedIn')
    @AppRole(userRoles.admin.id)
    async getPendingPayments(@Res() res: Response) {
        try {
            const payments = await this.paymentsService.getPendingPayments();

            res.send(payments);
        } catch (e) {
            catchHandle(e);
        }
    }

    @ApiGetBandPayments()
    @Get('band/:bandId')
    @CheckLoginStatus('loggedIn')
    @CheckUserMemberOfBand({ checkBy: 'paramBandId', key: 'bandId' })
    async getBandPayments(
        @Res() res: Response,
        @Param('bandId', ParseIntPipe) bandId: number,
    ) {
        try {
            const payments = await this.paymentsService.getBandPayments(bandId);

            res.send({
                success: true,
                data: payments,
            });
        } catch (e) {
            catchHandle(e);
        }
    }

    @ApiApprovePayment()
    @Put(':paymentId/approve')
    @CheckLoginStatus('loggedIn')
    @AppRole(userRoles.admin.id)
    async approvePayment(
        @Res() res: Response,
        @Param('paymentId', ParseIntPipe) paymentId: number,
        @GetUser() user: JwtPayload,
    ) {
        try {
            const result = await this.paymentsService.approvePayment(
                paymentId,
                user.sub,
            );

            if (!result) {
                throw new HttpException(
                    'Failed to approve payment',
                    HttpStatus.BAD_REQUEST,
                );
            }

            res.send(result);
        } catch (e) {
            catchHandle(e);
        }
    }

    @ApiRejectPayment()
    @Put(':paymentId/reject')
    @CheckLoginStatus('loggedIn')
    @AppRole(userRoles.admin.id)
    async rejectPayment(
        @Res() res: Response,
        @Param('paymentId', ParseIntPipe) paymentId: number,
        @Body() rejectPaymentDto: RejectPaymentDto,
    ) {
        try {
            const result = await this.paymentsService.rejectPayment(
                paymentId,
                rejectPaymentDto.reason,
            );

            if (!result) {
                throw new HttpException(
                    'Failed to reject payment',
                    HttpStatus.BAD_REQUEST,
                );
            }

            res.send(result);
        } catch (e) {
            catchHandle(e);
        }
    }
}
