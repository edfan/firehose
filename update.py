from datetime import datetime, timedelta
import os
import shutil
import subprocess

OLD_TERM = "2022SP"
NEW_TERM = "2023FA"

# this are inclusive
START_DATE = "2022-09-07"
HALF_1_END_DATE = "2022-03-18"
HALF_2_START_DATE = "2022-03-28"
END_DATE = "2022-12-14"
MONDAY_SCHEDULE = "2022-09-12"
HOLIDAYS = [
    "2022-09-23",
    "2022-10-10",
    "2022-10-11",
    "2022-11-11",
    "2022-11-24",
    "2022-11-25",
]


def compute_dates(start, half_1_end, half_2_start, end, monday, holidays):
    DELTA_DAY = timedelta(days=1)
    start_dates = [""] * 5
    half_1_end_dates = [""] * 5
    half_2_start_dates = [""] * 5
    end_dates = [""] * 5
    r_dates = [""] * 5
    # ex_dates cannot be empty, so add a random date
    ex_dates = [["20000101"] for _ in range(5)]

    # fill start_dates, r_dates
    start = datetime.fromisoformat(start)
    while not all(d for d in start_dates):
        weekday = start.weekday()
        if 0 <= weekday <= 4:
            # yes, this is correct
            start_dates[weekday] = start.strftime("%Y-%m-%d")
            r_dates[weekday] = start.strftime("%Y%m%d")
        start += DELTA_DAY

    # fill half 1 end dates; move up one for inclusivity issues
    half_1_end = datetime.fromisoformat(half_1_end) + DELTA_DAY
    while not all(d for d in half_1_end_dates):
        weekday = half_1_end.weekday()
        if 1 <= weekday <= 5:
            half_1_end_dates[weekday - 1] = half_1_end.strftime("%Y%m%d")
        half_1_end -= DELTA_DAY

    # fill half 2 start dates
    half_2_start = datetime.fromisoformat(half_2_start)
    while not all(d for d in half_2_start_dates):
        weekday = half_2_start.weekday()
        if 0 <= weekday <= 4:
            half_2_start_dates[weekday] = half_2_start.strftime("%Y-%m-%d")
        half_2_start += DELTA_DAY

    # due to inclusivity issues, we actually move the end_dates up one
    end = datetime.fromisoformat(end) + DELTA_DAY
    while not all(d for d in end_dates):
        weekday = end.weekday()
        if 1 <= weekday <= 5:
            end_dates[weekday - 1] = end.strftime("%Y%m%d")
        end -= DELTA_DAY

    # handle holidays
    if monday:
        # the only possibility is that a tuesday becomes a monday
        date = datetime.fromisoformat(monday)
        r_dates[1] = date.strftime("%Y%m%d")
    for d in holidays:
        date = datetime.fromisoformat(d)
        ex_dates[date.weekday()].append(date.strftime("%Y%m%d"))

    return (
        start_dates,
        half_1_end_dates,
        half_2_start_dates,
        end_dates,
        r_dates,
        ex_dates,
    )


class Term:
    def __init__(self, name):
        self.name = name

        self.sem = name[4].lower()
        if self.sem == "f":
            self.sem_full = "fall"
            self.sem_full_caps = "Fall"
        elif self.sem == "s":
            self.sem_full = "spring"
            self.sem_full_caps = "Spring"
        elif self.sem == "j":
            self.sem = "i"
            self.sem_full = "iap"
            self.sem_full_caps = "IAP"

        self.name_year = name[:4]
        self.actual_year = self.name_year
        if self.sem == "f":
            self.actual_year = str(int(self.name_year) - 1)

        self.sem_year = f"{self.sem}{self.actual_year[-2:]}"
        self.sem_full_year = f"{self.sem_full}{self.actual_year[-2:]}"
        self.full_name = f"{self.sem_full_caps} {self.actual_year}"


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
# exception: should not be src="full.js",
#            in this case, replace with "fall/spring.js"
# exception: should not be src="script-compiled.js"
new_lines = []
for line in lines:
    if not any(
        s in line for s in ['src="http', 'src="full.js"', 'src="script-compiled.js"']
    ):
        line = line.replace('src="', 'src="../../')
    if 'src="full.js"' in line:
        line = line.replace("full.js", f"{old_term.sem_full}.js")
    new_lines.append(line)
lines = new_lines[:]

new_lines = []
# in old_term_file, replace href=" to href="../../
# exception: should not start with href="http or href="mailto or href="data
for line in lines:
    if not any(s in line for s in ['href="http', 'href="mailto', 'href="data']):
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
            # it's already been added i guess
            if new_term.full_name in line:
                new_lines.append(line)
                flag = "done"
                continue
            # otherwise, ignore this line
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
    if old_term.sem_year in folder.path:
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
print("this might not work, if it fails run new_scripts/update_schedule.sh manually:")
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
(
    start_dates,
    half_1_end_dates,
    half_2_start_dates,
    end_dates,
    r_dates,
    ex_dates,
) = compute_dates(
    START_DATE, HALF_1_END_DATE, HALF_2_START_DATE, END_DATE, MONDAY_SCHEDULE, HOLIDAYS
)
new_lines = []
indent = "\t" * 3
for line in lines:
    if "var start_dates =" in line:
        line = f"{indent}var start_dates = {repr(start_dates)};\n"
    elif "var half_1_end_dates =" in line:
        line = f"{indent}var half_1_end_dates = {repr(half_1_end_dates)};\n"
    elif "var half_2_start_dates =" in line:
        line = f"{indent}var half_2_start_dates = {repr(half_2_start_dates)};\n"
    elif "var end_dates =" in line:
        line = f"{indent}var end_dates = {repr(end_dates)};\n"
    elif "var r_dates =" in line:
        line = f"{indent}var r_dates = {repr(r_dates)};\n"
    elif "var ex_dates =" in line:
        line = f"{indent}var ex_dates = {repr(ex_dates)};\n"
    new_lines.append(line)

with open(script_js, "w") as file:
    file.writelines(new_lines)

# recompile using new_scripts/compile.sh
print("this might not work, if it fails run new_scripts/compile.sh manually:")
subprocess.run("./new_scripts/compile.sh", shell=True)
