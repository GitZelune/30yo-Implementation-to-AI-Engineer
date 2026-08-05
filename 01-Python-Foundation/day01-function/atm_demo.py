"""Day 01 综合案例：使用函数组织一个命令行 ATM。"""

ACCOUNTS = {
    "周杰伦": 5_000_000.0,
    "王力宏": 5_000_000.0,
    "张学友": 5_000_000.0,
}


def query_balance(name: str, accounts: dict[str, float]) -> float:
    """查询并返回指定客户的余额。"""
    balance = accounts[name]
    print(f"{name}，您好，您当前账户余额为：{balance:.2f}元")
    return balance


def deposit(name: str, amount: float, accounts: dict[str, float]) -> float:
    """存款并返回新的余额。"""
    validate_amount(amount)
    accounts[name] += amount
    print(f"{name}，您好，您存款{amount:.2f}元成功")
    return query_balance(name, accounts)


def withdraw(name: str, amount: float, accounts: dict[str, float]) -> bool:
    """余额充足时取款，返回操作是否成功。"""
    validate_amount(amount)
    if amount > accounts[name]:
        print("余额不足，取款失败！")
        return False
    accounts[name] -= amount
    print(f"{name}，您好，您取款{amount:.2f}元成功")
    query_balance(name, accounts)
    return True


def validate_amount(amount: float) -> None:
    """公共校验函数：金额必须大于零。"""
    if amount <= 0:
        raise ValueError("金额必须大于零")


def register(name: str, accounts: dict[str, float]) -> None:
    """注册新客户并将初始余额设为零。"""
    accounts[name] = 0.0
    print(f"注册成功，欢迎加入，{name}！")


def read_amount(prompt: str) -> float:
    """循环读取金额，直到用户输入有效数字。"""
    while True:
        try:
            return float(input(prompt))
        except ValueError:
            print("输入无效，请输入正确的数字。")


def main_menu(name: str, accounts: dict[str, float]) -> None:
    """主菜单：使用字典建立选项与函数之间的映射。"""
    while True:
        print(f"\n{name}，您好，欢迎来到黑马银行 ATM")
        print("查询余额 [输入1]")
        print("存款     [输入2]")
        print("取款     [输入3]")
        print("退出     [输入4]")

        choice = input("请输入您的选择：").strip()
        actions = {
            "1": lambda: query_balance(name, accounts),
            "2": lambda: deposit(name, read_amount("请输入存款金额："), accounts),
            "3": lambda: withdraw(name, read_amount("请输入取款金额："), accounts),
        }

        if choice == "4":
            print("感谢使用黑马银行 ATM，欢迎下次光临！")
            return
        action = actions.get(choice)
        if action is None:
            print("输入无效，请输入 1~4 的数字！")
            continue
        try:
            action()
        except ValueError as error:
            print(error)


def start() -> None:
    name = input("请输入您的姓名：").strip()
    if name not in ACCOUNTS:
        register_choice = input("您还不是客户，是否注册？(y/n)：").strip().lower()
        if register_choice != "y":
            print("欢迎下次光临！")
            return
        register(name, ACCOUNTS)
    main_menu(name, ACCOUNTS)


if __name__ == "__main__":
    start()
