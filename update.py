import fileinput
import os
import shutil
import subprocess
import sys

# i dont think this actually works for e.g. 2022JA
OLD_TERM = "2021SP"
NEW_TERM = "2022FA"

# sorry, you have to update these manually for now
START_DATES = ["2021-09-13", "2021-09-14", "2021-09-08", "2021-09-09", "2021-09-10"]
END_DATES = ["20211213", "20211214", "20211215", "20211216", "20211210"]
R_DATES = ["20210913", "20210914", "20210915", "20210916", "20210917"]
EX_DATES = [["20211011"], [], [], ["20211111", "20211125"], ["20211126"]]


class Term:
    def __init__(self, name):
        self.name = name

        self.sem = name[4].lower()
        if self.sem == "f":
            self.sem_full = "fall"
        elif self.sem == "s":
            self.sem_full = "spring"
        elif self.sem == "j":
            self.sem = "i"
            self.sem_full = "iap"

        self.name_year = name[:4]
        self.actual_year = self.name_year
        if self.sem == "f":
            self.actual_year = str(int(self.name_year) - 1)

        self.sem_year = f"{self.sem}{self.actual_year[-2:]}"
        self.sem_full_year = f"{self.sem_full}{self.actual_year[-2:]}"
        self.full_name = f"{self.sem_full.capitalize()} {self.actual_year}"


old_term = Term(OLD_TERM)
new_term = Term(NEW_TERM)

# make directory
www_dir = f"./www/"
# e.g. www/semesters/f21
old_term_dir = f"./www/semesters/{old_term.sem_year}/"
old_term_file = old_term_dir + f"{old_term.sem_full}.html"
os.makedirs(old_term_dir, exist_ok=True)

# copy files, rename script.js -> e.g. fall.js
shutil.copy(www_dir + "index.html", old_term_file)
shutil.copy(www_dir + "script-compiled.js", old_term_dir + "script-compiled.js")
shutil.copy(www_dir + "full.js", old_term_dir + f"{old_term.sem_full}.js")

with open(old_term_file, "r") as file:
    lines = file.readlines()

# in old_term_file, replace src=" to src="../../
# exception: should not start with src="http
# exception: should not be src="full.js"
# exception: should not be src="script-compiled.js"
new_lines = []
for line in lines:
    if not any(
        s in line for s in ['src="http', 'src="full.js"', 'src="script-compiled.js"']
    ):
        line = line.replace('src="', 'src="../../')
    new_lines.append(line)
lines = new_lines[:]

new_lines = []
# in old_term_file, replace href=" to href="../../
# exception: should not start with href="http or href="mailto
for line in lines:
    if not any(s in line for s in ['href="http', 'href="mailto"']):
        line = line.replace('href="', 'href="../../')
    new_lines.append(line)
lines = new_lines[:]

# in old_term_file, remove line with value="index.html" and add the (indented) line:
new_option = f'{" "*12}<option value="../{old_term.sem_year}/{old_term.sem_full}.html">{old_term.full_name}</option>\n'
# add "selected" option to this line
new_index = f'{" "*12}<option value="../../index.html">{new_term.full_name}</option>\n'
# add ^ above this line
# replace value="semesters with value="..


def update_dropdown(lines, replace_selected=False):
    new_lines = []
    flag = "not seen"
    for line in lines:
        if flag == "not seen":
            new_lines.append(line)
            if 'select name="semesters"' in line:
                flag = "seen"
        elif flag == "seen":
            # ignore this line
            new_lines.append(new_index)
            if replace_selected:
                new_lines.append(new_option.replace('">', '" selected>'))
            else:
                new_lines.append(new_option)
            flag = "done"
        elif flag == "done":
            new_lines.append(line.replace('value="semesters', 'value="..'))
    return new_lines


with open(old_term_file, "w") as file:
    file.writelines(update_dropdown(lines, True))

