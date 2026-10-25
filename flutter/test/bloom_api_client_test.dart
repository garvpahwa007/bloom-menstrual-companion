import 'dart:convert';

import 'package:bloom_companion/features/cloud/services/bloom_api_client.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:http/http.dart' as http;
import 'package:http/testing.dart';

void main() {
  test(
    'keeps the session cookie and CSRF token in memory for mutations',
    () async {
      final requests = <http.Request>[];
      final client = BloomApiClient(
        baseUrl: 'https://api.example.test',
        client: MockClient((request) async {
          requests.add(request);
          if (request.url.path.endsWith('/auth/login')) {
            return http.Response(
              jsonEncode({
                'data': {
                  'user': {'id': 'u1', 'username': 'bloom_user'},
                  'csrfToken': 'csrf-memory-only',
                },
              }),
              200,
              headers: {
                'set-cookie': 'bloom.sid=session-memory-only; HttpOnly',
              },
            );
          }
          return http.Response(
            jsonEncode({
              'data': {'revision': 1},
            }),
            200,
          );
        }),
      );
      addTearDown(client.close);

      await client.login(
        username: 'bloom_user',
        password: 'a-long-test-password',
      );
      await client.uploadEncryptedBackup(
        backup: const {'format': 'test-encrypted-envelope'},
        expectedRevision: 0,
      );

      expect(requests, hasLength(2));
      expect(requests[0].url.path, '/api/v1/auth/login');
      expect(requests[1].url.path, '/api/v1/diary/backup');
      expect(requests[1].headers['cookie'], 'bloom.sid=session-memory-only');
      expect(requests[1].headers['x-csrf-token'], 'csrf-memory-only');
      expect(jsonDecode(requests[1].body), {
        'backup': {'format': 'test-encrypted-envelope'},
        'expectedRevision': 0,
      });
    },
  );
}
