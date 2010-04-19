
import time

scripts = [
    "init.js",
    "events.js",
    "urls.js",
]

concatenated = """/*!
 * Djsango: A Django-esque framework for client-side web applications
 * By @westonruter; http://weston.ruter.net/
 * Project URL: http://github.com/westonruter/djsango
 * MIT/GPL license.
 * Developed at Shepherd Interactive <http://shepherdinteractive.com/>
 * Version: 0.1
 * Date: Mon, 19 Apr 2010 06:50:08 +0000
 */
"""


for script in scripts:
    f = open("src/" + script)
    concatenated += "\n\n\n// File: %s ---------------------------------------------------------------\n\n" % script
    concatenated += f.read()

concatenated = concatenated.replace("$Date$", time.strftime("%a, %d %b %Y %H:%M:%S +0000", time.gmtime()))

verfile = open("version.txt")
concatenated = concatenated.replace("$Version$", verfile.read())

out = open("djsango.js", 'w')
out.write(concatenated)
out.close()


# Build a copy using Google Closure Compiler (TODO)