# in all files in old semesters, find the line with value="../../index.html"
# replace with the new index line, then add the line for e.g. Fall 2021
for folder in os.scandir("./www/semesters"):
    if not folder.is_dir():
        continue
    for path in os.scandir(folder):
        if not path.name.endswith(".html"):
            continue
        with open(path, "r") as file:
            lines = file.readlines()
        with open(path, "w") as file:
            file.writelines(update_dropdown(lines))

# update new_scripts/coursews.py term
coursews_path = "./new_scripts/coursews.py"
with open(coursews_path, "r") as file:
    lines = file.readlines()

new_lines = []
for line in lines:
    if line.startswith("term ="):
        new_lines.append(f"term = '{new_term.name}'\n")
    else:
        new_lines.append(line)

with open(coursews_path, "w") as file:
    file.writelines(new_lines)

# run normal update process
# something something some classes need special casing
subprocess.run("./new_scripts/update_schedule.sh", shell=True)

# in (new) index.html:
new_term_file = "./www/index.html"
with open(new_term_file, "r") as file:
    lines = file.readlines()

# update dropdown
new_lines = []
flag = "not seen"
for line in lines:
    if flag == "not seen":
        new_lines.append(line)
        if 'select name="semesters"' in line:
            flag = "seen"
    elif flag == "seen":
        # ignore this line
        new_lines.append(
            f'{" "*12}<option value="index.html" selected>{new_term.full_name}</option>\n'
        )
        new_lines.append(
            f'{" "*12}<option value="semesters/{old_term.sem_year}/{old_term.sem_full}.html">{old_term.full_name}</option>\n'
        )
        flag = "done"
    elif flag == "done":
        new_lines.append(line)
lines = new_lines[:]

# fix comma placement
new_lines = []
for line in lines:
    if 'title="Fall"' in line:
        if new_term.sem == "f":  # remove comma
            line = line.replace("/>,<", "/><")
        elif new_term.sem == "s":  # add comma
            line = line.replace("/><", "/>,<")
    elif 'id="spring-span"' in line:
        if new_term.sem == "f":  # add comma
            line = line.replace("><", ">,<")
        elif new_term.sem == "s":  # remove comma
            line = line.replace(">,<", "><")
    new_lines.append(line)
lines = new_lines[:]

# change Not offered 20xx-20yy in index.html
new_lines = []
for line in lines:
    if "Not offered" in line:
        line = f'          class="lazyload-img" data-toggle="tooltip" data-placement="top" title="Not offered {new_term.name_year}-{str(int(new_term.name_year) + 1)}" data-trigger="hover"/></span><span\n'
    new_lines.append(line)

with open(new_term_file, "w") as file:
    file.writelines(new_lines)

# in script.js:
script_js = "./www/script.js"
with open(script_js, "r") as file:
    lines = file.readlines()

# replace fall20 -> spring21
# replace Fall 2020 -> Spring 2021
new_lines = []
for line in lines:
    new_lines.append(
        line.replace(old_term.sem_full_year, new_term.sem_full_year).replace(
            old_term.full_name, new_term.full_name
        )
    )
lines = new_lines[:]

# update the mit schedule for gcal export in script.js
new_lines = []
indent = "\t"*3
for line in lines:
    if "var start_dates =" in line:
        line = f'{indent}var start_dates = {repr(START_DATES)};\n'
    elif "var end_dates =" in line:
        line = f'{indent}var end_dates = {repr(END_DATES)};\n'
    elif "var r_dates =" in line:
        line = f'{indent}var r_dates = {repr(R_DATES)};\n'
    elif "var ex_dates =" in line:
        line = f'{indent}var ex_dates = {repr(EX_DATES)};\n'
    new_lines.append(line)

with open(script_js, "w") as file:
    file.writelines(new_lines)

# recompile using new_scripts/compile.sh
subprocess.run("./new_scripts/compile.sh", shell=True)
