module.exports = {
  '*.{ts,html,css}': ['prettier --write', 'git add'],
  '*.ts': ['eslint --fix', 'git add']
};
