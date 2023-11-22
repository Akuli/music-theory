# Music theory for mathematicians (in Finnish)

**The site is online here:** https://akuli.github.io/music-theory/

This site is built with [htmlthingy](https://github.com/Akuli/htmlthingy).
It is a tiny library for generating static HTML.

Building:

```
$ python3 -m venv env
$ source env/bin/activate
$ pip install -r requirements.txt
$ python3 build.py
```

This creates a file `html/index.html` that you can open in browser.
The build bundles everything into a single, self-contained `.html` file.

Pushing to `main` triggers a deploy to GitHub Pages as configured in `.github/workflows/`.
