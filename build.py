
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
 * Version: $Version$
 * Date: $Date$
 */
"""


for script in scripts:
    f = open("src/" + script)
    concatenated += "\n\n\n// File: %s ---------------------------------------------------------------\n\n" % script
    concatenated += f.read()

concatenated = concatenated.replace("$Date$", time.strftime("%a, %d %b %Y %H:%M:%S +0000", time.gmtime()))

verfile = open("VERSION")
concatenated = concatenated.replace("$Version$", verfile.read())

out = open("djsango.js", 'w+b')
out.write(concatenated)
out.close()


# Build a copy using Google Closure Compiler (TODO)