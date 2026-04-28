/**
 * shared/base-adapter.ts
 */

export abstract class BaseVerificationAdapter {
  protected abstract readonly providerName: string;

  /**
   * Orchestrates the operation with audit logging, retries, and circuit breaking.
   * @param operation The provider-specific logic
   * @param actionName Name of the action for logging
   * @param metadata Optional metadata for audit logs
   */
  protected async orchestrate<T>(
    operation: () => Promise<T>,
    actionName: string,
    metadata: Record<string, any> = {},
  ): Promise<T> {
    // 1. Audit Log: Before (Optional)
    // console.log(`[Verification:${this.providerName}] Starting ${actionName}`, metadata);

    try {
      // 2. Execute (potentially with a retry/circuit breaker wrapper here)
      const result = await operation();

      // 3. Audit Log: Success
      // console.log(`[Verification:${this.providerName}] ${actionName} succeeded`);

      return result;
    } catch (error: any) {
      // 4. Audit Log: Failure
      console.error(`[Verification:${this.providerName}] ${actionName} failed:`, error);
      throw error;
    }
  }
}
