import json
import requests
import re
from bs4 import BeautifulSoup

base_url = 'http://catalog.mit.edu/subjects/'

courses = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 14, 15, 16, 17, 18, 20, 22, 24, 'AS', 'EC',
           'MS', 'NS', '21A', '21G', '21H', '21L', '21M', '21W', 'CMS', 'CON', 'CSB', 'ESD',
           'ESG', 'HST', 'ISP', 'MAS', 'STS', 'WGS']

with open('all_classes') as f:
    class_list = json.load(f)

classes = {}

for c in courses:
    r = requests.get(base_url + str(c).lower())
    soup = BeautifulSoup(r.content, "lxml")
    
    cblocks = soup.find_all("div", class_= "courseblock")

    for cb in cblocks:
        title = cb.find("h4", class_="courseblocktitle").text
        if title.split()[0].rstrip('[J]') not in class_list:
            continue

        num = title.split()[0].rstrip('[J]')

        classes[num] = {'name': ' '.join(title.split()[1:]),
                        'level': '',
                        'terms': [],
                        'desc': '',
                        'units1': 0,
                        'units2': 0,
                        'units3': 0,
                        'total_units': 0,
                        'REST': False,
                        'LAB': False,
                        'CI-H': False,
                        'CI-HW': False,
                        'HASS-H': False,
                        'HASS-A': False,
                        'HASS-S': False,
                        'HASS-E': False}

        terms = cb.find("span", class_="courseblockterms").text
        if 'U ' in terms:
            classes[num]['level'] = 'U'
        elif 'G ' in terms:
            classes[num]['level'] = 'G'

        if 'Fall' in terms:
            classes[num]['terms'].append('FA')
        if 'IAP' in terms:
            classes[num]['terms'].append('JA')
        if 'Spring' in terms:
            classes[num]['terms'].append('SP')
        if 'Summer' in terms:
            classes[num]['terms'].append('SU')

        hours = cb.find("span", class_="courseblockhours").text
        units = hours.split()[0].split('-')
        if len(units) == 3:
            classes[num]['units1'] = int(units[0])
            classes[num]['units2'] = int(units[1])
            classes[num]['units3'] = int(units[2])
            classes[num]['total_units'] = classes[num]['units1'] + classes[num]['units2'] + classes[num]['units3']

        if 'REST' in hours:
            classes[num]['REST'] = True
        if 'LAB' in hours:
            classes[num]['LAB'] = True
        if 'CI-HW' in hours:
            classes[num]['CI-HW'] = True
        if 'CI-H' in hours:
            classes[num]['CI-H'] = True
        if 'HASS-H' in hours:
            classes[num]['HASS-H'] = True
        if 'HASS-A' in hours:
            classes[num]['HASS-A'] = True
        if 'HASS-S' in hours:
            classes[num]['HASS-S'] = True
        if 'HASS-E' in hours:
            classes[num]['HASS-E'] = True

        desc = cb.find("p", class_="courseblockdesc").text
        classes[num]['desc'] = desc.strip()

        print(num)

with open("sublist", 'w') as f:
    json.dump(classes, f)

        
                                     
