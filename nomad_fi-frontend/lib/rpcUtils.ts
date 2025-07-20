// lib/rpcUtils.ts
// Utility functions for RPC calls with retries and delays

export const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export interface RpcCallOptions {
  maxRetries?: number;
  retryDelay?: number;
  timeout?: number;
}

export async function rpcCallWithRetry<T>(
  rpcCall: () => Promise<T>,
  options: RpcCallOptions = {}
): Promise<T> {
  const {
    maxRetries = 3,
    retryDelay = 1000,
    timeout = 10000
  } = options;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      // Add delay before each attempt (except the first)
      if (attempt > 0) {
        console.log(`RPC call attempt ${attempt + 1}/${maxRetries + 1}, waiting ${retryDelay}ms...`);
        await delay(retryDelay * attempt); // Exponential backoff
      }

      // Create a timeout promise
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error('RPC call timeout')), timeout);
      });

      // Race between the RPC call and timeout
      const result = await Promise.race([rpcCall(), timeoutPromise]);
      return result;

    } catch (error) {
      console.error(`RPC call attempt ${attempt + 1} failed:`, error);
      
      if (attempt === maxRetries) {
        throw error; // Re-throw on final attempt
      }
      
      // Check if it's a rate limit error
      if (error instanceof Error) {
        const errorMessage = error.message.toLowerCase();
        if (errorMessage.includes('rate limit') || errorMessage.includes('too many requests')) {
          console.log('Rate limit detected, increasing delay...');
          await delay(retryDelay * 2); // Double the delay for rate limits
        }
      }
    }
  }

  throw new Error('RPC call failed after all retries');
}

// Utility for sequential RPC calls with delays
export async function sequentialRpcCalls<T>(
  calls: (() => Promise<T>)[],
  delayBetweenCalls: number = 500
): Promise<T[]> {
  const results: T[] = [];
  
  for (let i = 0; i < calls.length; i++) {
    if (i > 0) {
      await delay(delayBetweenCalls);
    }
    
    try {
      const result = await rpcCallWithRetry(calls[i]);
      results.push(result);
    } catch (error) {
      console.error(`Sequential RPC call ${i} failed:`, error);
      results.push(null as T); // Add null for failed calls
    }
  }
  
  return results;
} 