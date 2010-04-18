
import time

scripts = [
    "init.js",
    "events.js",
    "urls.js",
]

concatenated = ""

for script in scripts:
    f = open("src/" + script)
    concatenated += f.read()

concatenated = concatenated.replace("$Date$", time.strftime("%a, %d %b %Y %H:%M:%S +0000", time.gmtime()))

verfile = open("version.txt")
concatenated = concatenated.replace("$Version$", verfile.read())

out = open("djsango.js", 'w')
out.write(concatenated)
out.close()


# Build a copy using Google Closure Compiler (TODO)