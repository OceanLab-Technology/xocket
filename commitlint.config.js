export default {
  extends: ['@commitlint/config-conventional'],
  rules: {
    // Bodies here explain why a fix is correct; that needs room.
    'body-max-line-length': [0],
    'footer-max-line-length': [0],
  },
};
