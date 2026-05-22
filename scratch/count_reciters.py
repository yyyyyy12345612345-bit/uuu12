from pathlib import Path
text = Path('src/data/reciters.ts').read_text(encoding='utf8')
print(text.count('"id":'))
