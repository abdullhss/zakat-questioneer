export type ApiServiceResult<T = unknown> = {
  success: boolean | number;
  decrypted?: T | any;
  raw?: any;
  error?: string;
  details?: any;
};

export declare function executeProcedure<T = unknown>(
  ProcedureName: string,
  procedureValues: unknown
): Promise<ApiServiceResult<T>>;

export declare function DoTransaction<T = unknown>(
  tableName: string,
  ColumnsValues: unknown,
  WantedAction?: number,
  ColumnsNames?: unknown
): Promise<ApiServiceResult<T>>;
