export const ApiResponse = {
  success<T>(data: T, message = "OK") {
    return { success: true, message, data };
  },
  error(message: string, data: unknown = null) {
    return { success: false, message, data };
  },
};
