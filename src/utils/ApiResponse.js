/**
 * Represents an API response.
 * @class
 */

class ApiResponse {
  
  /**
   * Creates an instance of ApiResponse.
   * @param {number} statusCode - The HTTP status code of the response.
   * @param {any} data - The data to be included in the response.
   * @param {string} [message="Success"] - A message associated with the response.
   */

  constructor(statusCode, data, message = "Success") {
    this.statusCode = statusCode;
    this.data = data;
    this.message = message;
    this.success = statusCode < 400;
  }
}

export { ApiResponse };
