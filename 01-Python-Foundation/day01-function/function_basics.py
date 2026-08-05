"""Day 01：Python 函数基础练习。

包含无参函数、单形参函数、多形参函数与返回值。
"""


def show_welcome() -> None:
    """无参函数：输出固定欢迎信息。"""
    print("欢迎来到黑马程序员")
    print("请出示您的健康码以及72小时核酸证明")


def check_temperature(temperature: float) -> str:
    """单形参函数：根据体温返回检测结论。"""
    if temperature <= 37.5:
        return f"您的体温是 {temperature:.1f} 度，体温正常，请进！"
    return f"您的体温是 {temperature:.1f} 度，需要隔离！"


def format_transaction(customer: str, action: str, amount: float) -> str:
    """多形参函数：组合客户、业务类型和金额。"""
    if amount < 0:
        raise ValueError("金额不能为负数")
    return f"{customer}，您好，您{action}{amount:.2f}元成功"


def is_adult(age: int) -> bool:
    """返回值练习：返回布尔值，而不是只在函数内部打印。"""
    return age >= 18


def age_message(age: int) -> str:
    """调用另一个函数，并根据其返回值生成结果。"""
    return "已成年，可以进入" if is_adult(age) else "未成年，不可进入"


if __name__ == "__main__":
    show_welcome()
    print(check_temperature(37.3))
    print(check_temperature(39.3))
    print(format_transaction("周杰伦", "存款", 50000))
    print(age_message(20))
