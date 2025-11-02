import {
  ApiOperation,
  ApiOkResponse,
  ApiBody,
  ApiBearerAuth,
  ApiUnauthorizedResponse,
  ApiNotFoundResponse,
  ApiCreatedResponse,
  ApiParam,
  ApiBadRequestResponse,
} from '@nestjs/swagger';
import { applyDecorators } from '@nestjs/common';

export function ApiCreateEvent() {
  return applyDecorators(
    ApiOperation({
      summary: 'Create new event',
      description:
        'Create a new event for a specific band. Requires authentication.',
    }),
    ApiBearerAuth(),
    ApiParam({
      name: 'bandId',
      description: 'Band ID',
      type: 'number',
      example: 1,
    }),
    ApiCreatedResponse({
      description: 'Event created successfully',
    }),
    ApiUnauthorizedResponse({
      description: 'User is not authenticated',
    }),
    ApiBadRequestResponse({
      description: 'Failed to create event',
    }),
  );
}

export function ApiGetAllEvents() {
  return applyDecorators(
    ApiOperation({
      summary: 'Get all events',
      description: 'Retrieve all events for a specific band.',
    }),
    ApiBearerAuth(),
    ApiParam({
      name: 'bandId',
      description: 'Band ID',
      type: 'number',
      example: 1,
    }),
    ApiOkResponse({
      description: 'Events retrieved successfully',
    }),
    ApiNotFoundResponse({
      description: 'No events found',
    }),
    ApiUnauthorizedResponse({
      description: 'User is not authenticated',
    }),
  );
}

export function ApiGetEvent() {
  return applyDecorators(
    ApiOperation({
      summary: 'Get event by ID',
      description: 'Retrieve a specific event by its ID. Public endpoint.',
    }),
    ApiParam({
      name: 'bandId',
      description: 'Band ID',
      type: 'number',
      example: 1,
    }),
    ApiParam({
      name: 'id',
      description: 'Event ID',
      type: 'number',
      example: 1,
    }),
    ApiOkResponse({
      description: 'Event retrieved successfully',
    }),
    ApiNotFoundResponse({
      description: 'Event not found',
    }),
  );
}

export function ApiUpdateEvent() {
  return applyDecorators(
    ApiOperation({
      summary: 'Update event',
      description: 'Update an event. Cannot update past events.',
    }),
    ApiBearerAuth(),
    ApiParam({
      name: 'bandId',
      description: 'Band ID',
      type: 'number',
      example: 1,
    }),
    ApiParam({
      name: 'id',
      description: 'Event ID',
      type: 'number',
      example: 1,
    }),
    ApiOkResponse({
      description: 'Event updated successfully',
    }),
    ApiNotFoundResponse({
      description: 'Event not found',
    }),
    ApiBadRequestResponse({
      description: 'Cannot update past events',
    }),
    ApiUnauthorizedResponse({
      description: 'User is not authenticated',
    }),
  );
}

export function ApiDeleteEvent() {
  return applyDecorators(
    ApiOperation({
      summary: 'Delete event',
      description: 'Delete an event by its ID.',
    }),
    ApiBearerAuth(),
    ApiParam({
      name: 'bandId',
      description: 'Band ID',
      type: 'number',
      example: 1,
    }),
    ApiParam({
      name: 'id',
      description: 'Event ID',
      type: 'number',
      example: 1,
    }),
    ApiOkResponse({
      description: 'Event deleted successfully',
      schema: {
        example: {
          message: 'Event deleted',
        },
      },
    }),
    ApiBadRequestResponse({
      description: 'Event not deleted',
    }),
    ApiUnauthorizedResponse({
      description: 'User is not authenticated',
    }),
  );
}

export function ApiAddSongsToEvent() {
  return applyDecorators(
    ApiOperation({
      summary: 'Add songs to event',
      description: 'Add songs to a specific event.',
    }),
    ApiBearerAuth(),
    ApiParam({
      name: 'bandId',
      description: 'Band ID',
      type: 'number',
      example: 1,
    }),
    ApiParam({
      name: 'id',
      description: 'Event ID',
      type: 'number',
      example: 1,
    }),
    ApiOkResponse({
      description: 'Songs added to event successfully',
    }),
    ApiUnauthorizedResponse({
      description: 'User is not authenticated',
    }),
  );
}

export function ApiRemoveSongsFromEvent() {
  return applyDecorators(
    ApiOperation({
      summary: 'Remove songs from event',
      description: 'Remove songs from a specific event.',
    }),
    ApiBearerAuth(),
    ApiParam({
      name: 'bandId',
      description: 'Band ID',
      type: 'number',
      example: 1,
    }),
    ApiParam({
      name: 'id',
      description: 'Event ID',
      type: 'number',
      example: 1,
    }),
    ApiOkResponse({
      description: 'Songs removed from event successfully',
    }),
    ApiUnauthorizedResponse({
      description: 'User is not authenticated',
    }),
  );
}

export function ApiUpdateEventSongs() {
  return applyDecorators(
    ApiOperation({
      summary: 'Update event songs',
      description: 'Update songs in a specific event.',
    }),
    ApiBearerAuth(),
    ApiParam({
      name: 'bandId',
      description: 'Band ID',
      type: 'number',
      example: 1,
    }),
    ApiParam({
      name: 'id',
      description: 'Event ID',
      type: 'number',
      example: 1,
    }),
    ApiOkResponse({
      description: 'Event songs updated successfully',
    }),
    ApiUnauthorizedResponse({
      description: 'User is not authenticated',
    }),
  );
}
