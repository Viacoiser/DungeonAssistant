import urllib.request
import json
import urllib.error

url = 'http://localhost:8000/api/auth/register'
data = {
    'email': 'antigravity_test_user@example.com',
    'password': 'SecurePassword123!',
    'username': 'antigravity_test'
}

req = urllib.request.Request(
    url,
    data=json.dumps(data).encode('utf-8'),
    headers={'Content-Type': 'application/json'}
)

try:
    with urllib.request.urlopen(req) as response:
        print("Status Code:", response.status)
        print("Response Body:", response.read().decode('utf-8'))
except urllib.error.HTTPError as e:
    print("HTTP Error Code:", e.code)
    print("Response Body:", e.read().decode('utf-8'))
except Exception as e:
    print("General Exception:", str(e))
