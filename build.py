import textwrap
from pathlib import Path

from htmlthingy import Builder


builder = Builder()
builder.infiles = ['content.txt']
builder.infile2outfile = lambda infile: "html/musamatikka.html"
builder.additional_files = []

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
    <style>{Path('style.css').read_text()}</style>
    <script>{Path('playNotes.js').read_text()}</script>
    <script id="MathJax-script" async src="https://cdn.jsdelivr.net/npm/mathjax@3.2.0/es5/tex-mml-chtml.js"></script>
    <script>{mathjax_config}</script>
    """


# prevent htmlthingy from processing what's between $ or $$
@builder.converter.add_inliner(r'\$[^ ][^$\n]*?[^ ]\$[\s,\.]')
@builder.converter.add_inliner(r'\$\$\n[\S\s]*?\n\$\$')
def math_handler(match, filename):
    return match.group(0)


# {C4 D4 E4} creates a play button that plays those notes
@builder.converter.add_inliner(r'\{([^{}\'"\\\n]+)\}')
def audio_handler(match, filename):
    return f'''<button onclick="playNotes('{match.group(1)}')">▶</button>'''


# [C4] creates a button that displays C4 and also plays C4
@builder.converter.add_inliner(r'\[([A-H])([#b]?)(-?\d+)?\]')
def single_note_handler(match, filename):
    letter, sharp_or_flat, number = match.groups()
    note_string = letter + sharp_or_flat

    if number is None:
        # TODO: create some kind of "play simultaneously at all octaves" thing
        if letter == 'A' or letter == 'B':
            note_string += "3"
        else:
            note_string += "4"
    else:
        note_string += number

    mathjax_note_string = letter + sharp_or_flat.replace('#', r'\#')
    if number is not None:
        mathjax_note_string += '_'
        mathjax_note_string += '{' + number + '}'

    return f'''<button onclick="playNotes('{note_string}')">${mathjax_note_string}$</button>'''


@builder.converter.add_multiliner(r'^python:\n')
def python_handler(match, filename):
    namespace = {"builder": builder, 'filename': filename}
    exec("def get_the_string():\n" + match.string[match.end():], namespace)
    return eval("get_the_string()", namespace)


@builder.converter.add_multiliner(r'^center:\n')
def center_handler(match, filename):
    content = textwrap.dedent(match.string[match.end():])
    yield '<div style="margin-left:auto; margin-right:auto; text-align:center">'
    yield from builder.converter.convert(content, filename)
    yield '</div>'


@builder.converter.add_multiliner(r'^(definition|theorem|proof|example):\n')
def box_handler(match, filename):
    content = textwrap.dedent(match.string[match.end():])
    yield f'<div class="box {match.group(1)}">'

    if match.group(1) == 'definition':
        yield '<h4>Määritelmä</h4>'
    elif match.group(1) == 'theorem':
        yield '<h4>Lause</h4>'
    elif match.group(1) == 'proof':
        yield '<h4>Todistus</h4>'
    elif match.group(1) == 'example':
        yield '<h4>Esimerkki</h4>'
    else:
        raise NotImplementedError

    yield from builder.converter.convert(content, filename)
    yield '</div>'


builder.run()
