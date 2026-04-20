/// Custom exception types used across the app.
class AppException implements Exception {
  const AppException(this.message, {this.statusCode});

  final String message;
  final int? statusCode;

  @override
  String toString() => 'AppException($statusCode): $message';
}

class NetworkException extends AppException {
  const NetworkException([super.message = 'No internet connection.']);
}

class UnauthorizedException extends AppException {
  const UnauthorizedException([super.message = 'Session expired. Please sign in again.'])
      : super(statusCode: 401);
}

class NotFoundException extends AppException {
  const NotFoundException([super.message = 'Resource not found.'])
      : super(statusCode: 404);
}

class ServerException extends AppException {
  const ServerException([super.message = 'Something went wrong. Please try again.'])
      : super(statusCode: 500);
}

class ValidationException extends AppException {
  const ValidationException(super.message, {this.fieldErrors})
      : super(statusCode: 400);

  final Map<String, List<String>>? fieldErrors;
}
