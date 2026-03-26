with open('app.js', 'r') as f:
    js = f.read()

# Replace literal newline inside the split string
js = js.replace('split("\n");', 'split("\\n");')

with open('app.js', 'w') as f:
    f.write(js)
