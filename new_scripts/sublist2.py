import json
import requests
import re
from bs4 import BeautifulSoup

base_url = "http://student.mit.edu/catalog/search.cgi?search="

with open('all_classes') as f:
    class_list = json.load(f)

classes = {}

for c in class_list:
    try:
        r = requests.get(base_url + c)
        soup = BeautifulSoup(r.content, "lxml")

        start = soup.h3
        num = c

        classes[num] = {'name': ' '.join(start.text.strip().split()[1:]),
                        'level': 'U',
                        'terms': [],
                        'desc': '',
                        'prereq': '',
                        'times': '',
                        'units1': 0,
                        'units2': 0,
                        'units3': 0,
                        'total_units': 0,
                        'repeat': False,
                        'REST': False,
                        'LAB': False,
                        'pLAB': False,
                        'CI-H': False,
                        'CI-HW': False,
                        'HASS-H': False,
                        'HASS-A': False,
                        'HASS-S': False,
                        'HASS-E': False}

        level = start.findNext('img').findNext('img')
        if 'Undergrad' in str(level):
            classes[num]['level'] = 'U'
        elif 'Graduate' in str(level):
            classes[num]['level'] = 'G'

        gterms = ['Fall', 'IAP', 'Spring', 'Summer']
        terms = [level.findNext()]
        while True:
            next_term = terms[-1].findNext()
            if not any(x in str(next_term) for x in gterms):
                break
            terms.append(next_term)
            
        for term in terms:
            if 'Fall' in str(term):
                classes[num]['terms'].append('FA')
            if 'IAP' in str(term):
                classes[num]['terms'].append('JA')
            if 'Spring' in str(term):
                classes[num]['terms'].append('SP')
            if 'Summer' in str(term):
                classes[num]['terms'].append('SU')

        others = [terms[-1]]
        while True:
            next_other = others[-1].findNext()
            if str(next_other) == '<br/>':
                break
            others.append(next_other)
            
        for other in others:
            if 'repeat.gif' in str(other):
                classes[num]['repeat'] = True
            if 'rest.gif' in str(other):
                classes[num]['REST'] = True
            if 'PartLab.gif' in str(other):
                classes[num]['pLAB'] = True
            elif 'Lab.gif' in str(other):
                classes[num]['LAB'] = True
            if 'cihw.gif' in str(other):
                classes[num]['CI-HW'] = True
            if 'cih1.gif' in str(other):
                classes[num]['CI-H'] = True
            if 'hassH' in str(other):
                classes[num]['HASS-H'] = True
            if 'hassA' in str(other):
                classes[num]['HASS-A'] = True
            if 'hassS' in str(other):
                classes[num]['HASS-S'] = True
            if 'hassE' in str(other) or 'hassT' in str(other):
                classes[num]['HASS-E'] = True

        hours = soup.body.findAll(text=re.compile('Units'))[0].strip().split()[1]
        units = hours.split()[0].split('-')
        if len(units) == 3:
            classes[num]['units1'] = int(units[0])
            classes[num]['units2'] = int(units[1])
            classes[num]['units3'] = int(units[2])
            classes[num]['total_units'] = classes[num]['units1'] + classes[num]['units2'] + classes[num]['units3']

        prereq = soup.getText().split('Prereq:')
        if len(prereq) > 1:
            classes[num]['prereq'] = prereq[1].split('\n')[0].strip()
        else:
            classes[num]['prereq'] = 'None'

        desc = others[-1].findNext("img")
        while 'hr.gif' not in str(desc):
            desc = desc.findNext("img")

        desc = desc.findNext().nextSibling
        
        if desc != None:
            classes[num]['desc'] = desc.strip()

        print(num)
    except (AttributeError, TypeError):
        print("Failed:", num)

with open("sublist", 'w') as f:
    json.dump(classes, f)
