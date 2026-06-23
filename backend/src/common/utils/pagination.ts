import { PaginationDto } from '../dto/pagination.dto';

export interface PaginatedResult<T> {
  data: T[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
  };
}

export function createPaginationMeta(
  total: number,
  paginationDto: PaginationDto,
): PaginatedResult<any>['meta'] {
  const page = paginationDto.page || 1;
  const limit = paginationDto.limit || 20;
  const totalPages = Math.ceil(total / limit);

  return {
    total,
    page,
    limit,
    totalPages,
    hasNextPage: page < totalPages,
    hasPreviousPage: page > 1,
  };
}

export function getSkipTake(
  paginationDto: PaginationDto,
): { skip: number; take: number } {
  const page = paginationDto.page || 1;
  const limit = paginationDto.limit || 20;

  return {
    skip: (page - 1) * limit,
    take: limit,
  };
}
