
import time

scripts = [
    "init.js",
    "events.js",
    "urls.js",
]

concatenated = ""

count = 0
for script in scripts:
    f = open("src/" + script)
    count += 1
    
    if count > 1:
        concatenated += "\n\n\n// File: %s ###########################################\n\n" % script
    concatenated += f.read()

concatenated = concatenated.replace("$Date$", time.strftime("%a, %d %b %Y %H:%M:%S +0000", time.gmtime()))

verfile = open("version.txt")
concatenated = concatenated.replace("$Version$", verfile.read())

out = open("djsango.js", 'w')
out.write(concatenated)
out.close()


# Build a copy using Google Closure Compiler (TODO)