export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
  ) {
    super(message);
  }
}

export const message = (error: unknown) =>
  error instanceof Error ? error.message : 'Something went wrong. Please try again.';
