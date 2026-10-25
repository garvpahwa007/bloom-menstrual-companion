import 'dart:convert';

import 'package:http/http.dart' as http;

class BloomApiException implements Exception {
  const BloomApiException(this.code, {this.statusCode = 0});
  final String code;
  final int statusCode;
  @override
  String toString() => 'BloomApiException($code, $statusCode)';
}

/// Client for the optional Express account/backup API.
///
/// The session cookie and CSRF token are held in memory only, matching the
/// React client's privacy boundary. Diary entries must be encrypted on-device
/// before the backup methods are used.
class BloomApiClient {
  BloomApiClient({http.Client? client, String? baseUrl})
    : _client = client ?? http.Client(),
      _baseUrl = (baseUrl ?? const String.fromEnvironment('BLOOM_API_BASE_URL'))
          .replaceFirst(RegExp(r'/+$'), '');

  final http.Client _client;
  final String _baseUrl;
  String? _sessionCookie;
  String? _csrfToken;

  bool get isConfigured => _baseUrl.isNotEmpty;

  Future<Map<String, dynamic>> session() async {
    final data = await _request('/auth/session');
    _acceptAuthData(data);
    return data;
  }

  Future<Map<String, dynamic>> register({
    required String username,
    required String password,
  }) async {
    _clearCredentials();
    final data = await _request(
      '/auth/register',
      method: 'POST',
      body: {'username': username, 'password': password},
    );
    _acceptAuthData(data);
    return data;
  }

  Future<Map<String, dynamic>> login({
    required String username,
    required String password,
  }) async {
    _clearCredentials();
    final data = await _request(
      '/auth/login',
      method: 'POST',
      body: {'username': username, 'password': password},
    );
    _acceptAuthData(data);
    return data;
  }

  Future<void> logout() async {
    try {
      await _request('/auth/logout', method: 'POST', authenticated: true);
    } finally {
      _clearCredentials();
    }
  }

  Future<void> deleteAccount(String password) async {
    await _request(
      '/auth/account',
      method: 'DELETE',
      body: {'password': password},
      authenticated: true,
    );
    _clearCredentials();
  }

  Future<Map<String, dynamic>> backupStatus() =>
      _request('/diary/status', authenticated: true);
  Future<Map<String, dynamic>> downloadBackup() =>
      _request('/diary/backup', authenticated: true);

  Future<Map<String, dynamic>> uploadEncryptedBackup({
    required Map<String, dynamic> backup,
    required int expectedRevision,
  }) => _request(
    '/diary/backup',
    method: 'PUT',
    body: {'backup': backup, 'expectedRevision': expectedRevision},
    authenticated: true,
  );

  Future<Map<String, dynamic>> deleteBackup(int expectedRevision) => _request(
    '/diary/backup',
    method: 'DELETE',
    body: {'expectedRevision': expectedRevision},
    authenticated: true,
  );

  Future<Map<String, dynamic>> _request(
    String path, {
    String method = 'GET',
    Map<String, Object?>? body,
    bool authenticated = false,
  }) async {
    if (!isConfigured) {
      throw const BloomApiException('API_BASE_URL_NOT_CONFIGURED');
    }
    final uri = Uri.parse('$_baseUrl/api/v1$path');
    final headers = <String, String>{'Accept': 'application/json'};
    if (_sessionCookie != null) headers['Cookie'] = _sessionCookie!;
    if (body != null) headers['Content-Type'] = 'application/json';
    if (authenticated && method != 'GET') {
      if (_sessionCookie == null || _csrfToken == null) {
        throw const BloomApiException('AUTH_REQUIRED', statusCode: 401);
      }
      headers['X-CSRF-Token'] = _csrfToken!;
    }

    late http.Response response;
    try {
      final request = http.Request(method, uri)
        ..headers.addAll(headers)
        ..followRedirects = false;
      if (body != null) request.body = jsonEncode(body);
      response = await http.Response.fromStream(await _client.send(request));
    } on Exception {
      throw const BloomApiException('SERVER_UNAVAILABLE');
    }

    final setCookie = response.headers['set-cookie'];
    if (setCookie != null) {
      final cookiePair = setCookie.split(';').first.trim();
      if (cookiePair.startsWith('bloom.sid=')) _sessionCookie = cookiePair;
      if (cookiePair.isEmpty || cookiePair.endsWith('=')) _sessionCookie = null;
    }

    dynamic decoded;
    try {
      decoded = jsonDecode(response.body);
    } on FormatException {
      throw BloomApiException(
        'SERVER_UNAVAILABLE',
        statusCode: response.statusCode,
      );
    }
    if (response.statusCode < 200 || response.statusCode >= 300) {
      if (response.statusCode == 401 &&
          decoded is Map &&
          decoded['error']?['code'] != 'INVALID_CREDENTIALS') {
        _csrfToken = null;
      }
      final error = decoded is Map ? decoded['error'] : null;
      throw BloomApiException(
        error is Map
            ? (error['code'] as String? ?? 'REQUEST_FAILED')
            : 'REQUEST_FAILED',
        statusCode: response.statusCode,
      );
    }
    if (decoded is! Map<String, dynamic> ||
        decoded['data'] is! Map<String, dynamic>) {
      throw BloomApiException(
        'SERVER_UNAVAILABLE',
        statusCode: response.statusCode,
      );
    }
    return decoded['data'] as Map<String, dynamic>;
  }

  void _acceptAuthData(Map<String, dynamic> data) {
    if (data['user'] is! Map<String, dynamic> || data['csrfToken'] is! String) {
      throw const BloomApiException('SERVER_UNAVAILABLE');
    }
    _csrfToken = data['csrfToken'] as String;
  }

  void _clearCredentials() {
    _sessionCookie = null;
    _csrfToken = null;
  }

  void close() => _client.close();
}
