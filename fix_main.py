import re

with open('backend/api/main.py', 'r') as f:
    content = f.read()

# Fix the duplicate brace errors introduced by sed
content = content.replace("]}}", "]}")
content = content.replace("]}    }", "]    }")

with open('backend/api/main.py', 'w') as f:
    f.write(content)
