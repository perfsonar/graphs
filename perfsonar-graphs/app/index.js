var component = require('./component');
require('./main.css')
var app = document.createElement('div');

document.body.appendChild(app);

app.appendChild(component());
