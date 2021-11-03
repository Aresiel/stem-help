module.exports = {
  "extends": "stylelint-config-recommended",
  "rules": {
    "at-rule-no-unknown": [ true, {
      "ignoreAtRules": [
        "extends",
        "tailwind"
      ]
    }],
    "block-no-empty": null,
    "unit-allowed-list": ["em", "rem", "s"]
  }
}