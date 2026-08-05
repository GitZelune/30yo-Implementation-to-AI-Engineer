# Day 01 — Python 函数

> 学习来源：黑马程序员 Python 课程
> 学习日期：2026-08-04
> 学习证据：个人练习文件 `黑马学习.py`

## 今天学了什么

### 1. 定义并调用无参函数

函数使用 `def` 定义。无参函数不需要从调用者接收数据，适合封装固定、重复的动作。

```python
def show_welcome():
    print("欢迎来到黑马程序员")

show_welcome()
```

### 2. 定义单个形参函数

形参让同一个函数能够处理不同输入。体温检测练习通过一个 `temperature` 参数执行条件判断。

```python
def check_temperature(temperature):
    if temperature <= 37.5:
        return "体温正常，请进"
    return "体温异常，需要隔离"
```

### 3. 定义多个形参函数

多个形参可以共同描述一次业务操作。ATM 练习中的客户、业务类型和金额，可以作为不同参数传入。

```python
def format_transaction(customer, action, amount):
    return f"{customer}，您{action}{amount:.2f}元成功"
```

### 4. 使用返回值

`return` 把函数处理结果交给调用者。年龄判断练习使用返回值表示是否成年，再由另一个函数决定输出内容。

### 5. 将多个函数组合成业务程序

综合练习实现了一个命令行 ATM：

- 查询余额；
- 存款；
- 取款；
- 用户注册；
- 主菜单；
- 输入错误处理；
- 使用字典完成“选项 → 函数”的映射。

## 代码文件

| 文件 | 内容 |
|---|---|
| [`function_basics.py`](./function_basics.py) | 无参、单形参、多形参与返回值 |
| [`atm_demo.py`](./atm_demo.py) | ATM 综合案例的整理版本 |
| [`original_practice.py`](./original_practice.py) | 根据原始学习文件保留的练习过程 |
| [`notes.md`](./notes.md) | 概念、问题与复盘 |

## 运行

```bash
python3 function_basics.py
python3 atm_demo.py
```

## 完成标准

- [x] 能独立定义并调用无参函数
- [x] 能使用一个形参处理动态输入
- [x] 能定义并调用多个形参函数
- [x] 理解 `return` 与 `print` 的区别
- [x] 能把 ATM 业务拆分为多个函数
- [ ] 继续练习默认参数、关键字参数和变量作用域
