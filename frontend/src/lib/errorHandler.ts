export class ConversationError extends Error {
  constructor(
    message: string,
    public code: string,
    public recoverable: boolean = true,
  ) {
    super(message);
    this.name = "ConversationError";
  }
}

export const handleError = (error: unknown): string => {
  if (error instanceof ConversationError) {
    return error.message;
  }

  if (error instanceof Error) {
    if (error.message.includes("API")) {
      return "Unable to connect to AI service. Please try again.";
    }
    if (error.message.includes("timeout")) {
      return "Request timed out. Please check your connection.";
    }
    if (error.message.includes("unauthorized")) {
      return "Authentication failed. Please sign in again.";
    }
    return error.message;
  }

  return "An unexpected error occurred. Please try again.";
};

// Retry logic
export async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  maxAttempts = 3,
  baseDelayMs = 1000,
): Promise<T> {
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (error) {
      if (attempt === maxAttempts) throw error;
      const delay = baseDelayMs * Math.pow(2, attempt - 1);
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }

  throw new Error("Max retries exceeded");
}
