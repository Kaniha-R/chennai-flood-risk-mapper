import unittest

from app import app


class ApiEndpointsTestCase(unittest.TestCase):
    def setUp(self):
        self.client = app.test_client()

    def test_dashboard_endpoint(self):
        response = self.client.get('/api/dashboard')
        self.assertEqual(response.status_code, 200)
        payload = response.get_json()
        self.assertTrue(payload['success'])
        self.assertIn('overall_risk', payload['data'])

    def test_risk_map_endpoint(self):
        response = self.client.get('/api/risk-map')
        self.assertEqual(response.status_code, 200)
        payload = response.get_json()
        self.assertTrue(payload['success'])
        self.assertIsInstance(payload['data'], list)

    def test_alerts_endpoint(self):
        response = self.client.get('/api/alerts')
        self.assertEqual(response.status_code, 200)
        payload = response.get_json()
        self.assertTrue(payload['success'])
        self.assertIsInstance(payload['data'], list)

    def test_routes_endpoint(self):
        response = self.client.post('/api/routes', json={'origin': 'Tambaram', 'destination': 'Central Station'})
        self.assertEqual(response.status_code, 200)
        payload = response.get_json()
        self.assertTrue(payload['success'])
        self.assertIn('routes', payload['data'])

    def test_scenario_endpoint(self):
        response = self.client.post('/api/scenario', json={'rainfall': 150})
        self.assertEqual(response.status_code, 200)
        payload = response.get_json()
        self.assertTrue(payload['success'])
        self.assertIn('risk_score', payload['data'])

    def test_system_status_endpoint(self):
        response = self.client.get('/api/system-status')
        self.assertEqual(response.status_code, 200)
        payload = response.get_json()
        self.assertTrue(payload['success'])
        self.assertIn('system', payload['data'])


if __name__ == '__main__':
    unittest.main()
