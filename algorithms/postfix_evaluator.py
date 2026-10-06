"""
Postfix Expression Evaluator using a genuine Stack data structure.

Tokens are scanned left to right:
  - operand  -> PUSH
  - operator -> POP two operands, apply the operator, PUSH the result

This module never uses eval() or exec().
"""

import re


class Stack:
    """LIFO stack implemented with a Python list (top = last index)."""

    def __init__(self):
        self._items = []

    def push(self, item):
        """Insert an item at the top of the stack."""
        self._items.append(item)

    def pop(self):
        """Remove and return the top item. Raises IndexError if empty."""
        if self.is_empty():
            raise IndexError("Stack underflow: cannot pop from an empty stack.")
        return self._items.pop()

    def peek(self):
        """Return the top item without removing it."""
        if self.is_empty():
            raise IndexError("Stack is empty: cannot peek.")
        return self._items[-1]

    def is_empty(self):
        return len(self._items) == 0

    def size(self):
        return len(self._items)

    def snapshot(self):
        """Copy of stack contents from bottom to top (for visualization)."""
        return list(self._items)


class PostfixEvaluationError(Exception):
    """User-facing evaluation failure with a title and message."""

    def __init__(self, title, message):
        super().__init__(message)
        self.title = title
        self.message = message


_NUMBER_PATTERN = re.compile(r"^[+-]?(?:\d+\.?\d*|\.\d+)$")
_OPERATORS = {
    "+": lambda a, b: a + b,
    "-": lambda a, b: a - b,
    "*": lambda a, b: a * b,
    "/": lambda a, b: a / b,
    "%": lambda a, b: a % b,
    "^": lambda a, b: a ** b,
}
_OP_SYMBOLS = {"+": "+", "-": "−", "*": "×", "/": "÷", "%": "%", "^": "^"}


def _is_number(token):
    return bool(_NUMBER_PATTERN.match(token))


def _parse_number(token):
    value = float(token)
    if value.is_integer() and "." not in token and "e" not in token.lower():
        return int(value)
    return value


def _format_number(value):
    if isinstance(value, bool):
        return str(value)
    if isinstance(value, float) and value.is_integer():
        return str(int(value))
    if isinstance(value, float):
        return format(value, ".10g")
    return str(value)


def tokenize(expression):
    if expression is None or not str(expression).strip():
        raise PostfixEvaluationError(
            "Empty Expression",
            "Please enter a postfix expression, for example: 5 6 2 + *",
        )

    raw = str(expression).strip()
    tokens = raw.split()

    for token in tokens:
        if _is_number(token) or token in _OPERATORS:
            continue
        raise PostfixEvaluationError(
            "Invalid Character",
            f"Token '{token}' is not a valid number or operator. "
            "Allowed operators: +  -  *  /  %  ^",
        )
    return tokens, raw


def evaluate_postfix(expression):
    """
    Evaluate a space-separated postfix expression using Stack.

    Returns a dict with success, result, steps, counts, and optional error.
    """
    try:
        tokens, original = tokenize(expression)
        stack = Stack()
        steps = []
        push_count = 0
        pop_count = 0
        operations_performed = 0

        for token in tokens:
            if _is_number(token):
                value = _parse_number(token)
                stack.push(value)
                push_count += 1
                formatted = _format_number(value)
                steps.append({
                    "step": len(steps) + 1,
                    "token": token,
                    "action": f"PUSH {formatted}",
                    "operation_type": "push",
                    "pushed": formatted,
                    "popped_left": None,
                    "popped_right": None,
                    "formula": None,
                    "stack_before": [_format_number(x) for x in stack.snapshot()[:-1]],
                    "stack": [_format_number(x) for x in stack.snapshot()],
                })
                continue

            if token not in _OPERATORS:
                raise PostfixEvaluationError(
                    "Invalid Operator",
                    f"'{token}' is not a supported operator. Use + - * / % ^",
                )

            # Operator needs two operands. First pop is the RIGHT operand.
            if stack.size() < 2:
                available = stack.size()
                raise PostfixEvaluationError(
                    "Invalid Postfix Expression",
                    f"Operator '{token}' needs two operands on the stack, "
                    f"but only {available} {'is' if available == 1 else 'are'} available. "
                    "Check that the expression is true postfix (operators after operands).",
                )

            stack_before = [_format_number(x) for x in stack.snapshot()]
            right = stack.pop()
            left = stack.pop()
            pop_count += 2

            if token in ("/", "%") and right == 0:
                raise PostfixEvaluationError(
                    "Division by Zero",
                    f"Cannot perform '{_format_number(left)} {token} {_format_number(right)}' "
                    "because division or modulus by zero is undefined.",
                )

            try:
                result_value = _OPERATORS[token](left, right)
            except (OverflowError, ValueError, ZeroDivisionError):
                raise PostfixEvaluationError(
                    "Invalid Operation",
                    f"Could not apply operator '{token}' to "
                    f"{_format_number(left)} and {_format_number(right)}.",
                )

            if isinstance(result_value, complex):
                raise PostfixEvaluationError(
                    "Invalid Operation",
                    "This expression produced a complex number, which is not supported.",
                )

            stack.push(result_value)
            push_count += 1
            operations_performed += 1
            symbol = _OP_SYMBOLS[token]
            left_s = _format_number(left)
            right_s = _format_number(right)
            result_s = _format_number(result_value)
            formula = f"{left_s} {symbol} {right_s} = {result_s}"
            steps.append({
                "step": len(steps) + 1,
                "token": token,
                "action": (
                    f"POP {right_s}, POP {left_s} → {formula} → PUSH {result_s}"
                ),
                "operation_type": "operate",
                "pushed": result_s,
                "popped_left": left_s,
                "popped_right": right_s,
                "formula": formula,
                "stack_before": stack_before,
                "stack": [_format_number(x) for x in stack.snapshot()],
            })

        if stack.is_empty():
            raise PostfixEvaluationError(
                "Invalid Postfix Expression",
                "The stack is empty after evaluation. The expression has no result.",
            )

        if stack.size() > 1:
            leftover = ", ".join(_format_number(x) for x in stack.snapshot())
            raise PostfixEvaluationError(
                "Invalid Postfix Expression",
                f"Too many operands remain on the stack: [{leftover}]. "
                "A valid postfix expression leaves exactly one value after all operators.",
            )

        final_result = stack.pop()
        pop_count += 1

        return {
            "success": True,
            "result": _format_number(final_result),
            "expression": original,
            "steps": steps,
            "total_steps": len(steps),
            "operations_performed": operations_performed,
            "push_count": push_count,
            "pop_count": pop_count,
            "error": None,
        }

    except PostfixEvaluationError as err:
        return {
            "success": False,
            "result": None,
            "expression": str(expression).strip() if expression else "",
            "steps": [],
            "total_steps": 0,
            "operations_performed": 0,
            "push_count": 0,
            "pop_count": 0,
            "error": {"title": err.title, "message": err.message},
        }
    except Exception:
        return {
            "success": False,
            "result": None,
            "expression": str(expression).strip() if expression else "",
            "steps": [],
            "total_steps": 0,
            "operations_performed": 0,
            "push_count": 0,
            "pop_count": 0,
            "error": {
                "title": "Evaluation Error",
                "message": "The expression could not be evaluated. Check the tokens and try again.",
            },
        }
