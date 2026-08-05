"""根据 `黑马学习.py` 整理保留的 Day01 学习过程。

原始文件包含大量注释与逐步试验。本文件保留相同知识点，统一了命名、
缩进与返回值写法，便于在 GitHub 阅读和运行。
"""

from function_basics import (
    age_message,
    check_temperature,
    format_transaction,
    show_welcome,
)


def run_learning_evidence() -> None:
    """按学习顺序执行四类函数练习。"""
    print("1. 无参函数")
    show_welcome()

    print("\n2. 单形参函数")
    print(check_temperature(34.6))
    print(check_temperature(39.3))

    print("\n3. 多形参函数")
    print(format_transaction("周杰伦", "存款", 50_000))

    print("\n4. 返回值")
    print(age_message(17))
    print(age_message(20))


if __name__ == "__main__":
    run_learning_evidence()
