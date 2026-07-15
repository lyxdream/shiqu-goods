export interface ApiResponse<T = unknown> {
  code: number;
  message: string;
  success: boolean;
  data: T;
}
