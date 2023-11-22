from pathlib import Path

from htmlthingy import Builder


builder = Builder()
builder.infiles = ['content.txt']
builder.infile2outfile = lambda infile: "html/musamatikka.html"

mathjax_config = '''
    MathJax = {
        tex: {
            inlineMath: [ ['$','$'] ],
            displayMath: [ ['$$','$$'] ],
            macros: {
                abs: [ "\\left| {#1} \\right|", 1 ],
                epsi: '\\varepsilon',
            }
        }
    };
'''

builder.get_head_extras = lambda filename: rf"""
    <link href="https://fonts.googleapis.com/css?family=Cabin|Quicksand" rel="stylesheet">
    <script>{Path('playNotes.js').read_text()}</script>
    <script id="MathJax-script" async src="https://cdn.jsdelivr.net/npm/mathjax@3.2.0/es5/tex-mml-chtml.js"></script>
    <script>{mathjax_config}</script>
    """


# prevent htmlthingy from processing what's between $ or $$
@builder.converter.add_inliner(r' \$[^ ][^$\n]*?[^ ]\$[\s,\.]')
@builder.converter.add_inliner(r'\$\$\n[\S\s]*?\n\$\$')
def math_handler(match, filename):
    return match.group(0)


# {C4 D4 E4} creates a play button that plays those notes
@builder.converter.add_inliner(r'\{(.*)\}')
def audio_handler(match, filename):
    return f'''<button onclick="playNotes('{match.group(1)}')">&#25B6;</button>'''


builder.run()
