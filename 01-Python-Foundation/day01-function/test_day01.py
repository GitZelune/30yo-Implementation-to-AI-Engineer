import unittest

from atm_demo import deposit, withdraw
from function_basics import age_message, check_temperature, format_transaction, is_adult


class FunctionBasicsTest(unittest.TestCase):
    def test_single_parameter_temperature_function(self):
        self.assertIn("体温正常", check_temperature(37.3))
        self.assertIn("需要隔离", check_temperature(39.3))

    def test_multiple_parameter_transaction_function(self):
        message = format_transaction("周杰伦", "存款", 500)
        self.assertEqual(message, "周杰伦，您好，您存款500.00元成功")

    def test_return_value(self):
        self.assertTrue(is_adult(18))
        self.assertEqual(age_message(17), "未成年，不可进入")

    def test_atm_deposit_and_withdraw(self):
        accounts = {"测试客户": 1000.0}
        self.assertEqual(deposit("测试客户", 200, accounts), 1200.0)
        self.assertTrue(withdraw("测试客户", 500, accounts))
        self.assertEqual(accounts["测试客户"], 700.0)

    def test_atm_rejects_insufficient_balance(self):
        accounts = {"测试客户": 100.0}
        self.assertFalse(withdraw("测试客户", 200, accounts))
        self.assertEqual(accounts["测试客户"], 100.0)


if __name__ == "__main__":
    unittest.main()
