# Postfix Expression Evaluator Using Stack

## 1. Project Title

**StackLab — Postfix Expression Evaluator Using Stack**

## 2. Project Overview

StackLab is a college-level Data Structures and Algorithms web application. It evaluates postfix (Reverse Polish) expressions using a genuine Stack implementation and visualizes every PUSH and POP so students can see how LIFO evaluation works.

The backend is Python Flask. The postfix algorithm lives in a separate module and never uses `eval()` or `exec()`.

## 3. Problem Statement

Infix expressions are familiar, but computers often evaluate postfix form because operator precedence is already encoded in token order. The academic problem is:

> Given a space-separated postfix expression, evaluate it using a Stack and show each stack operation step by step.

## 4. Objectives

- Implement a real Stack class (`push`, `pop`, `peek`, `is_empty`, `size`).
- Evaluate postfix expressions without shortcut evaluators.
- Visualize stack growth and shrinkage with animations.
- Provide Play / Pause / Next Step / Reset playback of evaluation steps.
- Handle invalid input with clear, viva-friendly error messages.
- Explain the algorithm, complexity, and real-world stack applications.

## 5. Features

- Postfix input with integers, decimals, and multi-digit numbers
- Operators: `+` `-` `*` `/` `%` `^`
- Animated stack visualization (TOP → BOTTOM)
- Step-by-step table: Step | Token | Action | Stack
- Playback controls and progress bar
- Final result card
- Live status: Ready / Processing / Completed / Error
- PUSH / POP counters
- Dark / light theme
- Clickable example expressions
- Algorithm, complexity, and About DSA sections

## 6. Technologies Used

- Python 3
- Flask
- HTML5
- CSS3
- JavaScript

## 7. DSA Concept

A **Stack** is a linear LIFO structure. Only the top is accessed. In postfix evaluation, operands wait on the stack until an operator arrives. The two most recent operands are always at the top, so they can be popped, combined, and pushed back as a single result.

## 8. Algorithm

1. Create an empty stack.
2. Scan the postfix expression from left to right.
3. If the token is an operand, push it onto the stack.
4. If the token is an operator:
   - Pop the top operand (right operand).
   - Pop the second operand (left operand).
   - Apply the operator.
   - Push the result back onto the stack.
5. After all tokens, the remaining stack element is the final result.

Operand order matters: `6 2 -` means `6 - 2`, not `2 - 6`.

## 9. Stack Operations

| Operation | Meaning |
|-----------|---------|
| `push(x)` | Place `x` on the top |
| `pop()` | Remove and return the top |
| `peek()` | Read the top without removing it |
| `is_empty()` | True when the stack has no items |
| `size()` | Number of items |

## 10. Time Complexity

**O(n)** — each token is processed once. Stack operations are O(1).

## 11. Space Complexity

**O(n)** — in the worst case the stack holds every operand.

## 12. Project Structure

```
DSA project/
├── app.py
├── requirements.txt
├── README.md
├── algorithms/
│   ├── __init__.py
│   └── postfix_evaluator.py
├── templates/
│   └── index.html
└── static/
    ├── css/
    │   └── style.css
    └── js/
        └── script.js
```

## 13. Installation Steps

```bash
cd "C:\Users\Suraj Shetkar\OneDrive\Desktop\DSA project"
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
```

## 14. How to Run

```bash
python app.py
```

Open [http://127.0.0.1:5000](http://127.0.0.1:5000) in a browser.

## 15. Example Input / Output

| Expression | Result |
|------------|--------|
| `2 3 +` | `5` |
| `5 6 2 + *` | `40` |
| `10 2 8 * + 3 -` | `23` |
| `8 2 / 3 -` | `1` |
| `2.5 1.5 +` | `4` |
| `8 0 /` | Division by zero error |
| `5 +` | Insufficient operands |
| `5 6` | Too many operands |

## 16. Screenshots

Add screenshots here after running the app:

- Home / hero
- Stack visualization during Play
- Evaluation steps table
- Error state (division by zero)

## 17. Future Enhancements

- Infix-to-postfix conversion visualizer
- Prefix evaluation
- Adjustable playback speed
- Export step history as PDF
- User-defined unary minus handling without requiring spaces
