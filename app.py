"""Flask application for the Postfix Expression Evaluator."""

from flask import Flask, jsonify, render_template, request

from algorithms.postfix_evaluator import evaluate_postfix

app = Flask(__name__)


@app.route("/")
def index():
    return render_template("index.html")


@app.route("/evaluate", methods=["POST"])
def evaluate():
    payload = request.get_json(silent=True) or {}
    expression = payload.get("expression", "")
    result = evaluate_postfix(expression)
    status_code = 200 if result["success"] else 400
    return jsonify(result), status_code


if __name__ == "__main__":
    app.run(debug=True)
